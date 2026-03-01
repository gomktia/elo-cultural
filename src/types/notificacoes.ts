export type TipoNotificacao =
  | 'projeto_status'
  | 'habilitacao_resultado'
  | 'recurso_decisao'
  | 'avaliacao_atribuida'
  | 'edital_fase'
  | 'prestacao_status'
  | 'sistema'

export interface Notificacao {
  id: string
  tenant_id: string
  usuario_id: string
  tipo: TipoNotificacao
  titulo: string
  mensagem: string
  lida: boolean
  link: string | null
  metadata: Record<string, unknown>
  created_at: string
}

export interface NotificacoesResponse {
  notificacoes: Notificacao[]
  unread_count: number
}
