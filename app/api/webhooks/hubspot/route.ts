import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // HubSpot sends an array of webhook events
    const events = Array.isArray(body) ? body : [body];

    const results: Array<{ eventId: string; status: string }> = [];

    for (const event of events) {
      const {
        subscriptionType,
        objectId,
        propertyName,
        propertyValue,
        eventId,
      } = event;

      // Handle deal stage changes
      if (
        subscriptionType === 'deal.propertyChange' &&
        propertyName === 'dealstage'
      ) {
        try {
          // Find meeting linked to this HubSpot deal
          const meeting = await prisma.meeting.findFirst({
            where: { hubspotDealId: String(objectId) },
            include: {
              contact: true,
              salesRep: true,
              room: true,
            },
          });

          if (!meeting) {
            results.push({
              eventId: eventId || String(objectId),
              status: 'no_matching_meeting',
            });
            continue;
          }

          // Map deal stages to meeting actions
          const stageActions: Record<string, string> = {
            closedwon: 'COMPLETED',
            closedlost: 'CANCELLED',
          };

          const newStatus = stageActions[propertyValue];

          if (newStatus) {
            await prisma.meeting.update({
              where: { id: meeting.id },
              data: { status: newStatus as 'COMPLETED' | 'CANCELLED' },
            });

            // Notify via agent if cancelled from HubSpot side
            if (newStatus === 'CANCELLED') {
              await runAgent({
                type: 'CONFIRMATION',
                instruction: 'Notify the contact that their meeting has been cancelled due to a HubSpot deal stage change',
                meetingId: meeting.id,
                context: { source: 'hubspot', dealStage: propertyValue },
              });
            }
          }

          // Log the deal stage change
          await prisma.agentLog.create({
            data: {
              meetingId: meeting.id,
              type: 'HUBSPOT_SYNC',
              channel: 'HubSpot',
              status: 'SENT',
              message: `Deal stage changed to ${propertyValue}`,
              rawPayload: event,
            },
          });

          results.push({
            eventId: eventId || String(objectId),
            status: 'processed',
          });
        } catch (err) {
          console.error(`Error processing HubSpot event for deal ${objectId}:`, err);
          results.push({
            eventId: eventId || String(objectId),
            status: 'error',
          });
        }
      } else {
        results.push({
          eventId: eventId || String(objectId),
          status: 'ignored',
        });
      }
    }

    return NextResponse.json({
      processed: results.filter((r) => r.status === 'processed').length,
      total: results.length,
      results,
    });
  } catch (error) {
    console.error('Error processing HubSpot webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process HubSpot webhook' },
      { status: 500 }
    );
  }
}
