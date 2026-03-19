import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET
)

oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
})

const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}): Promise<{ threadId: string; messageId: string }> {
  const raw = createRawEmail(to, subject, body)
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  })
  return {
    threadId: response.data.threadId || '',
    messageId: response.data.id || '',
  }
}

export async function replyToThread({
  threadId,
  to,
  subject,
  body,
}: {
  threadId: string
  to: string
  subject: string
  body: string
}): Promise<{ messageId: string }> {
  const raw = createRawEmail(to, subject, body)
  const response = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  })
  return { messageId: response.data.id || '' }
}

export async function getMessageBody(messageId: string): Promise<string> {
  const message = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })
  const payload = message.data.payload
  if (!payload) return ''

  const parts = payload.parts || [payload]
  for (const part of parts) {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64url').toString('utf-8')
    }
  }
  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf-8')
  }
  return ''
}

function createRawEmail(to: string, subject: string, body: string): string {
  const senderAddress = process.env.GMAIL_SENDER_ADDRESS || 'jordan@company.com'
  const email = [
    `From: Jordan <${senderAddress}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=utf-8',
    '',
    body,
  ].join('\r\n')
  return Buffer.from(email).toString('base64url')
}
