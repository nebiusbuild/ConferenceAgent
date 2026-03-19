export const agentTools = [
  {
    name: 'send_email' as const,
    description: 'Send an email via Gmail as Jordan. Use for confirmations, reminders, reschedule offers, and follow-ups.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' as const, description: 'Recipient email address' },
        subject: { type: 'string' as const, description: 'Email subject line' },
        body: { type: 'string' as const, description: 'Email body text. Keep under 120 words. Sign off with "Best, Jordan"' },
        meetingId: { type: 'string' as const, description: 'Associated meeting ID for logging' },
      },
      required: ['to', 'subject', 'body', 'meetingId'],
    },
  },
  {
    name: 'send_sms' as const,
    description: 'Send an SMS via Twilio. Use for quick confirmations and reminders when phone is available.',
    input_schema: {
      type: 'object' as const,
      properties: {
        to: { type: 'string' as const, description: 'E.164 format phone number' },
        message: { type: 'string' as const, description: 'SMS text. Must be under 160 characters.' },
        meetingId: { type: 'string' as const, description: 'Associated meeting ID for logging' },
      },
      required: ['to', 'message', 'meetingId'],
    },
  },
  {
    name: 'offer_reschedule_slots' as const,
    description: 'Query available slots and send 3 alternative time options to the contact via their preferred channel.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meetingId: { type: 'string' as const, description: 'Meeting to reschedule' },
        preferredDate: { type: 'string' as const, description: 'ISO date string for preferred reschedule date' },
        channel: { type: 'string' as const, enum: ['email', 'sms'], description: 'How to send the options' },
      },
      required: ['meetingId', 'channel'],
    },
  },
  {
    name: 'confirm_reschedule' as const,
    description: 'Confirm a new meeting time chosen by the contact. Updates DB and sends confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meetingId: { type: 'string' as const, description: 'Meeting being rescheduled' },
        newStartTime: { type: 'string' as const, description: 'New start time ISO string' },
        newEndTime: { type: 'string' as const, description: 'New end time ISO string' },
      },
      required: ['meetingId', 'newStartTime', 'newEndTime'],
    },
  },
  {
    name: 'sync_to_hubspot' as const,
    description: 'Push meeting data and outcome to HubSpot CRM.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meetingId: { type: 'string' as const, description: 'Meeting to sync' },
        outcome: { type: 'string' as const, enum: ['completed', 'no_show', 'rescheduled'] },
        notes: { type: 'string' as const, description: 'Notes about the meeting outcome' },
      },
      required: ['meetingId', 'outcome'],
    },
  },
  {
    name: 'update_meeting_status' as const,
    description: 'Update a meeting status in the database.',
    input_schema: {
      type: 'object' as const,
      properties: {
        meetingId: { type: 'string' as const, description: 'Meeting to update' },
        status: { type: 'string' as const, enum: ['CONFIRMED', 'RESCHEDULING', 'PENDING', 'CANCELLED', 'COMPLETED'] },
      },
      required: ['meetingId', 'status'],
    },
  },
]
