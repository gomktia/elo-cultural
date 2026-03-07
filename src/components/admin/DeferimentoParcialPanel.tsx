'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { solicitarRevisao } from '@/lib/actions/revisao-avaliacao-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, RotateCcw, CheckSquare, Square, User } from 'lucide-react'

interface Avaliacao {
  id: string
  avaliador_id: string
  avaliador_nome: string
  pontuacao_total: number | null
  criterios: Array<{
    criterio_id: string
    descricao: string
    nota: number
    nota_maxima: number
    peso: number
  }>
}

interface DeferimentoParcialPanelProps {
  recursoId: string
  editalId: string
  avaliacoes: Avaliacao[]
}

export function DeferimentoParcialPanel({
  recursoId,
  editalId,
  avaliacoes,
}: DeferimentoParcialPanelProps) {
  const router = useRouter()
  const [selectedAvaliador, setSelectedAvaliador] = useState<string | null>(null)
  const [selectedCriterios, setSelectedCriterios] = useState<Set<string>>(new Set())
  const [justificativa, setJustificativa] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleCriterio(criterioId: string) {
    setSelectedCriterios(prev => {
      const next = new Set(prev)
      if (next.has(criterioId)) {
        next.delete(criterioId)
      } else {
        next.add(criterioId)
      }
      return next
    })
  }

  function selectAvaliador(avaliadorId: string) {
    if (selectedAvaliador === avaliadorId) {
      setSelectedAvaliador(null)
      setSelectedCriterios(new Set())
    } else {
      setSelectedAvaliador(avaliadorId)
      setSelectedCriterios(new Set())
    }
  }

  async function handleSolicitar() {
    if (!selectedAvaliador) {
      toast.error('Selecione o avaliador que deve revisar')
      return
    }
    if (selectedCriterios.size === 0) {
      toast.error('Selecione ao menos um critério para revisão')
      return
    }
    if (!justificativa.trim()) {
      toast.error('Preencha a justificativa para a revisão')
      return
    }

    setLoading(true)
    const result = await solicitarRevisao({
      recursoId,
      avaliadorId: selectedAvaliador,
      criteriosRevisar: Array.from(selectedCriterios),
      justificativa,
      editalId,
    })
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Revisão solicitada com sucesso. O parecerista será notificado.')
      router.refresh()
    }
  }

  if (avaliacoes.length === 0) {
    return (
      <Card className="border border-slate-200 rounded-2xl shadow-sm">
        <CardContent className="p-5 text-center">
          <p className="text-sm text-slate-500">Nenhuma avaliação encontrada para este projeto.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-dashed border-purple-300 rounded-2xl shadow-sm bg-purple-50/20">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-purple-500" /> Deferimento Parcial - Solicitar Revisão
        </h3>

        <p className="text-xs text-slate-500">
          Selecione o avaliador e os critérios que devem ser reavaliados. O parecerista receberá a solicitação
          para revisar apenas os critérios selecionados.
        </p>

        {/* Avaliador selection */}
        <div className="space-y-3">
          {avaliacoes.map((av, idx) => {
            const isSelected = selectedAvaliador === av.avaliador_id
            return (
              <div key={av.id} className="space-y-2">
                <button
                  type="button"
                  onClick={() => selectAvaliador(av.avaliador_id)}
                  className={`w-full text-left rounded-xl border p-3 transition-all ${
                    isSelected
                      ? 'border-purple-400 bg-purple-50 ring-1 ring-purple-200'
                      : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center text-xs font-semibold ${
                        isSelected ? 'bg-purple-200 text-purple-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          {av.avaliador_nome || `Parecerista ${idx + 1}`}
                        </span>
                        <Badge variant="outline" className="ml-2 text-[10px]">
                          {av.pontuacao_total != null ? `${av.pontuacao_total.toFixed(1)} pts` : 'Sem nota'}
                        </Badge>
                      </div>
                    </div>
                    <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      isSelected ? 'border-purple-500 bg-purple-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <div className="h-2 w-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </button>

                {/* Criteria selection (show when avaliador is selected) */}
                {isSelected && av.criterios.length > 0 && (
                  <div className="ml-4 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                      Selecione os critérios a revisar:
                    </p>
                    {av.criterios.map(crit => {
                      const checked = selectedCriterios.has(crit.criterio_id)
                      return (
                        <button
                          key={crit.criterio_id}
                          type="button"
                          onClick={() => toggleCriterio(crit.criterio_id)}
                          className={`w-full text-left flex items-center justify-between rounded-lg border px-3 py-2 transition-all ${
                            checked
                              ? 'border-purple-300 bg-purple-50'
                              : 'border-slate-100 bg-white hover:border-purple-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {checked ? (
                              <CheckSquare className="h-4 w-4 text-purple-500 shrink-0" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-300 shrink-0" />
                            )}
                            <span className="text-xs text-slate-700 truncate">{crit.descricao}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-semibold text-slate-900">{crit.nota}</span>
                            <span className="text-xs text-slate-400">/ {crit.nota_maxima}</span>
                            {crit.peso > 1 && (
                              <span className="text-[10px] text-purple-500 font-medium">x{crit.peso}</span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Justificativa */}
        {selectedAvaliador && selectedCriterios.size > 0 && (
          <div className="space-y-2 animate-in fade-in duration-300">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Justificativa para revisão *
            </Label>
            <Textarea
              placeholder="Explique por que os critérios selecionados devem ser reavaliados..."
              value={justificativa}
              onChange={e => setJustificativa(e.target.value)}
              className="rounded-xl border-slate-200 bg-white text-sm min-h-[80px]"
            />
          </div>
        )}

        {/* Summary + Submit */}
        {selectedAvaliador && selectedCriterios.size > 0 && (
          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-500">
              {selectedCriterios.size} critério(s) selecionado(s) para revisão
            </span>
            <Button
              onClick={handleSolicitar}
              disabled={loading}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 h-10 px-5"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
              Solicitar Revisão
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
