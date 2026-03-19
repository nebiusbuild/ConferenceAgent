import Anthropic from '@anthropic-ai/sdk'
import { JORDAN_PERSONA, buildTaskContext } from './persona'
import { agentTools } from './tools'
import { sendEmail, replyToThread } from '@/lib/gmail'
import { sendSMS } from '@/lib/twilio'
import { syncMeetingToHubSpot, completeMeetingInHubSpot } from '@/lib/hubspot'
import { suggestAlternativeSlots } from '@/lib/availability'
import { rescheduleJobsForMeeting } from '@/lib/jobs/queue'
import { prisma } from '@/lib/prisma'
import { format } from 'date-fns'

const anthropic = new Anthropic()

export interface AgentTask {
  type: 'CONFIRMATION' | 'REMINDER' | 'RESCHEDULE' | 'FOLLOWUP' | 'REPLY' | 'HUBSPOT_SYNC'
  instruction: string
  meetingId: string
  context?: Record<string, string>
}

export async function runAgent(task: AgentTask) {
  const meeting = await prisma.meeting.findUnique({
    where: { id: task.meetingId },
    include: { contact: true, room: true, salesRep: true },
  })

  if (!meeting) throw new Error(`Meeting ${task.meetingId} not found`)

  const taskContext = buildTaskContext({
    type: task.type,
    meetingTitle: meeting.title,
    contactName: meeting.contact.name,
    contactEmail: meeting.contact.email,
    contactPhone: meeting.contact.phone || undefined,
    roomName: meeting.room.name,
    startTime: format(meeting.startTime, 'h:mm a'),
    endTime: format(meeting.endTime, 'h:mm a'),
    salesRepName: meeting.salesRep.name,
    notes: meeting.notes || undefined,
  })

  // Log agent invocation
  await prisma.agentLog.create({
    data: {
      meetingId: task.meetingId,
      type: task.type === 'CONFIRMATION' ? 'EMAIL' : task.type === 'REMINDER' ? 'REMINDER' : task.type === 'RESCHEDULE' ? 'RESCHEDULE' : task.type === 'FOLLOWUP' ? 'FOLLOWUP' : task.type === 'HUBSPOT_SYNC' ? 'HUBSPOT_SYNC' : 'EMAIL',
      channel: 'Agent',
      message: `Agent triggered: ${task.type} — ${task.instruction.slice(0, 200)}`,
      status: 'SENT',
    },
  })

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: JORDAN_PERSONA + '\n\n' + taskContext,
    messages: [{ role: 'user', content: task.instruction }],
    tools: agentTools,
  })

  const results: Array<{ tool: string; result: unknown }> = []

  for (const block of response.content) {
    if (block.type === 'tool_use') {
      const result = await executeTool(block.name, block.input as Record<string, unknown>, meeting)
      results.push({ tool: block.name, result })
    }
  }

  return results
}

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  meeting: Awaited<ReturnType<typeof prisma.meeting.findUnique>> & {
    contact: { name: string; email: string; phone: string | null }
    room: { name: string; id: string; floor: string }
    salesRep: { name: string; email: string }
  }
) {
  switch (name) {
    case 'send_email': {
      const { to, subject, body, meetingId } = input as {
        to: string; subject: string; body: string; meetingId: string
      }
      let result
      if (meeting!.gmailThreadId) {
        result = await replyToThread({
          threadId: meeting!.gmailThreadId,
          to, subject, body,
        })
      } else {
        const emailResult = await sendEmail({ to, subject, body })
        // Store thread ID for future replies
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { gmailThreadId: emailResult.threadId },
        })
        result = emailResult
      }
      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'EMAIL',
          channel: 'Gmail',
          message: `Email sent to ${to}: ${subject}`,
          status: 'SENT',
          rawPayload: { to, subject, body },
        },
      })
      return result
    }

    case 'send_sms': {
      const { to, message, meetingId } = input as {
        to: string; message: string; meetingId: string
      }
      const result = await sendSMS({ to, message })
      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'SMS',
          channel: 'Twilio',
          message: `SMS sent to ${to}: ${message}`,
          status: 'SENT',
          rawPayload: { to, message, sid: result.sid },
        },
      })
      return result
    }

    case 'offer_reschedule_slots': {
      const { meetingId, preferredDate, channel } = input as {
        meetingId: string; preferredDate?: string; channel: string
      }
      const requestedDate = preferredDate ? new Date(preferredDate) : new Date(meeting!.startTime)
      const duration = (new Date(meeting!.endTime).getTime() - new Date(meeting!.startTime).getTime()) / (1000 * 60)
      const slots = await suggestAlternativeSlots(meeting!.room.id, requestedDate, duration, 3)

      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'RESCHEDULING' },
      })

      const slotDescriptions = slots.map(
        (s) => `${format(s.start, 'h:mm a')} in ${s.room.name}`
      )

      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'RESCHEDULE',
          channel: channel === 'email' ? 'Gmail' : 'Twilio',
          message: `Offered reschedule slots: ${slotDescriptions.join(', ')}`,
          status: 'AWAITING_REPLY',
          rawPayload: { slots: slots.map((s) => ({ start: s.start, end: s.end, room: s.room.name })) },
        },
      })

      return { slots, slotDescriptions }
    }

    case 'confirm_reschedule': {
      const { meetingId, newStartTime, newEndTime } = input as {
        meetingId: string; newStartTime: string; newEndTime: string
      }
      await prisma.meeting.update({
        where: { id: meetingId },
        data: {
          startTime: new Date(newStartTime),
          endTime: new Date(newEndTime),
          status: 'CONFIRMED',
        },
      })
      await rescheduleJobsForMeeting({
        id: meetingId,
        startTime: new Date(newStartTime),
        endTime: new Date(newEndTime),
      })
      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'RESCHEDULE',
          channel: 'System',
          message: `Rescheduled to ${format(new Date(newStartTime), 'h:mm a')} - ${format(new Date(newEndTime), 'h:mm a')}`,
          status: 'SENT',
        },
      })
      return { success: true }
    }

    case 'sync_to_hubspot': {
      const { meetingId, outcome, notes } = input as {
        meetingId: string; outcome: string; notes?: string
      }
      if (meeting!.hubspotContactId) {
        if (outcome === 'completed' || outcome === 'no_show') {
          await completeMeetingInHubSpot({
            contactHubspotId: meeting!.hubspotContactId,
            hubspotDealId: meeting!.hubspotDealId,
            outcome,
            notes: notes || `Meeting ${outcome} at conference`,
          })
        } else {
          await syncMeetingToHubSpot({
            id: meetingId,
            title: meeting!.title,
            startTime: new Date(meeting!.startTime),
            endTime: new Date(meeting!.endTime),
            contactHubspotId: meeting!.hubspotContactId,
            notes: notes || undefined,
            hubspotDealId: meeting!.hubspotDealId || undefined,
          })
        }
      }
      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'HUBSPOT_SYNC',
          channel: 'HubSpot',
          message: `Synced to HubSpot — outcome: ${outcome}`,
          status: 'SENT',
          rawPayload: { outcome, notes },
        },
      })
      return { success: true }
    }

    case 'update_meeting_status': {
      const { meetingId, status } = input as { meetingId: string; status: string }
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: status as 'CONFIRMED' | 'RESCHEDULING' | 'PENDING' | 'CANCELLED' | 'COMPLETED' },
      })
      await prisma.agentLog.create({
        data: {
          meetingId,
          type: 'RESCHEDULE',
          channel: 'System',
          message: `Meeting status updated to ${status}`,
          status: 'SENT',
        },
      })
      return { success: true }
    }

    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
