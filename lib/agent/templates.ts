export const emailTemplates = {
  confirmation: (params: {
    contactName: string
    meetingTitle: string
    date: string
    time: string
    roomName: string
    floor: string
    salesRepName: string
  }) => ({
    subject: `Re: Your meeting at the conference`,
    instruction: `Send a confirmation email to ${params.contactName} about their meeting "${params.meetingTitle}" on ${params.date} at ${params.time} in ${params.roomName} (${params.floor}). They'll be meeting with ${params.salesRepName}. Keep it warm and brief — mention the room and what to expect on arrival.`,
  }),

  reminder: (params: {
    contactName: string
    time: string
    roomName: string
    floor: string
    salesRepName: string
  }) => ({
    subject: `Quick reminder — your ${params.time} meeting today`,
    instruction: `Send a 1-hour reminder email to ${params.contactName} about their ${params.time} meeting today in ${params.roomName} (${params.floor}) with ${params.salesRepName}. Ask if it still works — "No need to reply if all good."`,
  }),

  rescheduleOffer: (params: {
    contactName: string
    originalTime: string
    slots: string[]
  }) => ({
    subject: `Re: Your meeting at the conference`,
    instruction: `${params.contactName} needs to reschedule their ${params.originalTime} meeting. Offer these available times naturally (not as a list): ${params.slots.join(', ')}. Make it easy for them to choose — conversational tone.`,
  }),

  rescheduleConfirmation: (params: {
    contactName: string
    newTime: string
    roomName: string
  }) => ({
    subject: `Re: Your meeting at the conference`,
    instruction: `Confirm the reschedule for ${params.contactName}. Their new time is ${params.newTime} in ${params.roomName}. Keep it brief — "All set!"`,
  }),

  followUp: (params: {
    contactName: string
    company: string
    salesRepName: string
    salesRepEmail: string
    followUpUrl: string
    swagUrl: string
  }) => ({
    subject: `Great meeting you today`,
    instruction: `Send a post-meeting follow-up to ${params.contactName} from ${params.company}. Thank them for meeting with ${params.salesRepName} today. Include a link to book a follow-up: ${params.followUpUrl}. Also share the conference swag store: ${params.swagUrl}. Include ${params.salesRepName}'s email (${params.salesRepEmail}) for direct contact. Keep it warm, 2-3 sentences of thanks then the links.`,
  }),
}

export const smsTemplates = {
  confirmation: (params: {
    contactName: string
    time: string
    roomName: string
    floor: string
  }) => `Hi ${params.contactName}, Jordan here from the exec team. You're confirmed for ${params.time} in ${params.roomName} — ${params.floor}. See you then!`,

  reminder: (params: {
    contactName: string
    time: string
    roomName: string
  }) => `Hey ${params.contactName} — just a reminder about your ${params.time} meeting in ${params.roomName} today. Text back if anything changes.`,
}
