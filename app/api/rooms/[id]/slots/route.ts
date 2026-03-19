import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { suggestAlternativeSlots } from '@/lib/availability';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const duration = parseInt(searchParams.get('duration') || '30', 10);

    if (!date) {
      return NextResponse.json(
        { error: 'date query parameter is required' },
        { status: 400 }
      );
    }

    if (isNaN(duration) || duration < 15 || duration > 480) {
      return NextResponse.json(
        { error: 'duration must be between 15 and 480 minutes' },
        { status: 400 }
      );
    }

    // Verify room exists
    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const targetDate = new Date(date);
    const slots = await suggestAlternativeSlots(id, targetDate, duration);

    return NextResponse.json({
      roomId: id,
      roomName: room.name,
      date,
      duration,
      slots,
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
