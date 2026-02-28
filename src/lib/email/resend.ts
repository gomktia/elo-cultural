import { Resend } from 'resend'
import { getEmailConfig } from './config'

let client: Resend | null = null
let cachedApiKey: string | null = null

async function getResendClient(): Promise<Resend | null> {
  const config = await getEmailConfig()

  if (!config.enabled || !config.apiKey) {
    return null
  }

  if (!client || cachedApiKey !== config.apiKey) {
    client = new Resend(config.apiKey)
    cachedApiKey = config.apiKey
  }

  return client
}

interface SendEmailParams {
  to: string | string[]
  subject: string
  html: string
}

/**
 * Sends an email via Resend. Returns silently on failure (non-blocking).
 * Email sending should never break the main flow.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    const resend = await getResendClient()
    if (!resend) return false

    const config = await getEmailConfig()

    await resend.emails.send({
      from: `${config.senderName} <${config.senderEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    return true
  } catch (error) {
    console.error('[Email] Falha ao enviar email:', error instanceof Error ? error.message : error)
    return false
  }
}
