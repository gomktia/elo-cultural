'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { ADMIN_ROLES, GESTAO_ROLES } from '@/lib/constants/roles'
import { logAudit } from '@/lib/audit'
import { consolidarRanking } from './consolidar-ranking'

// ── 1. Solicitar Revisao (gestor/admin) ──

interface SolicitarRevisaoParams {
  recursoId: string
  avaliadorId: string
  criteriosRevisar: string[]
  justificativa: string
  editalId: string
}

export async function solicitarRevisao({
  recursoId,
  avaliadorId,
  criteriosRevisar,
  justificativa,
  editalId,
}: SolicitarRevisaoParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])) {
    return { error: 'Sem permissao para solicitar revisao' }
  }

  if (criteriosRevisar.length === 0) {
    return { error: 'Selecione ao menos um criterio para revisao' }
  }

  // Get the recurso to find the projeto
  const { data: recurso } = await supabase
    .from('recursos')
    .select('projeto_id, status')
    .eq('id', recursoId)
    .single()

  if (!recurso) return { error: 'Recurso nao encontrado' }

  // Get current avaliacao to snapshot notas
  const { data: avaliacao } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('projeto_id', recurso.projeto_id)
    .eq('avaliador_id', avaliadorId)
    .single()

  if (!avaliacao) return { error: 'Avaliacao nao encontrada para este avaliador' }

  // Snapshot current scores for the specified criteria
  const { data: notasAtuais } = await supabase
    .from('avaliacao_criterios')
    .select('criterio_id, nota, comentario')
    .eq('avaliacao_id', avaliacao.id)
    .in('criterio_id', criteriosRevisar)

  const notasSnapshot: Record<string, { nota: number; comentario: string | null }> = {}
  for (const n of notasAtuais || []) {
    notasSnapshot[n.criterio_id] = { nota: Number(n.nota), comentario: n.comentario }
  }

  // Create revision record
  const { data: revisao, error: insertError } = await supabase
    .from('recurso_revisoes')
    .insert({
      tenant_id: profile.tenant_id,
      recurso_id: recursoId,
      avaliador_id: avaliadorId,
      criterios_revisar: criteriosRevisar,
      status: 'pendente',
      notas_anteriores: notasSnapshot,
    })
    .select('id')
    .single()

  if (insertError) return { error: insertError.message }

  // Update recurso status to deferido_parcial
  await supabase
    .from('recursos')
    .update({
      status: 'deferido_parcial',
      decisao: justificativa || null,
      decidido_por: user.id,
      data_decisao: new Date().toISOString(),
    })
    .eq('id', recursoId)

  // Reopen the avaliacao so the parecerista can edit it
  await supabase
    .from('avaliacoes')
    .update({ status: 'em_andamento' })
    .eq('id', avaliacao.id)

  // Audit
  logAudit({
    supabase,
    acao: 'SOLICITAR_REVISAO_PARCIAL',
    tabela_afetada: 'recurso_revisoes',
    registro_id: revisao.id,
    tenant_id: profile.tenant_id,
    usuario_id: user.id,
    dados_novos: {
      recurso_id: recursoId,
      avaliador_id: avaliadorId,
      criterios_revisar: criteriosRevisar,
    },
  }).catch(() => {})

  revalidatePath(`/admin/editais/${editalId}/recursos`)
  revalidatePath('/avaliacao')

  return { success: true, revisaoId: revisao.id }
}

// ── 2. Submeter Revisao (avaliador/parecerista) ──

interface SubmeterRevisaoParams {
  revisaoId: string
  notas: Record<string, number>
  justificativa: string
}

