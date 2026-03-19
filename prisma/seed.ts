import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding Concierge database...')

  // Create rooms
  const rooms = await Promise.all([
    prisma.room.upsert({
      where: { slug: 'the-boardroom' },
      update: {},
      create: {
        name: 'The Boardroom',
        slug: 'the-boardroom',
        capacity: 20,
        type: 'EXECUTIVE',
        floor: '3F',
        color: '#7c9fa6',
      },
    }),
    prisma.room.upsert({
      where: { slug: 'summit-suite' },
      update: {},
      create: {
        name: 'Summit Suite',
        slug: 'summit-suite',
        capacity: 12,
        type: 'EXECUTIVE',
        floor: '3F',
        color: '#8b7ec8',
      },
    }),
    prisma.room.upsert({
      where: { slug: 'horizon-room' },
      update: {},
      create: {
        name: 'Horizon Room',
        slug: 'horizon-room',
        capacity: 8,
        type: 'SALES',
        floor: '2F',
        color: '#6aaa8a',
      },
    }),
    prisma.room.upsert({
      where: { slug: 'catalyst-room' },
      update: {},
      create: {
        name: 'Catalyst Room',
        slug: 'catalyst-room',
        capacity: 6,
        type: 'SALES',
        floor: '2F',
        color: '#c9a84c',
      },
    }),
    prisma.room.upsert({
      where: { slug: 'spark-room' },
      update: {},
      create: {
        name: 'Spark Room',
        slug: 'spark-room',
        capacity: 4,
        type: 'SALES',
        floor: '2F',
        color: '#c67a5a',
      },
    }),
    prisma.room.upsert({
      where: { slug: 'booth-suite' },
      update: {},
      create: {
        name: 'Booth Suite',
        slug: 'booth-suite',
        capacity: 3,
        type: 'BOOTH',
        floor: '1F',
        color: '#d4a5a5',
      },
    }),
  ])

  // Create sales reps
  const reps = await Promise.all([
    prisma.salesRep.upsert({
      where: { email: 'sarah.chen@company.com' },
      update: {},
      create: { name: 'Sarah Chen', email: 'sarah.chen@company.com' },
    }),
    prisma.salesRep.upsert({
      where: { email: 'marcus.rivera@company.com' },
      update: {},
      create: { name: 'Marcus Rivera', email: 'marcus.rivera@company.com' },
    }),
    prisma.salesRep.upsert({
      where: { email: 'aisha.patel@company.com' },
      update: {},
      create: { name: 'Aisha Patel', email: 'aisha.patel@company.com' },
    }),
    prisma.salesRep.upsert({
      where: { email: 'david.kim@company.com' },
      update: {},
      create: { name: 'David Kim', email: 'david.kim@company.com' },
    }),
  ])

  // Create contacts
  const contacts = await Promise.all([
    prisma.contact.upsert({
      where: { email: 'jthompson@acmecorp.com' },
      update: {},
      create: { name: 'James Thompson', email: 'jthompson@acmecorp.com', phone: '+14155551234', company: 'Acme Corp' },
    }),
    prisma.contact.upsert({
      where: { email: 'emily.nakamura@globex.io' },
      update: {},
      create: { name: 'Emily Nakamura', email: 'emily.nakamura@globex.io', phone: '+14155552345', company: 'Globex Industries' },
    }),
    prisma.contact.upsert({
      where: { email: 'rob.williams@initech.com' },
      update: {},
      create: { name: 'Robert Williams', email: 'rob.williams@initech.com', company: 'Initech' },
    }),
    prisma.contact.upsert({
      where: { email: 'lisa.park@umbrella.co' },
      update: {},
      create: { name: 'Lisa Park', email: 'lisa.park@umbrella.co', phone: '+14155553456', company: 'Umbrella Corp' },
    }),
    prisma.contact.upsert({
      where: { email: 'alex.johnson@waystar.com' },
      update: {},
      create: { name: 'Alex Johnson', email: 'alex.johnson@waystar.com', company: 'Waystar Royco' },
    }),
  ])

  // Create sample meetings (today)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'Enterprise Partnership Discussion',
        roomId: rooms[0].id,
        contactId: contacts[0].id,
        salesRepId: reps[0].id,
        startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        status: 'CONFIRMED',
        attendeeCount: 4,
        notes: 'Discuss Q3 expansion plans and enterprise tier pricing',
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Product Demo - Analytics Suite',
        roomId: rooms[2].id,
        contactId: contacts[1].id,
        salesRepId: reps[1].id,
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        status: 'CONFIRMED',
        attendeeCount: 3,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Security Review Follow-up',
        roomId: rooms[1].id,
        contactId: contacts[2].id,
        salesRepId: reps[2].id,
        startTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        status: 'PENDING',
        attendeeCount: 2,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Executive Lunch Meeting',
        roomId: rooms[0].id,
        contactId: contacts[3].id,
        salesRepId: reps[0].id,
        startTime: new Date(today.getTime() + 12 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 13.5 * 60 * 60 * 1000),
        status: 'CONFIRMED',
        attendeeCount: 6,
        notes: 'Catering has been arranged',
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Technical Integration Planning',
        roomId: rooms[3].id,
        contactId: contacts[4].id,
        salesRepId: reps[3].id,
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        status: 'RESCHEDULING',
        attendeeCount: 3,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Quarterly Business Review',
        roomId: rooms[4].id,
        contactId: contacts[0].id,
        salesRepId: reps[1].id,
        startTime: new Date(today.getTime() + 15.5 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 16.5 * 60 * 60 * 1000),
        status: 'CONFIRMED',
        attendeeCount: 2,
      },
    }),
  ])

  // Create sample sessions
  const sessions = await Promise.all([
    prisma.session.create({
      data: {
        title: 'Keynote: The Future of Enterprise AI',
        description: 'Opening keynote exploring how AI is transforming enterprise operations',
        type: 'KEYNOTE',
        roomId: rooms[0].id,
        startTime: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 9.5 * 60 * 60 * 1000),
        speakers: ['Dr. Maria Santos', 'CEO, Company'],
        capacity: 200,
        trackName: 'Main Stage',
      },
    }),
    prisma.session.create({
      data: {
        title: 'Panel: Building Scalable Data Pipelines',
        description: 'Industry leaders share insights on modern data architecture',
        type: 'PANEL',
        roomId: rooms[1].id,
        startTime: new Date(today.getTime() + 10 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000),
        speakers: ['Jane Doe', 'John Smith', 'Alice Brown'],
        capacity: 50,
        trackName: 'Engineering',
      },
    }),
    prisma.session.create({
      data: {
        title: 'Workshop: Hands-on with Claude API',
        description: 'Build your first AI agent in 60 minutes',
        type: 'WORKSHOP',
        roomId: rooms[2].id,
        startTime: new Date(today.getTime() + 13 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        speakers: ['Tech Team'],
        capacity: 30,
        trackName: 'Hands-on Labs',
      },
    }),
    prisma.session.create({
      data: {
        title: 'Fireside Chat: From Startup to Scale',
        description: 'An intimate conversation about growth challenges',
        type: 'FIRESIDE_CHAT',
        roomId: rooms[3].id,
        startTime: new Date(today.getTime() + 15 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 16 * 60 * 60 * 1000),
        speakers: ['Founder, TechCo'],
        capacity: 40,
        trackName: 'Leadership',
      },
    }),
    prisma.session.create({
      data: {
        title: 'Talk: Zero-Trust Security in Practice',
        description: 'Real-world implementation of zero-trust architecture',
        type: 'TALK',
        roomId: rooms[1].id,
        startTime: new Date(today.getTime() + 14 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 14.75 * 60 * 60 * 1000),
        speakers: ['Security Lead, MegaCorp'],
        capacity: 50,
        trackName: 'Security',
      },
    }),
  ])

  // Create sample events
  const events = await Promise.all([
    prisma.event.create({
      data: {
        title: 'Welcome Reception',
        description: 'Kick off the conference with drinks and appetizers',
        type: 'RECEPTION',
        location: 'Grand Lobby, 1F',
        startTime: new Date(today.getTime() + 17 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),
        capacity: 300,
        dressCode: 'Business Casual',
      },
    }),
    prisma.event.create({
      data: {
        title: 'VIP Dinner',
        description: 'Exclusive dinner for executive attendees',
        type: 'DINNER',
        location: 'Rooftop Terrace',
        startTime: new Date(today.getTime() + 19 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 21.5 * 60 * 60 * 1000),
        capacity: 50,
        dressCode: 'Smart Casual',
      },
    }),
    prisma.event.create({
      data: {
        title: 'Happy Hour & Networking',
        description: 'Unwind and connect with fellow attendees',
        type: 'HAPPY_HOUR',
        location: 'Sky Bar, 5F',
        startTime: new Date(today.getTime() + 16.5 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 18 * 60 * 60 * 1000),
        capacity: 100,
      },
    }),
    prisma.event.create({
      data: {
        title: 'Breakfast Briefing: Market Trends',
        description: 'Start your day with insights and pastries',
        type: 'BREAKFAST',
        location: 'Atrium Café, 1F',
        startTime: new Date(today.getTime() + 7.5 * 60 * 60 * 1000),
        endTime: new Date(today.getTime() + 8.5 * 60 * 60 * 1000),
        capacity: 80,
      },
    }),
  ])

  // Register some contacts for sessions and events
  await Promise.all([
    prisma.sessionRegistration.create({ data: { sessionId: sessions[0].id, contactId: contacts[0].id } }),
    prisma.sessionRegistration.create({ data: { sessionId: sessions[0].id, contactId: contacts[1].id } }),
    prisma.sessionRegistration.create({ data: { sessionId: sessions[1].id, contactId: contacts[2].id } }),
    prisma.sessionRegistration.create({ data: { sessionId: sessions[2].id, contactId: contacts[0].id } }),
    prisma.sessionRegistration.create({ data: { sessionId: sessions[2].id, contactId: contacts[3].id } }),
    prisma.eventRegistration.create({ data: { eventId: events[0].id, contactId: contacts[0].id } }),
    prisma.eventRegistration.create({ data: { eventId: events[0].id, contactId: contacts[1].id } }),
    prisma.eventRegistration.create({ data: { eventId: events[1].id, contactId: contacts[3].id } }),
    prisma.eventRegistration.create({ data: { eventId: events[2].id, contactId: contacts[0].id } }),
    prisma.eventRegistration.create({ data: { eventId: events[2].id, contactId: contacts[4].id } }),
  ])

  // Create sample agent logs
  await Promise.all([
    prisma.agentLog.create({
      data: {
        meetingId: meetings[0].id,
        type: 'EMAIL',
        channel: 'Gmail',
        message: 'Confirmation email sent to James Thompson for Enterprise Partnership Discussion',
        status: 'SENT',
      },
    }),
    prisma.agentLog.create({
      data: {
        meetingId: meetings[1].id,
        type: 'EMAIL',
        channel: 'Gmail',
        message: 'Confirmation email sent to Emily Nakamura for Product Demo',
        status: 'SENT',
      },
    }),
    prisma.agentLog.create({
      data: {
        meetingId: meetings[1].id,
        type: 'SMS',
        channel: 'Twilio',
        message: 'SMS confirmation sent to Emily Nakamura at +14155552345',
        status: 'DELIVERED',
      },
    }),
    prisma.agentLog.create({
      data: {
        meetingId: meetings[4].id,
        type: 'RESCHEDULE',
        channel: 'Gmail',
        message: 'Reschedule options sent to Alex Johnson — offered 2pm, 3:30pm, or 11am alternatives',
        status: 'AWAITING_REPLY',
      },
    }),
    prisma.agentLog.create({
      data: {
        meetingId: meetings[0].id,
        type: 'HUBSPOT_SYNC',
        channel: 'HubSpot',
        message: 'Meeting synced to HubSpot — contact James Thompson linked to deal',
        status: 'SENT',
      },
    }),
  ])

  console.log(`Seeded: ${rooms.length} rooms, ${reps.length} reps, ${contacts.length} contacts, ${meetings.length} meetings, ${sessions.length} sessions, ${events.length} events`)
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
