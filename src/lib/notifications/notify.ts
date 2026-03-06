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

// ─── CONVOCAÇÃO SUPLENTE ──────────────────────────────────────

export async function notifyInAppConvocacaoSuplente(params: {
  projetoId: string
  numeroChamada: number
  prazoHabilitacao: string
}) {
  const supabase = createServiceClient()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, tenant_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: projeto.proponente_id,
    tipo: 'projeto_status',
    titulo: `Convocação de Suplente (${params.numeroChamada}ª chamada)`,
    mensagem: `Seu projeto "${projeto.titulo}" foi convocado como suplente. Apresente a documentação de habilitação até ${new Date(params.prazoHabilitacao).toLocaleDateString('pt-BR')}.`,
    link: `/projetos/${params.projetoId}`,
    metadata: { projeto_id: params.projetoId, numero_chamada: params.numeroChamada },
  })
}

// ─── PAGAMENTO ────────────────────────────────────────────────

export async function notifyInAppPagamento(params: {
  projetoId: string
  valor: number
  status: string
}) {
  const supabase = createServiceClient()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, tenant_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  const statusLabel = params.status === 'pago' ? 'realizado' : 'liberado'

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: projeto.proponente_id,
    tipo: 'projeto_status',
    titulo: `Pagamento ${statusLabel}`,
    mensagem: `Pagamento de R$ ${params.valor.toFixed(2)} referente ao projeto "${projeto.titulo}" foi ${statusLabel}.`,
    link: `/projetos/${params.projetoId}`,
    metadata: { projeto_id: params.projetoId, valor: params.valor },
  })
}

// ─── PRESTAÇÃO DE CONTAS ──────────────────────────────────────

export async function notifyInAppPrestacaoAnalise(params: {
  projetoId: string
  julgamento: string
}) {
  const supabase = createServiceClient()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, tenant_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  const julgamentoLabels: Record<string, string> = {
    sem_ressalvas: 'aprovada sem ressalvas',
    com_ressalvas: 'aprovada com ressalvas',
    rejeitada_parcial: 'rejeitada parcialmente',
    rejeitada_total: 'rejeitada',
  }

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: projeto.proponente_id,
    tipo: 'prestacao_status',
    titulo: 'Prestação de Contas Analisada',
    mensagem: `A prestação de contas do projeto "${projeto.titulo}" foi ${julgamentoLabels[params.julgamento] || params.julgamento}.`,
    link: `/projetos/${params.projetoId}/prestacao-contas`,
    metadata: { projeto_id: params.projetoId, julgamento: params.julgamento },
  })
}

// ─── INSCRIÇÃO CONFIRMADA ─────────────────────────────────────

export async function notifyInAppInscricaoConfirmada(params: {
  projetoId: string
  protocolo: string
}) {
  const supabase = createServiceClient()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, tenant_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  await createNotification({
    tenant_id: projeto.tenant_id,
    usuario_id: projeto.proponente_id,
    tipo: 'projeto_status',
    titulo: 'Inscrição Confirmada',
    mensagem: `Seu projeto "${projeto.titulo}" foi inscrito com sucesso. Protocolo: ${params.protocolo}.`,
    link: `/projetos/${params.projetoId}`,
    metadata: { projeto_id: params.projetoId, protocolo: params.protocolo },
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