export async function submeterRevisao({
  revisaoId,
  notas,
  justificativa,
}: SubmeterRevisaoParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  // Load the revision
  const { data: revisao } = await supabase
    .from('recurso_revisoes')
    .select('*, recursos(projeto_id, id)')
    .eq('id', revisaoId)
    .single()

  if (!revisao) return { error: 'Revisao nao encontrada' }
  if (revisao.avaliador_id !== user.id) return { error: 'Voce nao e o avaliador designado para esta revisao' }
  if (revisao.status === 'revisada') return { error: 'Esta revisao ja foi concluida' }

  const projetoId = (revisao.recursos as any)?.projeto_id
  if (!projetoId) return { error: 'Projeto nao encontrado' }

  // Load the avaliacao
  const { data: avaliacao } = await supabase
    .from('avaliacoes')
    .select('id')
    .eq('projeto_id', projetoId)
    .eq('avaliador_id', user.id)
    .single()

  if (!avaliacao) return { error: 'Avaliacao nao encontrada' }

  // Validate: all criteria to revise must have new scores
  const criteriosRevisar = revisao.criterios_revisar as string[]
  for (const criterioId of criteriosRevisar) {
    if (notas[criterioId] === undefined || notas[criterioId] === null) {
      return { error: `Nota ausente para criterio ${criterioId}` }
    }
  }

  // Update avaliacao_criterios with new scores
  for (const criterioId of criteriosRevisar) {
    const { error: upsertError } = await supabase
      .from('avaliacao_criterios')
      .upsert(
        {
          avaliacao_id: avaliacao.id,
          criterio_id: criterioId,
          nota: notas[criterioId],
          comentario: justificativa || null,
        },
        { onConflict: 'avaliacao_id,criterio_id' }
      )

    if (upsertError) return { error: `Erro ao atualizar nota: ${upsertError.message}` }
  }

  // The DB trigger (calcular_pontuacao_total) will recalculate pontuacao_total automatically.
  // But we also recalculate here to be safe and update the avaliacao status.
  const { data: allNotas } = await supabase
    .from('avaliacao_criterios')
    .select('nota, criterios(peso)')
    .eq('avaliacao_id', avaliacao.id)

  let somaNotasPeso = 0
  let somaPesos = 0
  for (const n of allNotas || []) {
    const peso = (n.criterios as any)?.peso || 1
    somaNotasPeso += Number(n.nota) * peso
    somaPesos += peso
  }
  const novaPontuacao = somaPesos > 0
    ? Math.round((somaNotasPeso / somaPesos) * 100) / 100
    : 0

  // Finalize the avaliacao again
  await supabase
    .from('avaliacoes')
    .update({
      status: 'finalizada',
      pontuacao_total: novaPontuacao,
    })
    .eq('id', avaliacao.id)

  // Build notas_revisadas snapshot
  const notasRevisadas: Record<string, { nota: number }> = {}
  for (const criterioId of criteriosRevisar) {
    notasRevisadas[criterioId] = { nota: notas[criterioId] }
  }

  // Update the revision record
  const { error: updateError } = await supabase
    .from('recurso_revisoes')
    .update({
      status: 'revisada',
      notas_revisadas: notasRevisadas,
      justificativa_revisao: justificativa || null,
      data_revisao: new Date().toISOString(),
    })
    .eq('id', revisaoId)

  if (updateError) return { error: updateError.message }

  // Get profile for audit
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (profile) {
    logAudit({
      supabase,
      acao: 'SUBMETER_REVISAO_PARCIAL',
      tabela_afetada: 'recurso_revisoes',
      registro_id: revisaoId,
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      dados_novos: {
        notas_revisadas: notasRevisadas,
        nova_pontuacao: novaPontuacao,
      },
    }).catch(() => {})
  }

  revalidatePath('/avaliacao')

  return { success: true, novaPontuacao }
}

// ── 3. Finalizar Deferimento Parcial (gestor/admin) ──

