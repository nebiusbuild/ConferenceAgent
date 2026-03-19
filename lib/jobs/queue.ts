import { Queue, type ConnectionOptions } from 'bullmq'
import { getRedis } from '@/lib/redis'

function getConnection(): ConnectionOptions {
  return getRedis() as unknown as ConnectionOptions
}

let _reminderQueue: Queue | null = null
let _followUpQueue: Queue | null = null

function getReminderQueue(): Queue {
  if (!_reminderQueue) {
    _reminderQueue = new Queue('reminders', { connection: getConnection() })
  }
  return _reminderQueue
}

function getFollowUpQueue(): Queue {
  if (!_followUpQueue) {
    _followUpQueue = new Queue('followups', { connection: getConnection() })
  }
  return _followUpQueue
}

export const reminderQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    return (getReminderQueue() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const followUpQueue = new Proxy({} as Queue, {
  get(_target, prop) {
    return (getFollowUpQueue() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

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
