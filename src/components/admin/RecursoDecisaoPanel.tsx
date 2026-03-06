'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { decidirRecurso } from '@/lib/actions/recurso-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Check, X, Loader2, Gavel, FileText } from 'lucide-react'

interface RecursoDecisaoPanelProps {
  recursoId: string
  editalId: string
  fundamentacao: string
}

export function RecursoDecisaoPanel({ recursoId, editalId }: RecursoDecisaoPanelProps) {
  const router = useRouter()
  const [campos, setCampos] = useState({
    fundamentacao: '',
    analise_merito: '',
    conclusao: '',
    dispositivo: '',
  })
  const [loading, setLoading] = useState<'deferido' | 'indeferido' | null>(null)

  function updateCampo(field: string, value: string) {
    setCampos(prev => ({ ...prev, [field]: value }))
  }

  // Build structured decision text
  function buildParecer() {
    const parts: string[] = []
    if (campos.fundamentacao.trim()) parts.push(`FUNDAMENTAÇÃO:\n${campos.fundamentacao.trim()}`)
    if (campos.analise_merito.trim()) parts.push(`ANÁLISE DO MÉRITO:\n${campos.analise_merito.trim()}`)
    if (campos.conclusao.trim()) parts.push(`CONCLUSÃO:\n${campos.conclusao.trim()}`)
    if (campos.dispositivo.trim()) parts.push(`DISPOSITIVO:\n${campos.dispositivo.trim()}`)
    return parts.join('\n\n')
  }

  async function handleDecisao(tipo: 'deferido' | 'indeferido') {
    const parecer = buildParecer()
    if (!parecer.trim()) {
      toast.error('Preencha ao menos a fundamentação da decisão')
      return
    }

    setLoading(tipo)
    const result = await decidirRecurso(recursoId, tipo, parecer, editalId)
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
          <Gavel className="h-4 w-4 text-amber-500" /> Registrar Decisão Administrativa
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Fundamentação *
            </Label>
            <Textarea
              placeholder="Base legal e normativa da decisão (leis, decretos, editais)..."
              value={campos.fundamentacao}
              onChange={e => updateCampo('fundamentacao', e.target.value)}
              className="rounded-xl border-slate-200 bg-white text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Análise do Mérito
            </Label>
            <Textarea
              placeholder="Análise técnica dos argumentos apresentados pelo recorrente..."
              value={campos.analise_merito}
              onChange={e => updateCampo('analise_merito', e.target.value)}
              className="rounded-xl border-slate-200 bg-white text-sm min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Conclusão
            </Label>
            <Textarea
              placeholder="Conclusão da análise e encaminhamento..."
              value={campos.conclusao}
              onChange={e => updateCampo('conclusao', e.target.value)}
              className="rounded-xl border-slate-200 bg-white text-sm min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Dispositivo
            </Label>
            <Textarea
              placeholder="Decisão final: DEFIRO/INDEFIRO o recurso interposto por..."
              value={campos.dispositivo}
              onChange={e => updateCampo('dispositivo', e.target.value)}
              className="rounded-xl border-slate-200 bg-white text-sm min-h-[60px]"
            />
          </div>
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
