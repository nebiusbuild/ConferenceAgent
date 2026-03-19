import { Worker, type ConnectionOptions } from 'bullmq'
import { redis } from '@/lib/redis'

const connection = redis as unknown as ConnectionOptions
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/lib/agent'
import { format } from 'date-fns'

console.log('[Worker] Starting Concierge background workers...')

const reminderWorker = new Worker(
  'reminders',
  async (job) => {
    const { meetingId } = job.data
    console.log(`[Reminder] Processing reminder for meeting ${meetingId}`)

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { contact: true, room: true, salesRep: true },
    })

    if (!meeting || meeting.status === 'CANCELLED') {
      console.log(`[Reminder] Meeting ${meetingId} not found or cancelled, skipping`)
      return
    }

    await runAgent({
      type: 'REMINDER',
      instruction: `Send a 1-hour reminder to ${meeting.contact.name} at ${meeting.contact.email} for their ${format(meeting.startTime, 'h:mm a')} meeting in ${meeting.room.name} (${meeting.room.floor}). They're meeting with ${meeting.salesRep.name}.${meeting.contact.phone ? ` Also send them an SMS at ${meeting.contact.phone}.` : ''}`,
      meetingId,
    })

    console.log(`[Reminder] Completed for meeting ${meetingId}`)
  },
  { connection, concurrency: 5 }
)

const followUpWorker = new Worker(
  'followups',
  async (job) => {
    const { meetingId } = job.data
    console.log(`[FollowUp] Processing follow-up for meeting ${meetingId}`)

    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
      include: { contact: true, room: true, salesRep: true },
    })

    if (!meeting || meeting.status === 'CANCELLED') {
      console.log(`[FollowUp] Meeting ${meetingId} not found or cancelled, skipping`)
      return
    }

    // Mark as completed
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'COMPLETED' },
    })

    const followUpUrl = process.env.FOLLOWUP_BOOKING_URL || 'https://calendly.com'
    const swagUrl = process.env.SWAG_STORE_URL || 'https://swag.company.com'

    await runAgent({
      type: 'FOLLOWUP',
      instruction: `Send a post-meeting follow-up email to ${meeting.contact.name} (${meeting.contact.email}) from ${meeting.contact.company}. They just met with ${meeting.salesRep.name}. Thank them warmly for the meeting. Include a link to book a follow-up: ${followUpUrl}. Share the conference swag store: ${swagUrl}. Include ${meeting.salesRep.name}'s contact email (${meeting.salesRep.email}).`,
      meetingId,
    })

    // Sync to HubSpot
    await runAgent({
      type: 'HUBSPOT_SYNC',
      instruction: `Sync this completed meeting to HubSpot. The meeting with ${meeting.contact.name} from ${meeting.contact.company} has been completed.`,
      meetingId,
    })

    console.log(`[FollowUp] Completed for meeting ${meetingId}`)
  },
  { connection, concurrency: 5 }
)

// Error handlers
reminderWorker.on('failed', (job, err) => {
  console.error(`[Reminder] Job ${job?.id} failed:`, err.message)
})

followUpWorker.on('failed', (job, err) => {
  console.error(`[FollowUp] Job ${job?.id} failed:`, err.message)
})

reminderWorker.on('completed', (job) => {
  console.log(`[Reminder] Job ${job.id} completed`)
})

followUpWorker.on('completed', (job) => {
  console.log(`[FollowUp] Job ${job.id} completed`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down...')
  await reminderWorker.close()
  await followUpWorker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down...')
  await reminderWorker.close()
  await followUpWorker.close()
  process.exit(0)
})

console.log('[Worker] Concierge workers running. Waiting for jobs...')
