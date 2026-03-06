'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function registrarImpedimento(params: {
  editalId: string
  avaliadorId: string
  projetoId: string
  motivo: string
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

  const { error } = await supabase.from('impedimentos_parecerista').insert({
    tenant_id: profile.tenant_id,
    edital_id: params.editalId,
    avaliador_id: params.avaliadorId,
    projeto_id: params.projetoId,
    motivo: params.motivo,
    registrado_por: user.id,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Impedimento ja registrado' }
    return { error: error.message }
  }

  revalidatePath(`/admin/editais/${params.editalId}/atribuicoes`)
  return { success: true }
}

export async function removerImpedimento(impedimentoId: string, editalId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('impedimentos_parecerista')
    .delete()
    .eq('id', impedimentoId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/editais/${editalId}/atribuicoes`)
  return { success: true }
}
