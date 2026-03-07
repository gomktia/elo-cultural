'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { createNotificationBatch } from '@/lib/notifications/create'
import { diasUteisRestantes } from '@/lib/utils/dias-uteis'

/**
 * Check and send reminders for approaching deadlines — Fase 11.1
 * Designed to be called daily via cron/scheduled function.
 */
export async function enviarLembretesPrazos() {
  const supabase = createServiceClient()
  const sent: string[] = []

  // ── 1. Prazo de assinatura do termo vencendo ──
  const { data: termosPendentes } = await supabase
    .from('termos_execucao')
    .select('id, projeto_id, proponente_id, data_envio_para_assinatura, tenant_id, projetos:projeto_id(titulo)')
    .eq('status', 'pendente_assinatura_proponente')
    .not('data_envio_para_assinatura', 'is', null)

  interface TermoPendente {
    id: string
    projeto_id: string
    proponente_id: string
    data_envio_para_assinatura: string | null
    tenant_id: string
    projetos: unknown
  }

  for (const termo of (termosPendentes || []) as unknown as TermoPendente[]) {
    if (!termo.data_envio_para_assinatura) continue
    const diasRestantes = diasUteisRestantes(
      new Date(new Date(termo.data_envio_para_assinatura).getTime() + 2 * 24 * 60 * 60 * 1000) // +2 days default prazo
    )
    if (diasRestantes <= 1 && diasRestantes >= 0) {
      const titulo = (termo.projetos as unknown as { titulo: string } | null)?.titulo || ''
      await createNotificationBatch([{
        tenant_id: termo.tenant_id,
        usuario_id: termo.proponente_id,
        tipo: 'projeto_status',
        titulo: 'Prazo de Assinatura Vencendo',
        mensagem: `O prazo para assinar o Termo de Execução do projeto "${titulo}" está vencendo. Assine o quanto antes.`,
        link: `/projetos/${termo.projeto_id}`,
        metadata: { projeto_id: termo.projeto_id, tipo_lembrete: 'assinatura_termo' },
      }])
      sent.push(`termo_assinatura:${termo.id}`)
    }
  }

  // ── 2. Prazo de prestação de contas se aproximando (30, 15, 7 dias) ──
  const { data: termosVigentes } = await supabase
    .from('termos_execucao')
    .select('id, projeto_id, proponente_id, vigencia_fim, tenant_id, projetos:projeto_id(titulo)')
    .in('status', ['vigente', 'assinado'])
    .not('vigencia_fim', 'is', null)

  interface TermoVigente {
    id: string
    projeto_id: string
    proponente_id: string
    vigencia_fim: string | null
    tenant_id: string
    projetos: unknown
  }

  for (const termo of (termosVigentes || []) as unknown as TermoVigente[]) {
    if (!termo.vigencia_fim) continue

    // Check if prestação already submitted
    const { count } = await supabase
      .from('prestacoes_contas')
      .select('id', { count: 'exact', head: true })
      .eq('projeto_id', termo.projeto_id)

    if ((count || 0) > 0) continue // Already submitted

    const diasRestantes = diasUteisRestantes(termo.vigencia_fim)
    const titulo = (termo.projetos as unknown as { titulo: string } | null)?.titulo || ''
    const thresholds = [30, 15, 7]

    for (const threshold of thresholds) {
      if (diasRestantes === threshold) {
        await createNotificationBatch([{
          tenant_id: termo.tenant_id,
          usuario_id: termo.proponente_id,
          tipo: 'prestacao_status',
          titulo: `Prestação de Contas em ${threshold} dias úteis`,
          mensagem: `O prazo para envio da prestação de contas do projeto "${titulo}" vence em ${threshold} dias úteis.`,
          link: `/projetos/${termo.projeto_id}/prestacao-contas`,
          metadata: { projeto_id: termo.projeto_id, tipo_lembrete: 'prestacao_contas', dias_restantes: threshold },
        }])
        sent.push(`prestacao_lembrete:${termo.id}:${threshold}`)
      }
    }
  }

  // ── 3. Prazo de recurso vencendo ──
  const { data: editais } = await supabase
    .from('editais')
    .select('id, titulo, tenant_id, fim_recurso_inscricao, fim_recurso_selecao, fim_recurso_habilitacao')
    .gte('fim_recurso_inscricao', new Date().toISOString().split('T')[0])
    .or(`fim_recurso_selecao.gte.${new Date().toISOString().split('T')[0]},fim_recurso_habilitacao.gte.${new Date().toISOString().split('T')[0]}`)

  // This is a simplified version - full implementation would check each recurso type
  interface EditalPrazo {
    id: string
    titulo: string
    tenant_id: string
    fim_recurso_inscricao: string | null
    fim_recurso_selecao: string | null
    fim_recurso_habilitacao: string | null
    [key: string]: string | null | undefined
  }

  for (const edital of (editais || []) as unknown as EditalPrazo[]) {
    const deadlines = [
      { field: 'fim_recurso_inscricao', label: 'recurso de inscrição' },
      { field: 'fim_recurso_selecao', label: 'recurso de seleção' },
      { field: 'fim_recurso_habilitacao', label: 'recurso de habilitação' },
    ]

    for (const dl of deadlines) {
      const deadline = edital[dl.field]
      if (!deadline) continue
      const dias = diasUteisRestantes(deadline)
      if (dias === 2 || dias === 1) {
        // Notify all proponentes of this edital
        const { data: projetos } = await supabase
          .from('projetos')
          .select('proponente_id')
          .eq('edital_id', edital.id)

        const proponenteIds = [...new Set((projetos || []).map(p => p.proponente_id))]
        if (proponenteIds.length > 0) {
          const notifications = proponenteIds.map(uid => ({
            tenant_id: edital.tenant_id,
            usuario_id: uid,
            tipo: 'edital_fase' as const,
            titulo: `Prazo de ${dl.label} vencendo`,
            mensagem: `O prazo para ${dl.label} do edital "${edital.titulo}" vence em ${dias} dia${dias > 1 ? 's' : ''} útil(eis).`,
            link: `/editais/${edital.id}`,
            metadata: { edital_id: edital.id, tipo_lembrete: dl.field, dias_restantes: dias },
          }))
          await createNotificationBatch(notifications)
          sent.push(`recurso_lembrete:${edital.id}:${dl.field}`)
        }
      }
    }
  }

  return { sent: sent.length, details: sent }
}
