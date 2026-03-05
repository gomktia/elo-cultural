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

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 500

function isTransientError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'statusCode' in error) {
    const code = (error as { statusCode: number }).statusCode
    return code === 429 || code >= 500
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return msg.includes('rate limit') || msg.includes('timeout') || msg.includes('econnreset')
  }
  return false
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Sends an email via Resend with exponential backoff retry (up to 3 attempts).
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

    let lastError: string | undefined

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const { error } = await resend.emails.send({
          from: `${config.senderName} <${config.senderEmail}>`,
          to: Array.isArray(to) ? to : [to],
          subject,
          html,
        })

        if (!error) return { success: true }

        lastError = `Resend: ${error.message}`

        if (!isTransientError(error)) break

        console.warn(`[Email] Tentativa ${attempt + 1}/${MAX_RETRIES} falhou (transiente): ${error.message}`)
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)

        if (!isTransientError(err)) break

        console.warn(`[Email] Tentativa ${attempt + 1}/${MAX_RETRIES} falhou (erro): ${lastError}`)
      }

      if (attempt < MAX_RETRIES - 1) {
        await sleep(INITIAL_DELAY_MS * Math.pow(2, attempt))
      }
    }

    console.error('[Email] Falha apos todas as tentativas:', lastError)
    return { success: false, error: lastError }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[Email] Falha ao enviar email:', msg)
    return { success: false, error: msg }
  }
}
