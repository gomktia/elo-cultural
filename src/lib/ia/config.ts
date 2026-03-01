import { createServiceClient } from '@/lib/supabase/service'

export interface IAConfig {
  enabled: boolean
  model: string
  embeddingModel: string
  apiKey: string
}

const DEFAULTS: IAConfig = {
  enabled: true,
  model: 'gpt-4',
  embeddingModel: 'text-embedding-3-small',
  apiKey: '',
}

/**
 * Reads IA settings from platform_settings table.
 * Falls back to env vars and defaults if DB values are empty.
 */
export async function getIAConfig(): Promise<IAConfig> {
  try {
    const supabase = createServiceClient()

    const { data } = await supabase
      .from('platform_settings')
      .select('key, value')
      .in('key', ['ia_enabled', 'ia_model', 'ia_embedding_model', 'openai_api_key'])

    const settings = new Map((data || []).map(r => [r.key, r.value]))

    const apiKey = settings.get('openai_api_key') || process.env.OPENAI_API_KEY || ''
    const enabledFromDb = (settings.get('ia_enabled') || 'true') === 'true'

    return {
      // Auto-disable if no API key is configured
      enabled: enabledFromDb && apiKey.length > 0,
      model: settings.get('ia_model') || DEFAULTS.model,
      embeddingModel: settings.get('ia_embedding_model') || DEFAULTS.embeddingModel,
      apiKey,
    }
  } catch {
    // Fallback to env vars if DB is unreachable
    return {
      ...DEFAULTS,
      apiKey: process.env.OPENAI_API_KEY || '',
    }
  }
}
