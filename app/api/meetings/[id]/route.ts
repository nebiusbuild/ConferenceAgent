import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRoomAvailability } from '@/lib/availability';
import { scheduleJobsForMeeting, cancelJobsForMeeting } from '@/lib/jobs/queue';
import { runAgent } from '@/lib/agent';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        room: true,
        contact: true,
        salesRep: true,
        agentLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meeting' },
      { status: 500 }
    );
  }
}

const updateMeetingSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(['CONFIRMED', 'RESCHEDULING', 'PENDING', 'CANCELLED', 'COMPLETED']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  roomId: z.string().optional(),
  salesRepId: z.string().optional(),
  notes: z.string().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const parsed = updateMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.meeting.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    const data = parsed.data;
    const isRescheduling = data.startTime || data.endTime || data.roomId;

    // If time or room is changing, check availability
    if (isRescheduling) {
      const newStart = data.startTime ? new Date(data.startTime) : existing.startTime;
      const newEnd = data.endTime ? new Date(data.endTime) : existing.endTime;
      const newRoomId = data.roomId ?? existing.roomId;

      if (newEnd <= newStart) {
        return NextResponse.json(
          { error: 'End time must be after start time' },
          { status: 400 }
        );
      }

      const { available } = await checkRoomAvailability(newRoomId, newStart, newEnd, id);
      if (!available) {
        return NextResponse.json(
          { error: 'Room is not available for the requested time slot' },
          { status: 409 }
        );
      }
    }

    // Build update data with proper Date conversion
    const updateData: Record<string, unknown> = { ...data };
    if (data.startTime) updateData.startTime = new Date(data.startTime);
    if (data.endTime) updateData.endTime = new Date(data.endTime);

    const meeting = await prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        room: true,
        contact: true,
        salesRep: true,
      },
    });

    // Reschedule jobs if time changed
    if (isRescheduling) {
      await cancelJobsForMeeting(id);
      await scheduleJobsForMeeting(meeting);
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to update meeting' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: { contact: true },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'Meeting not found' },
        { status: 404 }
      );
    }

    // Cancel scheduled jobs
    await cancelJobsForMeeting(id);

    // Update status to cancelled
    await prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Notify contact via agent
    await runAgent({
      type: 'CONFIRMATION',
      instruction: 'Notify the contact that their meeting has been cancelled',
      meetingId: id,
    });

    return NextResponse.json({ message: 'Meeting cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling meeting:', error);
    return NextResponse.json(
      { error: 'Failed to cancel meeting' },
      { status: 500 }
    );
  }
}
