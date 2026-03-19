import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { runAgent } from '@/lib/agent';

export async function POST(request: NextRequest) {
  try {
    // Twilio sends form-urlencoded data
    const formData = await request.formData();
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const messageSid = formData.get('MessageSid') as string;

    if (!from || !body) {
      return new NextResponse(
        buildTwiML('Sorry, we could not process your message.'),
        { status: 400, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Normalize phone number (strip formatting)
    const normalizedPhone = from.replace(/\D/g, '');

    // Find contact by phone number
    const contact = await prisma.contact.findFirst({
      where: {
        OR: [
          { phone: from },
          { phone: normalizedPhone },
          { phone: { endsWith: normalizedPhone.slice(-10) } },
        ],
      },
    });

    if (!contact) {
      return new NextResponse(
        buildTwiML(
          "Thanks for reaching out! We couldn't find your registration. Please check in at the front desk for assistance."
        ),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Find their latest active meeting
    const meeting = await prisma.meeting.findFirst({
      where: {
        contactId: contact.id,
        status: { in: ['CONFIRMED', 'PENDING', 'RESCHEDULING'] },
      },
      include: {
        room: true,
        salesRep: true,
        contact: true,
      },
      orderBy: { startTime: 'asc' },
    });

    if (!meeting) {
      return new NextResponse(
        buildTwiML(
          `Hi ${contact.name}! We don't see any upcoming meetings for you. Please visit the front desk if you need assistance.`
        ),
        { headers: { 'Content-Type': 'text/xml' } }
      );
    }

    // Run agent to handle the inbound SMS
    await runAgent({
      type: 'REPLY',
      instruction: `Contact texted: "${body}". Respond appropriately as Jordan via SMS.`,
      meetingId: meeting.id,
    });

    const responseMessage = `Hi ${contact.name}! We received your message and will get back to you shortly.`;

    return new NextResponse(buildTwiML(responseMessage), {
      headers: { 'Content-Type': 'text/xml' },
    });
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return new NextResponse(
      buildTwiML('Sorry, something went wrong. Please try again later.'),
      { status: 500, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}

function buildTwiML(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>${escapeXml(message)}</Message>
</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
