import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkRoomAvailability } from '@/lib/availability';
import { scheduleJobsForMeeting } from '@/lib/jobs/queue';
import { runAgent } from '@/lib/agent';
import { syncMeetingToHubSpot } from '@/lib/hubspot';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');
    const salesRepId = searchParams.get('salesRepId');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    if (roomId) {
      where.roomId = roomId;
    }

    if (status) {
      where.status = status;
    }

    if (salesRepId) {
      where.salesRepId = salesRepId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contact: { name: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
        { contact: { company: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        room: true,
        contact: true,
        salesRep: true,
      },
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meetings' },
      { status: 500 }
    );
  }
}

const createMeetingSchema = z.object({
  title: z.string().min(1),
  startTime: z.string(),
  endTime: z.string(),
  roomId: z.string().min(1),
  salesRepId: z.string().min(1),
  contact: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().optional(),
    company: z.string().optional(),
  }),
  notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { title, startTime, endTime, roomId, salesRepId, contact: contactData, notes } = parsed.data;

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Check room availability
    const { available } = await checkRoomAvailability(roomId, start, end);
    if (!available) {
      return NextResponse.json(
        { error: 'Room is not available for the requested time slot' },
        { status: 409 }
      );
    }

    // Upsert contact in local DB
    const contact = await prisma.contact.upsert({
      where: { email: contactData.email },
      update: { name: contactData.name, phone: contactData.phone, company: contactData.company || '' },
      create: {
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        company: contactData.company || '',
      },
    });

    // Create the meeting
    const meeting = await prisma.meeting.create({
      data: {
        title,
        startTime: start,
        endTime: end,
        roomId,
        salesRepId,
        contactId: contact.id,
        notes,
        status: 'CONFIRMED',
      },
      include: {
        room: true,
        contact: true,
        salesRep: true,
      },
    });

    // Schedule reminder/follow-up jobs
    await scheduleJobsForMeeting(meeting);

    // Trigger agent confirmation
    await runAgent({
      type: 'CONFIRMATION',
      instruction: 'Send booking confirmation to the contact',
      meetingId: meeting.id,
    });

    // Sync to HubSpot (fire-and-forget)
    syncMeetingToHubSpot(meeting).catch(console.error);

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Failed to create meeting' },
      { status: 500 }
    );
  }
}
