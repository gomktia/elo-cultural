'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { decidirRecurso } from '@/lib/actions/recurso-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, MessageSquare } from 'lucide-react'

interface RecursoActionsProps {
  recursoId: string
  editalId: string
  status: string
  fundamentacao: string
}

export function RecursoActions({ recursoId, editalId, status, fundamentacao }: RecursoActionsProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [decisao, setDecisao] = useState('')
  const [loading, setLoading] = useState<'deferido' | 'indeferido' | null>(null)

  if (status === 'deferido' || status === 'indeferido') return null

  async function handleDecisao(tipo: 'deferido' | 'indeferido') {
    setLoading(tipo)
    const result = await decidirRecurso(recursoId, tipo, decisao, editalId)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Recurso ${tipo === 'deferido' ? 'deferido' : 'indeferido'} com sucesso`)
      setShowForm(false)
      router.refresh()
    }
  }

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="rounded-xl border-slate-200 text-xs font-medium gap-1.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Analisar
      </Button>
    )
  }

  return (
    <div className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 mt-2">
      <div className="text-xs text-slate-500 font-medium">
        <span className="uppercase tracking-wide text-slate-400">Fundamentação:</span>
        <p className="mt-1 text-slate-600 leading-relaxed">{fundamentacao}</p>
      </div>
      <Textarea
        placeholder="Parecer da decisão (opcional)..."
        value={decisao}
        onChange={(e) => setDecisao(e.target.value)}
        className="rounded-xl border-slate-200 text-sm min-h-[60px] resize-none"
      />
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => handleDecisao('deferido')}
          disabled={!!loading}
          className="rounded-xl bg-[var(--brand-success)] hover:opacity-90 text-white font-semibold text-xs gap-1.5"
        >
          {loading === 'deferido' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Deferir
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => handleDecisao('indeferido')}
          disabled={!!loading}
          className="rounded-xl font-semibold text-xs gap-1.5"
        >
          {loading === 'indeferido' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
          Indeferir
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowForm(false)}
          disabled={!!loading}
          className="rounded-xl text-xs text-slate-400"
        >
          Cancelar
        </Button>
      </div>
    </div>
  )
}
