import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/agent';
import { getMessageBody } from '@/lib/gmail';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Gmail push notifications send a Pub/Sub message
    const message = body.message;
    if (!message?.data) {
      return NextResponse.json(
        { error: 'Invalid notification payload' },
        { status: 400 }
      );
    }

    // Decode the base64-encoded Pub/Sub data
    const decodedData = JSON.parse(
      Buffer.from(message.data, 'base64').toString('utf-8')
    );

    const { emailAddress, historyId } = decodedData;

    if (!emailAddress || !historyId) {
      return NextResponse.json(
        { error: 'Missing emailAddress or historyId' },
        { status: 400 }
      );
    }

    // Get the message body from Gmail API
    const messageBodyText = await getMessageBody(historyId);

    if (!messageBodyText) {
      return NextResponse.json({ status: 'no_action' });
    }

    // Try to find a meeting with a matching gmail thread
    // In a real implementation, you'd extract the threadId from the Gmail message
    // For now, we search for recent meetings with the sender's email
    const meeting = await prisma.meeting.findFirst({
      where: {
        gmailThreadId: { not: null },
        contact: { email: emailAddress },
      },
      include: {
        contact: true,
        salesRep: true,
        room: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (!meeting) {
      console.log(`No meeting found for email: ${emailAddress}`);
      return NextResponse.json({ status: 'no_matching_meeting' });
    }

    // Run agent with REPLY task
    await runAgent({
      type: 'REPLY',
      instruction: `Contact replied to their meeting. Their message: "${messageBodyText}". Determine intent and respond appropriately.`,
      meetingId: meeting.id,
    });

    return NextResponse.json({
      status: 'processed',
      meetingId: meeting.id,
    });
  } catch (error) {
    console.error('Error processing Gmail webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process Gmail notification' },
      { status: 500 }
    );
  }
}
