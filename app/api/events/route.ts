import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.startTime = { gte: startOfDay, lte: endOfDay };
    }

    if (type) {
      where.type = type;
    }

    const events = await prisma.event.findMany({
      where,
      include: {
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const result = events.map(({ _count, ...event }) => ({
      ...event,
      registrationCount: _count.registrations,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum([
    'HAPPY_HOUR',
    'DINNER',
    'BREAKFAST',
    'NETWORKING',
    'RECEPTION',
    'AFTER_PARTY',
  ]),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  capacity: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (end <= start) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: start,
        endTime: end,
        location: data.location,
        capacity: data.capacity,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
