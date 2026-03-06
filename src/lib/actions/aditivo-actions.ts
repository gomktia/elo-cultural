'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarAditivo(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase.from('profiles').select('tenant_id, role').eq('id', user.id).single()
  if (!profile || !['admin', 'gestor'].includes(profile.role)) return { error: 'Sem permissão' }

  const termo_id = formData.get('termo_id') as string
  const tipo = formData.get('tipo') as string
  const justificativa = formData.get('justificativa') as string
  const valor_alterado = formData.get('valor_alterado') as string
  const nova_vigencia_fim = formData.get('nova_vigencia_fim') as string

  if (!termo_id || !tipo || !justificativa?.trim()) return { error: 'Campos obrigatórios não preenchidos' }

  // Get next numero_aditivo
  const { data: existing } = await supabase
    .from('termos_aditivos')
    .select('numero_aditivo')
    .eq('termo_id', termo_id)
    .order('numero_aditivo', { ascending: false })
    .limit(1)

  const nextNum = (existing?.[0]?.numero_aditivo || 0) + 1

  // Determine if approval is needed (>20% of original value)
  let requer_aprovacao = false
  if (tipo === 'alteracao_valor' && valor_alterado) {
    const { data: termo } = await supabase.from('termos_execucao').select('valor_total').eq('id', termo_id).single()
    if (termo) {
      const diff = Math.abs(parseFloat(valor_alterado) - Number(termo.valor_total))
      requer_aprovacao = diff > Number(termo.valor_total) * 0.2
    }
  }

  const { error } = await supabase.from('termos_aditivos').insert({
    tenant_id: profile.tenant_id,
    termo_id,
    numero_aditivo: nextNum,
    tipo,
    justificativa: justificativa.trim(),
    valor_alterado: valor_alterado ? parseFloat(valor_alterado) : null,
    nova_vigencia_fim: nova_vigencia_fim || null,
    requer_aprovacao,
    status: requer_aprovacao ? 'pendente' : 'aprovado',
    aprovado_por: requer_aprovacao ? null : user.id,
    aprovado_em: requer_aprovacao ? null : new Date().toISOString(),
  })

  if (error) return { error: error.message }

  // If auto-approved and is prorrogacao, update termo vigencia
  if (!requer_aprovacao && tipo === 'prorrogacao' && nova_vigencia_fim) {
    await supabase.from('termos_execucao').update({ vigencia_fim: nova_vigencia_fim }).eq('id', termo_id)
  }

  revalidatePath('/admin/editais')
  return { success: true }
}

export async function aprovarAditivo(aditivoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: aditivo } = await supabase.from('termos_aditivos').select('*').eq('id', aditivoId).single()
  if (!aditivo) return { error: 'Aditivo não encontrado' }

  const { error } = await supabase.from('termos_aditivos').update({
    status: 'aprovado',
    aprovado_por: user.id,
    aprovado_em: new Date().toISOString(),
  }).eq('id', aditivoId)

  if (error) return { error: error.message }

  // Apply changes
  if (aditivo.tipo === 'prorrogacao' && aditivo.nova_vigencia_fim) {
    await supabase.from('termos_execucao').update({ vigencia_fim: aditivo.nova_vigencia_fim }).eq('id', aditivo.termo_id)
  }
  if (aditivo.tipo === 'alteracao_valor' && aditivo.valor_alterado) {
    await supabase.from('termos_execucao').update({ valor_total: aditivo.valor_alterado }).eq('id', aditivo.termo_id)
  }

  revalidatePath('/admin/editais')
  return { success: true }
}

export async function rejeitarAditivo(aditivoId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase.from('termos_aditivos').update({
    status: 'rejeitado',
    aprovado_por: user.id,
    aprovado_em: new Date().toISOString(),
  }).eq('id', aditivoId)

  if (error) return { error: error.message }

  revalidatePath('/admin/editais')
  return { success: true }
}
