import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params;

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Fetch meetings, registered sessions, and registered events in parallel
    const [meetings, sessionRegistrations, eventRegistrations] =
      await Promise.all([
        prisma.meeting.findMany({
          where: {
            contactId,
            status: { not: 'CANCELLED' },
          },
          include: {
            room: true,
            salesRep: true,
          },
          orderBy: { startTime: 'asc' },
        }),
        prisma.sessionRegistration.findMany({
          where: { contactId },
          include: {
            session: { include: { room: true } },
          },
        }),
        prisma.eventRegistration.findMany({
          where: { contactId },
          include: {
            event: true,
          },
        }),
      ]);

    // Normalize into a unified schedule format
    const schedule: Array<{
      type: 'meeting' | 'session' | 'event';
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      location: string | null;
      details: Record<string, unknown>;
    }> = [];

    for (const meeting of meetings) {
      schedule.push({
        type: 'meeting',
        id: meeting.id,
        title: meeting.title,
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        location: meeting.room?.name || null,
        details: {
          status: meeting.status,
          salesRep: meeting.salesRep,
          room: meeting.room,
        },
      });
    }

    for (const reg of sessionRegistrations) {
      schedule.push({
        type: 'session',
        id: reg.session.id,
        title: reg.session.title,
        startTime: reg.session.startTime,
        endTime: reg.session.endTime,
        location: reg.session.room?.name || null,
        details: {
          sessionType: reg.session.type,
          registrationId: reg.id,
        },
      });
    }

    for (const reg of eventRegistrations) {
      schedule.push({
        type: 'event',
        id: reg.event.id,
        title: reg.event.title,
        startTime: reg.event.startTime,
        endTime: reg.event.endTime,
        location: reg.event.location,
        details: {
          eventType: reg.event.type,
          registrationId: reg.id,
        },
      });
    }

    // Sort by startTime
    schedule.sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );

    return NextResponse.json({
      contact,
      schedule,
    });
  } catch (error) {
    console.error('Error fetching contact schedule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact schedule' },
      { status: 500 }
    );
  }
}

const updateRegistrationSchema = z.object({
  action: z.enum(['add', 'remove']),
  type: z.enum(['session', 'event']),
  itemId: z.string().uuid(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const { contactId } = params;
    const body = await request.json();
    const parsed = updateRegistrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Verify contact exists
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    const { action, type, itemId } = parsed.data;

    if (type === 'session') {
      // Verify session exists
      const session = await prisma.session.findUnique({
        where: { id: itemId },
      });

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      if (action === 'add') {
        // Check for existing registration
        const existing = await prisma.sessionRegistration.findFirst({
          where: { contactId, sessionId: itemId },
        });

        if (existing) {
          return NextResponse.json(
            { error: 'Already registered for this session' },
            { status: 409 }
          );
        }

        // Check capacity
        if (session.capacity) {
          const count = await prisma.sessionRegistration.count({
            where: { sessionId: itemId },
          });

          if (count >= session.capacity) {
            return NextResponse.json(
              { error: 'Session is at full capacity' },
              { status: 409 }
            );
          }
        }

        const registration = await prisma.sessionRegistration.create({
          data: { contactId, sessionId: itemId },
          include: { session: true },
        });

        return NextResponse.json(registration, { status: 201 });
      } else {
        // Remove registration
        const existing = await prisma.sessionRegistration.findFirst({
          where: { contactId, sessionId: itemId },
        });

        if (!existing) {
          return NextResponse.json(
            { error: 'Registration not found' },
            { status: 404 }
          );
        }

        await prisma.sessionRegistration.delete({
          where: { id: existing.id },
        });

        return NextResponse.json({ message: 'Registration removed' });
      }
    } else {
      // type === 'event'
      const event = await prisma.event.findUnique({
        where: { id: itemId },
      });

      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        );
      }

      if (action === 'add') {
        const existing = await prisma.eventRegistration.findFirst({
          where: { contactId, eventId: itemId },
        });

        if (existing) {
          return NextResponse.json(
            { error: 'Already registered for this event' },
            { status: 409 }
          );
        }

        // Check capacity
        if (event.capacity) {
          const count = await prisma.eventRegistration.count({
            where: { eventId: itemId },
          });

          if (count >= event.capacity) {
            return NextResponse.json(
              { error: 'Event is at full capacity' },
              { status: 409 }
            );
          }
        }

        const registration = await prisma.eventRegistration.create({
          data: { contactId, eventId: itemId },
          include: { event: true },
        });

        return NextResponse.json(registration, { status: 201 });
      } else {
        const existing = await prisma.eventRegistration.findFirst({
          where: { contactId, eventId: itemId },
        });

        if (!existing) {
          return NextResponse.json(
            { error: 'Registration not found' },
            { status: 404 }
          );
        }

        await prisma.eventRegistration.delete({
          where: { id: existing.id },
        });

        return NextResponse.json({ message: 'Registration removed' });
      }
    }
  } catch (error) {
    console.error('Error updating registration:', error);
    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    );
  }
}
