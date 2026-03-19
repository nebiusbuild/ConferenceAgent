import Twilio from 'twilio'

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID || '',
  process.env.TWILIO_AUTH_TOKEN || ''
)

export async function sendSMS({
  to,
  message,
}: {
  to: string
  message: string
}): Promise<{ sid: string }> {
  if (process.env.SMS_ENABLED !== 'true') {
    console.log('[SMS Disabled] Would send to', to, ':', message)
    return { sid: 'disabled' }
  }
  const result = await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER || '',
    to,
    body: message,
  })
  return { sid: result.sid }
}
