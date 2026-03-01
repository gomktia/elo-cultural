'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import type { Notificacao } from '@/types/notificacoes'
import { useSidebar } from '@/components/ui/sidebar'

const POLL_INTERVAL = 60_000

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function NotificationBell() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const { state } = useSidebar()
  const isCollapsed = state === 'collapsed'

  const fetchNotificacoes = useCallback(async () => {
    try {
      const res = await fetch('/api/notificacoes?limit=5')
      if (!res.ok) return
      const data = await res.json()
      setNotificacoes(data.notificacoes || [])
      setUnreadCount(data.unread_count || 0)
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    fetchNotificacoes()
    const interval = setInterval(fetchNotificacoes, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [fetchNotificacoes])

  // Re-fetch when dropdown opens
  useEffect(() => {
    if (open) fetchNotificacoes()
  }, [open, fetchNotificacoes])

  async function markAsRead(id: string) {
    await fetch('/api/notificacoes/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllRead() {
    await fetch('/api/notificacoes/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
    setUnreadCount(0)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={[
            'relative flex items-center justify-center rounded-xl transition-all duration-200',
            'text-slate-500 hover:text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10',
            isCollapsed ? 'h-9 w-9 mx-auto' : 'h-10 w-full gap-3 px-3',
          ].join(' ')}
          title="Notificações"
        >
          <Bell className="h-[18px] w-[18px] flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Notificações</span>
          )}
          {unreadCount > 0 && (
            <span className={[
              'absolute flex items-center justify-center rounded-full bg-[var(--brand-warning)] text-white text-[10px] font-bold leading-none min-w-[18px] h-[18px] px-1',
              isCollapsed ? 'top-0 right-0' : 'top-1.5 left-5',
            ].join(' ')}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          {!isCollapsed && <span className="ml-auto" />}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-80 p-0 rounded-xl shadow-lg border-slate-200 bg-white overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900">Notificações</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] hover:underline"
            >
              <CheckCheck className="h-3 w-3" />
              Marcar todas como lidas
            </button>
          )}
        </div>

        {/* Notifications list */}
        <div className="max-h-80 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map(n => (
              <div
                key={n.id}
                className={[
                  'px-4 py-3 border-b border-slate-50 last:border-b-0 transition-colors',
                  n.lida ? 'bg-white' : 'bg-[var(--brand-primary)]/[0.03]',
                ].join(' ')}
              >
                <div className="flex items-start gap-2">
                  {!n.lida && (
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-[var(--brand-primary)] flex-shrink-0" />
                  )}
                  <div className={`flex-1 min-w-0 ${n.lida ? 'pl-4' : ''}`}>
                    <p className="text-sm font-semibold text-slate-900 truncate">{n.titulo}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.mensagem}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[11px] text-slate-400">{timeAgo(n.created_at)}</span>
                      {!n.lida && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="text-[11px] text-[var(--brand-primary)] hover:underline font-medium"
                        >
                          Marcar como lida
                        </button>
                      )}
                      {n.link && (
                        <Link
                          href={n.link}
                          onClick={() => { if (!n.lida) markAsRead(n.id); setOpen(false) }}
                          className="text-[11px] text-[var(--brand-primary)] hover:underline font-medium flex items-center gap-0.5"
                        >
                          Ver <ExternalLink className="h-2.5 w-2.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 px-4 py-2.5">
          <Link
            href="/notificacoes"
            onClick={() => setOpen(false)}
            className="text-sm font-medium text-[var(--brand-primary)] hover:underline flex items-center justify-center gap-1"
          >
            Ver todas as notificações
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
