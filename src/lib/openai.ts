import OpenAI from 'openai'
import { getIAConfig } from '@/lib/ia/config'

let client: OpenAI | null = null
let cachedApiKey: string | null = null
let cachedProvider: string | null = null

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'

/**
 * Returns an OpenAI-compatible client.
 * When provider is 'gemini', uses Google's OpenAI-compatible endpoint.
 * Re-creates the client if the API key or provider changes.
 */
export async function getOpenAIClient(): Promise<OpenAI> {
  const config = await getIAConfig()
  const apiKey = config.apiKey

  if (!apiKey) {
    throw new Error('Chave da API de IA nao configurada. Configure em Super Admin > Configuracoes > Integracoes IA.')
  }

  // Re-create client if key or provider changed
  if (!client || cachedApiKey !== apiKey || cachedProvider !== config.provider) {
    const options: ConstructorParameters<typeof OpenAI>[0] = { apiKey }

    if (config.provider === 'gemini') {
      options.baseURL = GEMINI_BASE_URL
    }

    client = new OpenAI(options)
    cachedApiKey = apiKey
    cachedProvider = config.provider
  }

  return client
}
