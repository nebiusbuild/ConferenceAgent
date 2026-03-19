import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const type = searchParams.get('type');
    const trackName = searchParams.get('trackName');

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

    if (trackName) {
      where.trackName = { contains: trackName, mode: 'insensitive' };
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        room: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    const result = sessions.map(({ _count, speakers, ...session }) => ({
      ...session,
      speakers: (speakers as string[]).map((name, i) => ({ id: `speaker-${i}`, name })),
      registrationCount: _count.registrations,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

const createSessionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['TALK', 'PANEL', 'WORKSHOP', 'KEYNOTE', 'FIRESIDE_CHAT']),
  startTime: z.string(),
  endTime: z.string(),
  roomId: z.string().optional(),
  trackName: z.string().optional(),
  speakers: z.array(z.string()).optional(),
  capacity: z.number().int().positive().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

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

    const session = await prisma.session.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        startTime: start,
        endTime: end,
        roomId: data.roomId,
        trackName: data.trackName,
        speakers: data.speakers,
        capacity: data.capacity,
      },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}
