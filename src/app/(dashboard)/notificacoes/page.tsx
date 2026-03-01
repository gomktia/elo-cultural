import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, CheckCheck } from 'lucide-react'
import Link from 'next/link'
import type { Notificacao } from '@/types/notificacoes'
import { MarkAllReadButton, MarkReadButton } from './actions'

const PAGE_SIZE = 20

export default async function NotificacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam || '1'))
  const offset = (page - 1) * PAGE_SIZE

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [{ data: notificacoes, count }, { count: unreadCount }] = await Promise.all([
    supabase
      .from('notificacoes')
      .select('*', { count: 'exact' })
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lida', false),
  ])

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
  const items = (notificacoes || []) as Notificacao[]

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Notificações</h1>
              <p className="text-sm text-slate-500">
                {(unreadCount || 0) > 0
                  ? `${unreadCount} não lida${(unreadCount || 0) > 1 ? 's' : ''}`
                  : 'Todas lidas'}
              </p>
            </div>
            {(unreadCount || 0) > 0 && <MarkAllReadButton />}
          </div>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Bell className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma notificação ainda</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {items.map(n => (
              <div
                key={n.id}
                className={[
                  'px-5 py-4 flex items-start gap-3 transition-colors',
                  n.lida ? 'bg-white' : 'bg-[var(--brand-primary)]/[0.03]',
                ].join(' ')}
              >
                {!n.lida && (
                  <div className="mt-2 h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)] flex-shrink-0" />
                )}
                <div className={`flex-1 min-w-0 ${n.lida ? 'pl-5' : ''}`}>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.titulo}</p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {new Date(n.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">{n.mensagem}</p>
                  <div className="flex items-center gap-3 mt-2">
                    {n.link && (
                      <Link
                        href={n.link}
                        className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
                      >
                        Ver detalhes
                      </Link>
                    )}
                    {!n.lida && <MarkReadButton id={n.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/notificacoes?page=${page - 1}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-slate-400">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/notificacoes?page=${page + 1}`}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Próxima
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
