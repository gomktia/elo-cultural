import OpenAI from 'openai'
import { getIAConfig } from '@/lib/ia/config'

let client: OpenAI | null = null
let cachedApiKey: string | null = null

/**
 * Returns an OpenAI client using the API key from platform_settings (DB),
 * falling back to OPENAI_API_KEY env var.
 * Re-creates the client if the API key changes.
 */
export async function getOpenAIClient(): Promise<OpenAI> {
  const config = await getIAConfig()
  const apiKey = config.apiKey

  if (!apiKey) {
    throw new Error('Chave da API OpenAI nao configurada. Configure em Super Admin > Configuracoes > Integracoes IA.')
  }

  // Re-create client if key changed
  if (!client || cachedApiKey !== apiKey) {
    client = new OpenAI({ apiKey })
    cachedApiKey = apiKey
  }

  return client
}
