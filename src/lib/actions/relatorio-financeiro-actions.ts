'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function solicitarRelatorioFinanceiro(params: {
  projetoId: string
  prestacaoId?: string
  motivo: string
  prazoDias: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil nao encontrado' }

  // Get proponente_id from the project
  const { data: projeto } = await supabase
    .from('projetos')
    .select('proponente_id')
    .eq('id', params.projetoId)
    .single()
  if (!projeto) return { error: 'Projeto nao encontrado' }

  const { error } = await supabase.from('relatorios_financeiros').insert({
    tenant_id: profile.tenant_id,
    projeto_id: params.projetoId,
    prestacao_id: params.prestacaoId || null,
    proponente_id: projeto.proponente_id,
    status: 'pendente',
    motivo: params.motivo,
    data_notificacao: new Date().toISOString(),
    prazo_dias: params.prazoDias,
  })

  if (error) return { error: error.message }

  revalidatePath(`/gestor/prestacao-contas`)
  revalidatePath(`/projetos/${params.projetoId}`)
  return { success: true }
}

export async function enviarRelatorioFinanceiro(
  relatorioId: string,
  data: {
    saldoRemanescente: number
    observacoes: string
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  // Verify ownership
  const { data: relatorio } = await supabase
    .from('relatorios_financeiros')
    .select('id, proponente_id, projeto_id')
    .eq('id', relatorioId)
    .single()
  if (!relatorio) return { error: 'Relatorio nao encontrado' }
  if (relatorio.proponente_id !== user.id) return { error: 'Sem permissao' }

  const { error } = await supabase
    .from('relatorios_financeiros')
    .update({
      status: 'enviado',
      saldo_remanescente: data.saldoRemanescente,
      observacoes: data.observacoes,
      data_envio: new Date().toISOString(),
    })
    .eq('id', relatorioId)

  if (error) return { error: error.message }

  revalidatePath(`/projetos/${relatorio.projeto_id}/relatorio-financeiro`)
  return { success: true }
}

export async function adicionarPagamentoRelatorio(params: {
  relatorioId: string
  dataPagamento: string
  descricao: string
  valor: number
  comprovantePath?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: relatorio } = await supabase
    .from('relatorios_financeiros')
    .select('id, proponente_id, projeto_id, status')
    .eq('id', params.relatorioId)
    .single()
  if (!relatorio) return { error: 'Relatorio nao encontrado' }
  if (relatorio.proponente_id !== user.id) return { error: 'Sem permissao' }
  if (relatorio.status !== 'pendente') return { error: 'Relatorio ja enviado' }

  const { data, error } = await supabase
    .from('relatorio_financeiro_pagamentos')
    .insert({
      relatorio_id: params.relatorioId,
      data_pagamento: params.dataPagamento,
      descricao: params.descricao,
      valor: params.valor,
      comprovante_path: params.comprovantePath || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/projetos/${relatorio.projeto_id}/relatorio-financeiro`)
  return { success: true, id: data.id }
}

export async function removerPagamentoRelatorio(pagamentoId: string, projetoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { error } = await supabase
    .from('relatorio_financeiro_pagamentos')
    .delete()
    .eq('id', pagamentoId)

  if (error) return { error: error.message }

  revalidatePath(`/projetos/${projetoId}/relatorio-financeiro`)
  return { success: true }
}

export async function analisarRelatorioFinanceiro(
  relatorioId: string,
  parecer: string,
  aprovado: boolean
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Nao autenticado' }

  const { data: relatorio } = await supabase
    .from('relatorios_financeiros')
    .select('id, projeto_id')
    .eq('id', relatorioId)
    .single()
  if (!relatorio) return { error: 'Relatorio nao encontrado' }

  const { error } = await supabase
    .from('relatorios_financeiros')
    .update({
      status: aprovado ? 'aprovado' : 'reprovado',
      parecer_gestor: parecer,
      data_analise: new Date().toISOString(),
      analisado_por: user.id,
    })
    .eq('id', relatorioId)

  if (error) return { error: error.message }

  revalidatePath(`/gestor/relatorio-financeiro/${relatorioId}`)
  revalidatePath(`/projetos/${relatorio.projeto_id}/relatorio-financeiro`)
  return { success: true }
}
