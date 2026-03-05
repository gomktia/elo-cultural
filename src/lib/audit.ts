import type { SupabaseClient } from '@supabase/supabase-js'

interface LogAuditParams {
  supabase: SupabaseClient
  acao: string
  tabela_afetada: string
  registro_id: string
  tenant_id: string
  usuario_id: string
  dados_antigos?: Record<string, unknown> | null
  dados_novos?: Record<string, unknown> | null
  ip_address?: string | null
}

export async function logAudit({
  supabase,
  acao,
  tabela_afetada,
  registro_id,
  tenant_id,
  usuario_id,
  dados_antigos = null,
  dados_novos = null,
  ip_address = null,
}: LogAuditParams): Promise<void> {
  try {
    await supabase.from('logs_auditoria').insert({
      tenant_id,
      usuario_id,
      acao,
      tabela_afetada,
      registro_id,
      dados_antigos,
      dados_novos,
      ip_address,
    })
  } catch (err) {
    console.error('[AUDIT] Falha ao gravar log de auditoria:', err)
  }
}

export async function logAuditFromRequest(
  params: Omit<LogAuditParams, 'ip_address'> & { request?: Request }
): Promise<void> {
  const ip = params.request
    ? params.request.headers.get('x-forwarded-for') ||
      params.request.headers.get('x-real-ip') ||
      null
    : null

  return logAudit({ ...params, ip_address: ip })
}
