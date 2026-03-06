'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { analisarRelatorioFinanceiro } from '@/lib/actions/relatorio-financeiro-actions'
import { Loader2, CheckCircle2, XCircle, Shield } from 'lucide-react'

interface Props {
  relatorioId: string
}

export function RelatorioFinanceiroAnalise({ relatorioId }: Props) {
  const router = useRouter()
  const [parecer, setParecer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleAnalise(aprovado: boolean) {
    if (!parecer.trim()) {
      toast.error('Preencha o parecer antes de decidir')
      return
    }
    setSubmitting(true)
    const result = await analisarRelatorioFinanceiro(relatorioId, parecer.trim(), aprovado)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(aprovado ? 'Relatorio aprovado' : 'Relatorio reprovado')
      router.refresh()
    }
    setSubmitting(false)
  }

  return (
    <Card className="border border-slate-200 rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--brand-primary)]" />
          Analise do Relatorio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Parecer do Gestor</label>
          <textarea
            value={parecer}
            onChange={e => setParecer(e.target.value)}
            placeholder="Descreva sua analise sobre o relatorio financeiro apresentado..."
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] min-h-[120px] resize-none"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            onClick={() => handleAnalise(false)}
            disabled={submitting || !parecer.trim()}
            variant="outline"
            className="rounded-xl border-red-200 text-red-700 hover:bg-red-50 font-semibold text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
            Reprovar
          </Button>
          <Button
            type="button"
            onClick={() => handleAnalise(true)}
            disabled={submitting || !parecer.trim()}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
            Aprovar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
