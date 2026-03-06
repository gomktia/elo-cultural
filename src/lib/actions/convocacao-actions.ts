'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyInAppConvocacaoSuplente } from '@/lib/notifications/notify'

/**
 * Convocar próximo suplente para substituir um projeto inabilitado/desistente.
 * Automaticamente seleciona o suplente com maior nota que ainda não foi convocado.
 */
export async function convocarSuplente(editalId: string, data: {
  projetoSubstituidoId: string
  motivo: string
  prazoDias?: number
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['gestor', 'admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Sem permissão' }
  }

  // Get the project being replaced to know its category
  const { data: projetoSubstituido } = await supabase
    .from('projetos')
    .select('categoria_id')
    .eq('id', data.projetoSubstituidoId)
    .single()

  // Find next suplente (highest nota_final among suplentes, same category, not already convocado)
  const { data: convocacoesExistentes } = await supabase
    .from('convocacoes')
    .select('projeto_id')
    .eq('edital_id', editalId)

  const projetosJaConvocados = new Set((convocacoesExistentes || []).map(c => c.projeto_id))

  let query = supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, nota_final, proponente_id')
    .eq('edital_id', editalId)
    .eq('status_atual', 'suplente')
    .order('nota_final', { ascending: false })

  if (projetoSubstituido?.categoria_id) {
    query = query.eq('categoria_id', projetoSubstituido.categoria_id)
  }

  const { data: suplentes } = await query

  // Filter out already-convocados
  const proximo = (suplentes || []).find(s => !projetosJaConvocados.has(s.id))

  if (!proximo) {
    return { error: 'Não há suplentes disponíveis para convocação' }
  }

  // Count chamada number for this project
  const { count: chamadaCount } = await supabase
    .from('convocacoes')
    .select('id', { count: 'exact', head: true })
    .eq('edital_id', editalId)

  const numero_chamada = (chamadaCount || 0) + 1
  const prazoDias = data.prazoDias || 5
  const prazo = new Date()
  prazo.setDate(prazo.getDate() + prazoDias)

  // Insert convocação
  const { error: insertError } = await supabase.from('convocacoes').insert({
    edital_id: editalId,
    projeto_id: proximo.id,
    tenant_id: profile.tenant_id,
    numero_chamada,
    motivo: data.motivo,
    projeto_substituido_id: data.projetoSubstituidoId,
    prazo_habilitacao: prazo.toISOString(),
    convocado_por: user.id,
  })

  if (insertError) return { error: insertError.message }

  // Update the suplente's status
  await supabase.from('projetos').update({
    status_atual: `suplente_convocado_${numero_chamada}a`,
  }).eq('id', proximo.id)

  // Update the replaced project's status
  await supabase.from('projetos').update({
    status_atual: 'inabilitado',
  }).eq('id', data.projetoSubstituidoId)

  // Notify suplente (fire-and-forget)
  notifyInAppConvocacaoSuplente({
    projetoId: proximo.id,
    numeroChamada: numero_chamada,
    prazoHabilitacao: prazo.toISOString(),
  }).catch(() => {})

  revalidatePath(`/admin/editais/${editalId}/ranking`)
  revalidatePath(`/admin/editais/${editalId}/convocacoes`)

  return {
    success: true,
    convocado: {
      titulo: proximo.titulo,
      protocolo: proximo.numero_protocolo,
      nota: proximo.nota_final,
    },
    numero_chamada,
    prazo_habilitacao: prazo.toISOString(),
  }
}

/**
 * Atualizar status de uma convocação (habilitado, inabilitado, desistente, prazo_expirado)
 */
export async function atualizarConvocacao(convocacaoId: string, editalId: string, data: {
  status: 'habilitado' | 'inabilitado' | 'desistente' | 'prazo_expirado'
  observacao?: string
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('convocacoes')
    .update({
      status: data.status,
      observacao: data.observacao || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', convocacaoId)

  if (error) return { error: error.message }

  // Get convocação to update project status
  const { data: convocacao } = await supabase
    .from('convocacoes')
    .select('projeto_id')
    .eq('id', convocacaoId)
    .single()

  if (convocacao) {
    if (data.status === 'habilitado') {
      await supabase.from('projetos').update({ status_atual: 'selecionado' }).eq('id', convocacao.projeto_id)
    } else {
      // If not habilitado, revert to suplente
      await supabase.from('projetos').update({ status_atual: 'suplente' }).eq('id', convocacao.projeto_id)
    }
  }

  revalidatePath(`/admin/editais/${editalId}/convocacoes`)
  revalidatePath(`/admin/editais/${editalId}/ranking`)

  return { success: true }
}
