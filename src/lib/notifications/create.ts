import { createServiceClient } from '@/lib/supabase/service'
import type { TipoNotificacao } from '@/types/notificacoes'

interface CreateNotificationParams {
  tenant_id: string
  usuario_id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  link?: string
  metadata?: Record<string, unknown>
}

export async function createNotification(params: CreateNotificationParams) {
  const supabase = createServiceClient()

  const { error } = await supabase.from('notificacoes').insert({
    tenant_id: params.tenant_id,
    usuario_id: params.usuario_id,
    tipo: params.tipo,
    titulo: params.titulo,
    mensagem: params.mensagem,
    link: params.link || null,
    metadata: params.metadata || {},
  })

  if (error) {
    console.error('[notificacoes] Erro ao criar notificacao:', error.message)
  }
}

export async function createNotificationBatch(notifications: CreateNotificationParams[]) {
  if (notifications.length === 0) return

  const supabase = createServiceClient()

  const rows = notifications.map(n => ({
    tenant_id: n.tenant_id,
    usuario_id: n.usuario_id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensagem: n.mensagem,
    link: n.link || null,
    metadata: n.metadata || {},
  }))

  const { error } = await supabase.from('notificacoes').insert(rows)

  if (error) {
    console.error('[notificacoes] Erro ao criar notificacoes em lote:', error.message)
  }
}