export async function finalizarDeferimentoParcial(recursoId: string, editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])) {
    return { error: 'Sem permissao' }
  }

  // Check all revisoes are completed
  const { data: revisoes } = await supabase
    .from('recurso_revisoes')
    .select('id, status')
    .eq('recurso_id', recursoId)

  if (!revisoes || revisoes.length === 0) {
    return { error: 'Nenhuma revisao encontrada para este recurso' }
  }

  const pendentes = revisoes.filter(r => r.status !== 'revisada')
  if (pendentes.length > 0) {
    return { error: `Ainda ha ${pendentes.length} revisao(oes) pendente(s)` }
  }

  // Get the recurso's project
  const { data: recurso } = await supabase
    .from('recursos')
    .select('projeto_id')
    .eq('id', recursoId)
    .single()

  if (!recurso) return { error: 'Recurso nao encontrado' }

  // Recalculate nota_final for the project (average of all avaliacoes)
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('pontuacao_total')
    .eq('projeto_id', recurso.projeto_id)
    .eq('status', 'finalizada')
    .not('pontuacao_total', 'is', null)

  if (avaliacoes && avaliacoes.length > 0) {
    const soma = avaliacoes.reduce((sum, a) => sum + Number(a.pontuacao_total), 0)
    const notaFinal = Math.round((soma / avaliacoes.length) * 100) / 100

    await supabase
      .from('projetos')
      .update({ nota_final: notaFinal })
      .eq('id', recurso.projeto_id)
  }

  // Update recurso status to deferido
  const { error: updateError } = await supabase
    .from('recursos')
    .update({
      status: 'deferido',
      data_decisao: new Date().toISOString(),
    })
    .eq('id', recursoId)

  if (updateError) return { error: updateError.message }

  // Audit
  logAudit({
    supabase,
    acao: 'FINALIZAR_DEFERIMENTO_PARCIAL',
    tabela_afetada: 'recursos',
    registro_id: recursoId,
    tenant_id: profile.tenant_id,
    usuario_id: user.id,
    dados_novos: { status: 'deferido' },
  }).catch(() => {})

  // Trigger ranking recalculation
  const rankingResult = await consolidarRanking(editalId)

  revalidatePath(`/admin/editais/${editalId}/recursos`)
  revalidatePath(`/admin/editais/${editalId}/ranking`)

  return { success: true, ranking: rankingResult }
}

// ── 4. Get revisoes for an avaliador ──

export async function getMinhasRevisoes() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado', data: null }

  const { data, error } = await supabase
    .from('recurso_revisoes')
    .select(`
      *,
      recursos(
        id,
        numero_protocolo,
        tipo,
        projeto_id,
        projetos(titulo, numero_protocolo, edital_id, editais(titulo))
      )
    `)
    .eq('avaliador_id', user.id)
    .in('status', ['pendente', 'em_revisao'])
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }

  return { data, error: null }
}

// ── 5. Get revisao detail with criteria info ──

export async function getRevisaoDetail(revisaoId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado', data: null }

  const { data: revisao, error } = await supabase
    .from('recurso_revisoes')
    .select(`
      *,
      recursos(
        id,
        numero_protocolo,
        fundamentacao,
        projeto_id,
        projetos(titulo, numero_protocolo, edital_id, editais(titulo))
      )
    `)
    .eq('id', revisaoId)
    .single()

  if (error || !revisao) return { error: error?.message || 'Revisao nao encontrada', data: null }

  // Verify access: must be the assigned avaliador or staff
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const isStaff = profile && GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])
  if (revisao.avaliador_id !== user.id && !isStaff) {
    return { error: 'Sem permissao', data: null }
  }

  // Load criteria details
  const projetoData = revisao.recursos as any
  const editalId = projetoData?.projetos?.edital_id

  const { data: criterios } = editalId
    ? await supabase
        .from('criterios')
        .select('id, descricao, nota_minima, nota_maxima, peso, ordem')
        .eq('edital_id', editalId)
        .order('ordem')
    : { data: [] }

  // Filter to only the criteria that need revision
  const criteriosRevisar = revisao.criterios_revisar as string[]
  const criteriosFiltrados = (criterios || []).filter((c: any) => criteriosRevisar.includes(c.id))

  return {
    data: {
      ...revisao,
      criterios_detail: criteriosFiltrados,
    },
    error: null,
  }
}
