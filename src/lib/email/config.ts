import { createServiceClient } from '@/lib/supabase/service'

export interface EmailConfig {
  enabled: boolean
  apiKey: string
  senderEmail: string
  senderName: string
}

const DEFAULTS: EmailConfig = {
  enabled: false,
  apiKey: '',
  senderEmail: 'noreply@eloculturas.com.br',
  senderName: 'Editais Culturais',
}

export async function getEmailConfig(): Promise<EmailConfig> {
  try {
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['email_enabled', 'resend_api_key', 'sender_email', 'sender_name'])

    const settings = new Map((data || []).map(r => [r.key, r.value]))

    return {
      enabled: (settings.get('email_enabled') || 'false') === 'true',
      apiKey: settings.get('resend_api_key') || process.env.RESEND_API_KEY || '',
      senderEmail: settings.get('sender_email') || DEFAULTS.senderEmail,
      senderName: settings.get('sender_name') || DEFAULTS.senderName,
    }
  } catch (err) {
    console.error('[EmailConfig] Falha ao ler configuracoes do banco:', err instanceof Error ? err.message : err)
    return {
      ...DEFAULTS,
      apiKey: process.env.RESEND_API_KEY || '',
    }
  }
}
