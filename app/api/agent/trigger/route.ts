import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/agent';
import { syncMeetingToHubSpot } from '@/lib/hubspot';
import { startOperation, finishOperation } from '@/lib/agent/abort';

const triggerSchema = z.object({
  type: z.enum(['REMINDER', 'FOLLOWUP', 'HUBSPOT_SYNC']),
  meetingId: z.string().optional(),
  scope: z.enum(['next_hour', 'all']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = triggerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { type, meetingId, scope } = parsed.data;
    const results: Array<{ meetingId: string; status: string }> = [];
    const signal = startOperation(type);

    try {
      if (type === 'REMINDER') {
        if (scope === 'next_hour') {
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

          const meetings = await prisma.meeting.findMany({
            where: {
              startTime: { gte: now, lte: oneHourLater },
              status: 'CONFIRMED',
            },
            include: { contact: true, salesRep: true, room: true },
          });

          for (const meeting of meetings) {
            if (signal.aborted) {
              results.push({ meetingId: meeting.id, status: 'stopped' });
              continue;
            }
            try {
              await runAgent({
                type: 'REMINDER',
                instruction: 'Send a meeting reminder to the contact',
                meetingId: meeting.id,
              });
              results.push({ meetingId: meeting.id, status: 'sent' });
            } catch (err) {
              console.error(`Failed to send reminder for meeting ${meeting.id}:`, err);
              results.push({ meetingId: meeting.id, status: 'failed' });
            }
          }
        } else if (meetingId) {
          await runAgent({
            type: 'REMINDER',
            instruction: 'Send a meeting reminder to the contact',
            meetingId,
          });
          results.push({ meetingId, status: 'sent' });
        } else {
          return NextResponse.json(
            { error: 'meetingId or scope "next_hour" is required for REMINDER' },
            { status: 400 }
          );
        }
      }

      if (type === 'FOLLOWUP') {
        if (!meetingId) {
          return NextResponse.json(
            { error: 'meetingId is required for FOLLOWUP' },
            { status: 400 }
          );
        }

        await runAgent({
          type: 'FOLLOWUP',
          instruction: 'Send a follow-up message after the meeting',
          meetingId,
        });
        results.push({ meetingId, status: 'sent' });
      }

      if (type === 'HUBSPOT_SYNC') {
        if (meetingId) {
          const meeting = await prisma.meeting.findUnique({
            where: { id: meetingId },
            include: { contact: true, salesRep: true, room: true },
          });

          if (!meeting) {
            return NextResponse.json(
              { error: 'Meeting not found' },
              { status: 404 }
            );
          }

          await syncMeetingToHubSpot(meeting);
          results.push({ meetingId, status: 'synced' });
        } else if (scope === 'all') {
          const meetings = await prisma.meeting.findMany({
            where: { status: { not: 'CANCELLED' } },
            include: { contact: true, salesRep: true, room: true },
          });

          for (const meeting of meetings) {
            if (signal.aborted) {
              results.push({ meetingId: meeting.id, status: 'stopped' });
              continue;
            }
            try {
              await syncMeetingToHubSpot(meeting);
              results.push({ meetingId: meeting.id, status: 'synced' });
            } catch (err) {
              console.error(`Failed to sync meeting ${meeting.id}:`, err);
              results.push({ meetingId: meeting.id, status: 'failed' });
            }
          }
        } else {
          return NextResponse.json(
            { error: 'meetingId or scope "all" is required for HUBSPOT_SYNC' },
            { status: 400 }
          );
        }
      }

      const stopped = signal.aborted;
      return NextResponse.json({
        type,
        processed: results.filter((r) => r.status !== 'stopped').length,
        stopped,
        results,
      });
    } finally {
      finishOperation(type);
    }
  } catch (error) {
    console.error('Error triggering agent action:', error);
    return NextResponse.json(
      { error: 'Failed to trigger agent action' },
      { status: 500 }
    );
  }
}
