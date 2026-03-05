'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notifyRecursoDecisao } from '@/lib/email/notify'
import { notifyInAppRecursoDecisao } from '@/lib/notifications/notify'
import { ADMIN_ROLES } from '@/lib/constants/roles'
import { logAudit } from '@/lib/audit'

export async function decidirRecurso(
  recursoId: string,
  decisaoStatus: 'deferido' | 'indeferido',
  decisaoTexto: string,
  editalId: string
) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissão para decidir recursos' }
  }

  // Fetch old status for audit trail
  const { data: recursoOld } = await supabase
    .from('recursos')
    .select('status, tipo')
    .eq('id', recursoId)
    .single()

  const { error } = await supabase
    .from('recursos')
    .update({
      status: decisaoStatus,
      decisao: decisaoTexto || null,
      decidido_por: user.id,
      data_decisao: new Date().toISOString(),
    })
    .eq('id', recursoId)

  if (error) return { error: error.message }

  logAudit({
    supabase,
    acao: 'DECISAO_RECURSO',
    tabela_afetada: 'recursos',
    registro_id: recursoId,
    tenant_id: profile!.tenant_id,
    usuario_id: user.id,
    dados_antigos: recursoOld ? { status: recursoOld.status, tipo: recursoOld.tipo } : null,
    dados_novos: { status: decisaoStatus, decisao: decisaoTexto || null },
  }).catch(() => {})

  // Fire-and-forget: notify proponente
  notifyRecursoDecisao({
    recursoId,
    status: decisaoStatus,
    decisao: decisaoTexto || '',
  }).catch(() => {})
  notifyInAppRecursoDecisao({
    recursoId,
    status: decisaoStatus,
    decisao: decisaoTexto || '',
  }).catch(() => {})

  revalidatePath(`/admin/editais/${editalId}/recursos`)
  return { success: true }
}
