/**
 * High-level in-app notification functions.
 * Mirrors the pattern from email/notify.ts.
 * All calls are fire-and-forget (non-blocking).
 */

import { createServiceClient } from '@/lib/supabase/service'
import { createNotification, createNotificationBatch } from './create'

// ─── HABILITACAO ───────────────────────────────────────────────

export async function notifyInAppHabilitacao(params: {
  projetoId: string
  status: 'habilitado' | 'inabilitado'
  justificativa: string
}) {
  const supabase = createServiceClient()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, edital_id, tenant_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  const statusLabel = params.status === 'habilitado' ? 'Habilitado' : 'Inabilitado'

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: projeto.proponente_id,
    tipo: 'habilitacao_resultado',
    titulo: `Projeto ${statusLabel}`,
    mensagem: `Seu projeto "${projeto.titulo}" foi ${statusLabel.toLowerCase()}. ${params.justificativa}`.trim(),
    link: `/projetos/${params.projetoId}`,
    metadata: { projeto_id: params.projetoId, status: params.status },
  })
}

// ─── RECURSO ───────────────────────────────────────────────────

export async function notifyInAppRecursoDecisao(params: {
  recursoId: string
  status: 'deferido' | 'indeferido'
  decisao: string
}) {
  const supabase = createServiceClient()

  const { data: recurso } = await supabase
    .from('recursos')
    .select('proponente_id, tipo, projeto_id')
    .eq('id', params.recursoId)
    .single()
  if (!recurso) return

  const { data: projeto } = await supabase
    .from('projetos')
    .select('titulo, tenant_id')
    .eq('id', recurso.projeto_id)
    .single()
  if (!projeto) return

  const statusLabel = params.status === 'deferido' ? 'Deferido' : 'Indeferido'

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: recurso.proponente_id,
    tipo: 'recurso_decisao',
    titulo: `Recurso ${statusLabel}`,
    mensagem: `Seu recurso referente ao projeto "${projeto.titulo}" foi ${statusLabel.toLowerCase()}.`,
    link: `/projetos/${recurso.projeto_id}`,
    metadata: { recurso_id: params.recursoId, projeto_id: recurso.projeto_id, status: params.status },
  })
}

// ─── EDITAL FASE ───────────────────────────────────────────────

const FASE_LABELS: Record<string, string> = {
  inscricao: 'Inscrições Abertas',
  inscricao_encerrada: 'Inscrições Encerradas',
  divulgacao_inscritos: 'Divulgação de Inscritos',
  resultado_preliminar_avaliacao: 'Resultado Preliminar de Avaliação',
  resultado_preliminar_habilitacao: 'Resultado Preliminar de Habilitação',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologação',
}

export async function notifyInAppEditalFase(params: {
  editalId: string
  novaFase: string
}) {
  const fasesNotificaveis = Object.keys(FASE_LABELS)
  if (!fasesNotificaveis.includes(params.novaFase)) return

  const supabase = createServiceClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('titulo, tenant_id')
    .eq('id', params.editalId)
    .single()
  if (!edital) return

  const { data: projetos } = await supabase
    .from('projetos')
    .select('proponente_id')
    .eq('edital_id', params.editalId)

  const proponenteIds = [...new Set((projetos || []).map(p => p.proponente_id))]
  if (proponenteIds.length === 0) return

  const faseLabel = FASE_LABELS[params.novaFase] || params.novaFase

  const notifications = proponenteIds.map(uid => ({
    tenant_id: edital.tenant_id,
    usuario_id: uid,
    tipo: 'edital_fase' as const,
    titulo: `Edital: ${faseLabel}`,
    mensagem: `O edital "${edital.titulo}" avançou para a fase: ${faseLabel}.`,
    link: `/editais`,
    metadata: { edital_id: params.editalId, fase: params.novaFase },
  }))

  await createNotificationBatch(notifications)
}
