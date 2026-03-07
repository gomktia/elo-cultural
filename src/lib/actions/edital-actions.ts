'use server'

import { createClient } from '@/lib/supabase/server'
import { notifyEditalFaseAlterada } from '@/lib/email/notify'
import { notifyInAppEditalFase } from '@/lib/notifications/notify'
import { ADMIN_ROLES } from '@/lib/constants/roles'
import { logAudit } from '@/lib/audit'

// Order of phases for the edital workflow
// Note: After fix, seleção (avaliação) comes before habilitação
const FASE_ORDER = [
  'criacao',
  'publicacao',
  'inscricao',
  'inscricao_encerrada',
  'divulgacao_inscritos',
  'recurso_divulgacao_inscritos',
  'avaliacao_tecnica',
  'resultado_preliminar_avaliacao',
  'recurso_avaliacao',
  'habilitacao',
  'resultado_preliminar_habilitacao',
  'recurso_habilitacao',
  'resultado_definitivo_habilitacao',
  'resultado_final',
  'homologacao',
  'arquivamento',
] as const

export async function avancarEtapa(editalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  // Verify user has admin/gestor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissão para avançar etapa' }
  }

  const { data: edital, error: fetchError } = await supabase
    .from('editais')
    .select('status, tenant_id')
    .eq('id', editalId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (fetchError || !edital) return { error: 'Edital não encontrado' }

  const currentIndex = FASE_ORDER.indexOf(edital.status as typeof FASE_ORDER[number])
  if (currentIndex === -1) return { error: 'Fase atual inválida' }
  if (currentIndex >= FASE_ORDER.length - 1) return { error: 'Edital já está na última fase' }

  const nextPhase = FASE_ORDER[currentIndex + 1]

  const { error: updateError } = await supabase
    .from('editais')
    .update({ status: nextPhase })
    .eq('id', editalId)

  if (updateError) return { error: updateError.message }

  logAudit({
    supabase,
    acao: 'AVANCO_FASE_EDITAL',
    tabela_afetada: 'editais',
    registro_id: editalId,
    tenant_id: edital.tenant_id,
    usuario_id: user.id,
    dados_antigos: { status: edital.status },
    dados_novos: { status: nextPhase },
  }).catch(() => {})

  // Fire-and-forget: notify proponentes about phase change
  notifyEditalFaseAlterada({ editalId, novaFase: nextPhase }).catch(() => {})
  notifyInAppEditalFase({ editalId, novaFase: nextPhase }).catch(() => {})

  return { success: true, newPhase: nextPhase }
}

export async function reverterEtapa(editalId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissão para reverter etapa' }
  }

  const { data: edital, error: fetchError } = await supabase
    .from('editais')
    .select('status, tenant_id')
    .eq('id', editalId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (fetchError || !edital) return { error: 'Edital não encontrado' }

  const currentIndex = FASE_ORDER.indexOf(edital.status as typeof FASE_ORDER[number])
  if (currentIndex === -1) return { error: 'Fase atual inválida' }
  if (currentIndex <= 0) return { error: 'Edital já está na primeira fase' }

  const prevPhase = FASE_ORDER[currentIndex - 1]

  const { error: updateError } = await supabase
    .from('editais')
    .update({ status: prevPhase })
    .eq('id', editalId)

  if (updateError) return { error: updateError.message }

  logAudit({
    supabase,
    acao: 'REVERSAO_FASE_EDITAL',
    tabela_afetada: 'editais',
    registro_id: editalId,
    tenant_id: edital.tenant_id,
    usuario_id: user.id,
    dados_antigos: { status: edital.status },
    dados_novos: { status: prevPhase },
  }).catch(() => {})

  return { success: true, newPhase: prevPhase }
}

export async function cancelarEdital(editalId: string, justificativa: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  if (!justificativa.trim()) return { error: 'Justificativa é obrigatória' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissão para cancelar edital' }
  }

  const { error: updateError } = await supabase
    .from('editais')
    .update({
      cancelado: true,
      justificativa_cancelamento: justificativa,
      cancelado_por: user.id,
      cancelado_em: new Date().toISOString(),
    })
    .eq('id', editalId)
    .eq('tenant_id', profile.tenant_id)

  if (updateError) return { error: updateError.message }

  logAudit({
    supabase,
    acao: 'CANCELAMENTO_EDITAL',
    tabela_afetada: 'editais',
    registro_id: editalId,
    tenant_id: profile.tenant_id,
    usuario_id: user.id,
    dados_antigos: null,
    dados_novos: { cancelado: true, justificativa },
  }).catch(() => {})

  return { success: true }
}
