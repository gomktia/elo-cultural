'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { decidirRecurso } from '@/lib/actions/recurso-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Gavel } from 'lucide-react'

interface RecursoDecisaoPanelProps {
  recursoId: string
  editalId: string
  fundamentacao: string
}

export function RecursoDecisaoPanel({ recursoId, editalId }: RecursoDecisaoPanelProps) {
  const router = useRouter()
  const [decisao, setDecisao] = useState('')
  const [loading, setLoading] = useState<'deferido' | 'indeferido' | null>(null)

  async function handleDecisao(tipo: 'deferido' | 'indeferido') {
    if (!decisao.trim()) {
      toast.error('Informe o parecer da decisao')
      return
    }

    setLoading(tipo)
    const result = await decidirRecurso(recursoId, tipo, decisao, editalId)
    setLoading(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Recurso ${tipo === 'deferido' ? 'deferido' : 'indeferido'} com sucesso`)
      router.refresh()
    }
  }

  return (
    <Card className="border-2 border-dashed border-amber-300 rounded-2xl shadow-sm bg-amber-50/20">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Gavel className="h-4 w-4 text-amber-500" /> Registrar Decisao
        </h3>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Parecer / Fundamentacao da Decisao *
          </Label>
          <Textarea
            placeholder="Descreva a fundamentacao da decisao, a analise do merito e a conclusao..."
            value={decisao}
            onChange={e => setDecisao(e.target.value)}
            className="rounded-xl border-slate-200 bg-white text-sm min-h-[120px]"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={() => handleDecisao('deferido')}
            disabled={!!loading}
            className="rounded-xl bg-[var(--brand-success)] hover:opacity-90 text-white font-semibold text-xs gap-1.5 h-10 px-5"
          >
            {loading === 'deferido' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Deferir Recurso
          </Button>
          <Button
            variant="destructive"
            onClick={() => handleDecisao('indeferido')}
            disabled={!!loading}
            className="rounded-xl font-semibold text-xs gap-1.5 h-10 px-5"
          >
            {loading === 'indeferido' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
            Indeferir Recurso
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
