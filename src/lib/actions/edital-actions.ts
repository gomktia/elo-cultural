'use server'

import { createClient } from '@/lib/supabase/server'

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

  if (!profile || !['admin', 'gestor', 'super_admin'].includes(profile.role)) {
    return { error: 'Sem permissão para avançar etapa' }
  }

  const { data: edital, error: fetchError } = await supabase
    .from('editais')
    .select('status, tenant_id')
    .eq('id', editalId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (fetchError || !edital) return { error: 'Edital não encontrado' }

  const currentIndex = FASE_ORDER.indexOf(edital.status as any)
  if (currentIndex === -1) return { error: 'Fase atual inválida' }
  if (currentIndex >= FASE_ORDER.length - 1) return { error: 'Edital já está na última fase' }

  const nextPhase = FASE_ORDER[currentIndex + 1]

  const { error: updateError } = await supabase
    .from('editais')
    .update({ status: nextPhase })
    .eq('id', editalId)

  if (updateError) return { error: updateError.message }

  return { success: true, newPhase: nextPhase }
}
