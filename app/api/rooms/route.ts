import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAvailability = searchParams.get('availability') === 'true';
    const type = searchParams.get('type');

    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const rooms = await prisma.room.findMany({
      where,
      include: {
        meetings: includeAvailability
          ? {
              where: {
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' },
              },
              select: {
                id: true,
                startTime: true,
                endTime: true,
                title: true,
              },
              orderBy: { startTime: 'asc' },
            }
          : false,
        _count: {
          select: {
            meetings: {
              where: {
                startTime: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const result = rooms.map((room) => {
      const { _count, meetings, ...rest } = room;
      const base: Record<string, unknown> = {
        ...rest,
        meetingCountToday: _count.meetings,
      };

      if (includeAvailability) {
        const currentMeeting = (meetings as Array<{ startTime: Date; endTime: Date }>)?.find(
          (m) => m.startTime <= now && m.endTime > now
        );
        base.isCurrentlyAvailable = !currentMeeting;
        base.currentMeeting = currentMeeting || null;
        base.todaysMeetings = meetings;
      }

      return base;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rooms' },
      { status: 500 }
    );
  }
}
