'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarRequerimento(data: {
  projetoId: string
  termoId: string | null
  tenantId: string
  tipo: string
  justificativa: string
  valorEnvolvido: number | null
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const protocolo = `REQ-${Date.now().toString(36).toUpperCase()}`

  const { error } = await supabase.from('requerimentos').insert({
    tenant_id: data.tenantId,
    projeto_id: data.projetoId,
    termo_id: data.termoId || null,
    proponente_id: user.id,
    tipo: data.tipo,
    justificativa: data.justificativa,
    valor_envolvido: data.valorEnvolvido,
    protocolo,
    created_by: user.id,
  })

  if (error) return { error: error.message }

  revalidatePath(`/projetos/${data.projetoId}`)
  return { success: true, protocolo }
}

export async function analisarRequerimento(requerimentoId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('requerimentos')
    .update({ status: 'em_analise' })
    .eq('id', requerimentoId)
    .eq('status', 'pendente')

  if (error) return { error: error.message }
  revalidatePath('/admin', 'layout')
  return { success: true }
}

export async function pedirDiligencia(requerimentoId: string, texto: string) {
  const supabase = await createClient()

  // Check max 2
  const { data: req } = await supabase
    .from('requerimentos')
    .select('diligencia_count')
    .eq('id', requerimentoId)
    .single()

  if (!req) return { error: 'Requerimento não encontrado' }
  if ((req.diligencia_count || 0) >= 2) return { error: 'Limite de diligências atingido (máximo 2)' }

  const { error } = await supabase
    .from('requerimentos')
    .update({
      status: 'diligencia',
      diligencia_texto: texto,
      diligencia_count: (req.diligencia_count || 0) + 1,
      diligencia_em: new Date().toISOString(),
      diligencia_resposta: null,
      diligencia_respondida_em: null,
    })
    .eq('id', requerimentoId)

  if (error) return { error: error.message }
  revalidatePath('/admin', 'layout')
  return { success: true }
}

export async function responderDiligencia(requerimentoId: string, resposta: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('requerimentos')
    .update({
      status: 'respondida',
      diligencia_resposta: resposta,
      diligencia_respondida_em: new Date().toISOString(),
    })
    .eq('id', requerimentoId)

  if (error) return { error: error.message }
  revalidatePath('/projetos', 'layout')
  return { success: true }
}

export async function decidirRequerimento(
  requerimentoId: string,
  decisao: 'deferido' | 'indeferido',
  texto: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { error } = await supabase
    .from('requerimentos')
    .update({
      status: decisao,
      decisao_texto: texto,
      decidido_por: user.id,
      decidido_em: new Date().toISOString(),
    })
    .eq('id', requerimentoId)

  if (error) return { error: error.message }
  revalidatePath('/admin', 'layout')
  return { success: true }
}
