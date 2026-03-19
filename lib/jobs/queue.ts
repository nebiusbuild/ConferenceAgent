import { Queue, type ConnectionOptions } from 'bullmq'
import { redis } from '@/lib/redis'

const connection = redis as unknown as ConnectionOptions

export const reminderQueue = new Queue('reminders', { connection })
export const followUpQueue = new Queue('followups', { connection })

export async function scheduleJobsForMeeting(meeting: {
  id: string
  startTime: Date
  endTime: Date
}) {
  const reminderDelay = meeting.startTime.getTime() - 60 * 60 * 1000 - Date.now()
  const followUpDelay = meeting.endTime.getTime() + 15 * 60 * 1000 - Date.now()

  if (reminderDelay > 0) {
    await reminderQueue.add(
      'send-reminder',
      { meetingId: meeting.id },
      { delay: reminderDelay, jobId: `reminder-${meeting.id}` }
    )
  }

  if (followUpDelay > 0) {
    await followUpQueue.add(
      'send-followup',
      { meetingId: meeting.id },
      { delay: followUpDelay, jobId: `followup-${meeting.id}` }
    )
  }
}

export async function cancelJobsForMeeting(meetingId: string) {
  try {
    const reminderJob = await reminderQueue.getJob(`reminder-${meetingId}`)
    if (reminderJob) await reminderJob.remove()
  } catch { /* job may not exist */ }

  try {
    const followUpJob = await followUpQueue.getJob(`followup-${meetingId}`)
    if (followUpJob) await followUpJob.remove()
  } catch { /* job may not exist */ }
}

export async function rescheduleJobsForMeeting(meeting: {
  id: string
  startTime: Date
  endTime: Date
}) {
  await cancelJobsForMeeting(meeting.id)
  await scheduleJobsForMeeting(meeting)
}
