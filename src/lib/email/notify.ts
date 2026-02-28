/**
 * High-level notification functions.
 * These are called from server actions and API routes.
 * All calls are fire-and-forget (non-blocking).
 */

import { createServiceClient } from '@/lib/supabase/service'
import { sendEmail } from './resend'
import * as templates from './templates'

async function getUserEmail(userId: string): Promise<{ email: string; nome: string } | null> {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.admin.getUserById(userId)
  if (!user?.email) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome')
    .eq('id', userId)
    .single()

  return { email: user.email, nome: profile?.nome || user.email }
}

// ─── INSCRICAO ─────────────────────────────────────────────────

export async function notifyInscricaoConfirmada(params: {
  proponenteId: string
  protocolo: string
  titulo: string
  editalTitulo: string
}) {
  const user = await getUserEmail(params.proponenteId)
  if (!user) return

  const { subject, html } = templates.inscricaoConfirmada({
    nome: user.nome,
    protocolo: params.protocolo,
    titulo: params.titulo,
    editalTitulo: params.editalTitulo,
    dataEnvio: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  })

  await sendEmail({ to: user.email, subject, html })
}

// ─── HABILITACAO ───────────────────────────────────────────────

export async function notifyHabilitacaoResultado(params: {
  projetoId: string
  status: 'habilitado' | 'inabilitado'
  justificativa: string
}) {
  const supabase = createServiceClient()
  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id, titulo, edital_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return

  const { data: edital } = await supabase
    .from('editais')
    .select('titulo')
    .eq('id', projeto.edital_id)
    .single()

  const user = await getUserEmail(projeto.proponente_id)
  if (!user) return

  const { subject, html } = templates.habilitacaoResultado({
    nome: user.nome,
    titulo: projeto.titulo,
    editalTitulo: edital?.titulo || '',
    status: params.status,
    justificativa: params.justificativa,
  })

  await sendEmail({ to: user.email, subject, html })
}

// ─── RECURSO ───────────────────────────────────────────────────

export async function notifyRecursoDecisao(params: {
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
    .select('titulo, edital_id')
    .eq('id', recurso.projeto_id)
    .single()

  const { data: edital } = await supabase
    .from('editais')
    .select('titulo')
    .eq('id', projeto?.edital_id)
    .single()

  const user = await getUserEmail(recurso.proponente_id)
  if (!user) return

  const tipoLabel = recurso.tipo === 'habilitacao' ? 'habilitacao' : 'avaliacao'

  const { subject, html } = templates.recursoDecisao({
    nome: user.nome,
    titulo: projeto?.titulo || '',
    editalTitulo: edital?.titulo || '',
    tipo: tipoLabel,
    status: params.status,
    decisao: params.decisao,
  })

  await sendEmail({ to: user.email, subject, html })
}

// ─── EDITAL FASE ───────────────────────────────────────────────

export async function notifyEditalFaseAlterada(params: {
  editalId: string
  novaFase: string
}) {
  // Only send for phases that matter to proponentes
  const fasesNotificaveis = [
    'inscricao', 'inscricao_encerrada', 'divulgacao_inscritos',
    'resultado_preliminar_avaliacao', 'resultado_preliminar_habilitacao',
    'resultado_final', 'homologacao',
  ]

  if (!fasesNotificaveis.includes(params.novaFase)) return

  const supabase = createServiceClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('titulo, numero_edital')
    .eq('id', params.editalId)
    .single()
  if (!edital) return

  // Get all proponentes inscribed in this edital
  const { data: projetos } = await supabase
    .from('projetos')
    .select('proponente_id')
    .eq('edital_id', params.editalId)

  const proponenteIds = [...new Set((projetos || []).map(p => p.proponente_id))]

  // Send email to each proponente (in parallel, fire-and-forget)
  await Promise.allSettled(
    proponenteIds.map(async (proponenteId) => {
      const user = await getUserEmail(proponenteId)
      if (!user) return

      const { subject, html } = templates.editalFaseAlterada({
        nome: user.nome,
        editalTitulo: edital.titulo,
        editalNumero: edital.numero_edital || '',
        novaFase: params.novaFase,
      })

      await sendEmail({ to: user.email, subject, html })
    })
  )
}

// ─── PRESTACAO DE CONTAS ───────────────────────────────────────

export async function notifyPrestacaoStatus(params: {
  prestacaoId: string
  status: string
  parecer: string
}) {
  const supabase = createServiceClient()
  const { data: prestacao } = await supabase
    .from('prestacoes_contas')
    .select('proponente_id, projeto_id')
    .eq('id', params.prestacaoId)
    .single()
  if (!prestacao) return

  const { data: projeto } = await supabase
    .from('projetos')
    .select('titulo, numero_protocolo')
    .eq('id', prestacao.projeto_id)
    .single()

  const user = await getUserEmail(prestacao.proponente_id)
  if (!user) return

  const { subject, html } = templates.prestacaoStatus({
    nome: user.nome,
    titulo: projeto?.titulo || '',
    protocolo: projeto?.numero_protocolo || '',
    status: params.status,
    parecer: params.parecer,
  })

  await sendEmail({ to: user.email, subject, html })
}
