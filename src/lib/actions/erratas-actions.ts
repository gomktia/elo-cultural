'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarErrata(editalId: string, data: {
  descricao: string
  campo_alterado?: string
  valor_anterior?: string
  valor_novo?: string
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

  // Get next errata number
  const { count } = await supabase
    .from('edital_erratas')
    .select('id', { count: 'exact', head: true })
    .eq('edital_id', editalId)

  const numero_errata = (count || 0) + 1

  const { error } = await supabase.from('edital_erratas').insert({
    edital_id: editalId,
    tenant_id: profile.tenant_id,
    numero_errata,
    descricao: data.descricao,
    campo_alterado: data.campo_alterado || null,
    valor_anterior: data.valor_anterior || null,
    valor_novo: data.valor_novo || null,
  })

  if (error) return { error: error.message }

  revalidatePath(`/admin/editais/${editalId}/erratas`)
  return { success: true, numero_errata }
}

export async function publicarErrata(errataId: string, editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { error } = await supabase
    .from('edital_erratas')
    .update({
      publicado_em: new Date().toISOString(),
      publicado_por: user.id,
    })
    .eq('id', errataId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/editais/${editalId}/erratas`)
  return { success: true }
}

export async function excluirErrata(errataId: string, editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  // Only allow deleting unpublished erratas
  const { data: errata } = await supabase
    .from('edital_erratas')
    .select('publicado_em')
    .eq('id', errataId)
    .single()

  if (errata?.publicado_em) {
    return { error: 'Não é possível excluir errata já publicada' }
  }

  const { error } = await supabase
    .from('edital_erratas')
    .delete()
    .eq('id', errataId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/editais/${editalId}/erratas`)
  return { success: true }
}
