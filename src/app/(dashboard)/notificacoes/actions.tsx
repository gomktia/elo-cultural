'use client'

import { useRouter } from 'next/navigation'
import { CheckCheck } from 'lucide-react'

export function MarkAllReadButton() {
  const router = useRouter()

  async function handleClick() {
    await fetch('/api/notificacoes/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/10 transition-colors"
    >
      <CheckCheck className="h-4 w-4" />
      Marcar todas como lidas
    </button>
  )
}

export function MarkReadButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleClick() {
    await fetch('/api/notificacoes/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleClick}
      className="text-xs font-medium text-[var(--brand-primary)] hover:underline"
    >
      Marcar como lida
    </button>
  )
}
