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

export interface SendEmailResult {
  success: boolean
  error?: string
}

/**
 * Sends an email via Resend.
 * Returns { success, error } so callers can inspect failures when needed.
 * Email sending should never break the main flow.
 */
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<SendEmailResult> {
  try {
    const config = await getEmailConfig()

    if (!config.enabled) {
      return { success: false, error: 'Email esta desabilitado nas configuracoes da plataforma.' }
    }

    if (!config.apiKey) {
      return { success: false, error: 'Resend API key nao configurada.' }
    }

    const resend = await getResendClient()
    if (!resend) {
      return { success: false, error: 'Nao foi possivel inicializar o cliente Resend.' }
    }

    const { error } = await resend.emails.send({
      from: `${config.senderName} <${config.senderEmail}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })

    if (error) {
      console.error('[Email] Resend API error:', error)
      return { success: false, error: `Resend: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[Email] Falha ao enviar email:', msg)
    return { success: false, error: msg }
  }
}
