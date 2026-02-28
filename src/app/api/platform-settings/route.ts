import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_KEYS = [
  'ia_enabled', 'ia_model', 'ia_embedding_model', 'openai_api_key',
  'email_enabled', 'resend_api_key', 'sender_email', 'sender_name',
]

const MASKED_KEYS = ['openai_api_key', 'resend_api_key']

async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return null
  return user
}

export async function GET() {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value, updated_at')
    .in('key', ALLOWED_KEYS)

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar configuracoes' }, { status: 500 })
  }

  // Build a key-value map, masking sensitive keys
  const settings: Record<string, string> = {}
  for (const row of data || []) {
    if (MASKED_KEYS.includes(row.key) && row.value) {
      settings[row.key] = row.value.slice(0, 7) + '...' + row.value.slice(-4)
    } else {
      settings[row.key] = row.value
    }
  }

  return NextResponse.json({ settings })
}

export async function PUT(request: NextRequest) {
  const user = await checkSuperAdmin()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  const supabase = createServiceClient()

  for (const [key, value] of Object.entries(body)) {
    if (!ALLOWED_KEYS.includes(key)) continue
    if (typeof value !== 'string') continue

    // Skip empty or masked API key updates
    if (MASKED_KEYS.includes(key) && (value === '' || value.includes('...'))) continue

    await supabase
      .from('platform_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}
