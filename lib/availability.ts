import { prisma } from '@/lib/prisma'
import { Meeting, Room } from '@prisma/client'

export async function checkRoomAvailability(
  roomId: string,
  startTime: Date,
  endTime: Date,
  excludeMeetingId?: string
): Promise<{ available: boolean; conflicts: Meeting[] }> {
  const where: Record<string, unknown> = {
    roomId,
    status: { notIn: ['CANCELLED'] },
    AND: [
      { startTime: { lt: endTime } },
      { endTime: { gt: startTime } },
    ],
  }
  if (excludeMeetingId) {
    where.id = { not: excludeMeetingId }
  }

  const conflicts = await prisma.meeting.findMany({ where })
  return { available: conflicts.length === 0, conflicts }
}

export async function suggestAlternativeSlots(
  roomId: string,
  requestedStart: Date,
  durationMinutes: number,
  count: number = 3
): Promise<{ start: Date; end: Date; room: Room }[]> {
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (!room) return []

  const slots: { start: Date; end: Date; room: Room }[] = []
  const dayStart = new Date(requestedStart)
  dayStart.setHours(8, 0, 0, 0)
  const dayEnd = new Date(requestedStart)
  dayEnd.setHours(18, 0, 0, 0)

  // Get all meetings for the day in this room
  const meetings = await prisma.meeting.findMany({
    where: {
      roomId,
      status: { notIn: ['CANCELLED'] },
      startTime: { gte: dayStart },
      endTime: { lte: dayEnd },
    },
    orderBy: { startTime: 'asc' },
  })

  // Find gaps
  let cursor = new Date(Math.max(dayStart.getTime(), Date.now()))
  for (const meeting of meetings) {
    const gapEnd = new Date(meeting.startTime)
    const gapDuration = (gapEnd.getTime() - cursor.getTime()) / (1000 * 60)
    if (gapDuration >= durationMinutes) {
      slots.push({
        start: new Date(cursor),
        end: new Date(cursor.getTime() + durationMinutes * 60 * 1000),
        room,
      })
      if (slots.length >= count) return slots
    }
    cursor = new Date(meeting.endTime)
  }

  // Check gap after last meeting
  const remainingMinutes = (dayEnd.getTime() - cursor.getTime()) / (1000 * 60)
  if (remainingMinutes >= durationMinutes && slots.length < count) {
    slots.push({
      start: new Date(cursor),
      end: new Date(cursor.getTime() + durationMinutes * 60 * 1000),
      room,
    })
  }

  // If not enough slots in same room, check other rooms
  if (slots.length < count) {
    const otherRooms = await prisma.room.findMany({
      where: { id: { not: roomId }, capacity: { gte: room.capacity } },
    })
    for (const otherRoom of otherRooms) {
      if (slots.length >= count) break
      const otherMeetings = await prisma.meeting.findMany({
        where: {
          roomId: otherRoom.id,
          status: { notIn: ['CANCELLED'] },
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd },
        },
        orderBy: { startTime: 'asc' },
      })

      let otherCursor = new Date(Math.max(dayStart.getTime(), Date.now()))
      for (const m of otherMeetings) {
        const gap = (new Date(m.startTime).getTime() - otherCursor.getTime()) / (1000 * 60)
        if (gap >= durationMinutes) {
          slots.push({
            start: new Date(otherCursor),
            end: new Date(otherCursor.getTime() + durationMinutes * 60 * 1000),
            room: otherRoom,
          })
          if (slots.length >= count) break
        }
        otherCursor = new Date(m.endTime)
      }
    }
  }

  return slots.slice(0, count)
}
