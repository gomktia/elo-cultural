'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyInAppPagamento } from '@/lib/notifications/notify'

export async function registrarPagamento(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const termoId = formData.get('termo_id') as string
  const projetoId = formData.get('projeto_id') as string
  const valor = parseFloat(formData.get('valor') as string)
  const numeroParcela = parseInt(formData.get('numero_parcela') as string) || 1
  const dataPagamento = formData.get('data_pagamento') as string
  const observacoes = formData.get('observacoes') as string
  const editalId = formData.get('edital_id') as string

  if (!termoId || !projetoId || !valor) return { error: 'Dados incompletos' }

  const { error } = await supabase.from('pagamentos').insert({
    tenant_id: profile.tenant_id,
    termo_id: termoId,
    projeto_id: projetoId,
    numero_parcela: numeroParcela,
    valor,
    data_pagamento: dataPagamento || null,
    status: dataPagamento ? 'liberado' : 'pendente',
    observacoes: observacoes || null,
    registrado_por: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/editais/${editalId}/termos`)
  return { success: true }
}

export async function atualizarStatusPagamento(
  pagamentoId: string,
  status: 'pendente' | 'liberado' | 'pago' | 'cancelado',
  editalId: string,
) {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'pago') {
    updateData.data_pagamento = new Date().toISOString().split('T')[0]
  }

  // Get pagamento details for notification
  const { data: pagamento } = await supabase
    .from('pagamentos')
    .select('projeto_id, valor')
    .eq('id', pagamentoId)
    .single()

  const { error } = await supabase
    .from('pagamentos')
    .update(updateData)
    .eq('id', pagamentoId)

  if (error) return { error: error.message }

  // Notify proponente when payment is released or paid
  if (pagamento && (status === 'liberado' || status === 'pago')) {
    notifyInAppPagamento({
      projetoId: pagamento.projeto_id,
      valor: Number(pagamento.valor),
      status,
    }).catch(() => {})
  }

  revalidatePath(`/admin/editais/${editalId}/termos`)
  return { success: true }
}
