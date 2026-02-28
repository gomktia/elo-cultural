'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { avancarEtapa } from '@/lib/actions/edital-actions'
import type { FaseEdital, EditalFase } from '@/types/database.types'
import { Check, Lock, Clock, ChevronRight, Loader2 } from 'lucide-react'

const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
]

const faseLabels: Record<FaseEdital, string> = {
  criacao: 'Criacao',
  publicacao: 'Publicacao',
  inscricao: 'Inscricao',
  inscricao_encerrada: 'Inscricao Encerrada',
  divulgacao_inscritos: 'Divulgacao de Inscritos',
  recurso_divulgacao_inscritos: 'Recurso da Divulgacao',
  avaliacao_tecnica: 'Avaliacao Tecnica (Selecao)',
  resultado_preliminar_avaliacao: 'Resultado Prel. Avaliacao',
  recurso_avaliacao: 'Recurso da Avaliacao',
  habilitacao: 'Habilitacao Documental',
  resultado_preliminar_habilitacao: 'Resultado Prel. Habilitacao',
  recurso_habilitacao: 'Recurso da Habilitacao',
  resultado_definitivo_habilitacao: 'Resultado Def. Habilitacao',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologacao',
  arquivamento: 'Arquivamento',
}

interface FaseManagerProps {
  editalId: string
  currentStatus: FaseEdital
  fases: EditalFase[]
  onStatusChange?: () => void
}

export function FaseManager({ editalId, currentStatus, fases, onStatusChange }: FaseManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const currentIndex = faseOrder.indexOf(currentStatus)

  async function avancarFase() {
    if (currentIndex >= faseOrder.length - 1) return
    if (!confirm('Tem certeza que deseja avancar para a proxima fase?')) return
    setLoading(true)

    const result = await avancarEtapa(editalId)

    if (result.error) {
      toast.error('Erro ao avancar fase: ' + result.error)
    } else {
      const nextFase = result.newPhase as FaseEdital
      toast.success(`Fase avancada para: ${faseLabels[nextFase] || nextFase}`)
      onStatusChange?.()
      router.refresh()
    }
    setLoading(false)
  }

  function getFaseData(fase: FaseEdital) {
    return fases.find(f => f.fase === fase)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2 border-b border-slate-50">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-6 w-1.5 bg-[var(--brand-primary)] rounded-full" />
            Gestão de Fluxo
          </h2>
          <p className="text-sm text-slate-400 font-medium italic">Acompanhe o progresso deste edital.</p>
        </div>

        {currentIndex < faseOrder.length - 1 && (
          <Button
            onClick={avancarFase}
            disabled={loading}
            className="h-11 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-lg shadow-brand-primary/20 transition-all active:scale-98 group text-xs"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
            Próxima Fase: {faseLabels[faseOrder[currentIndex + 1]]}
          </Button>
        )}
      </div>

      <div className="relative">
        <div className="absolute left-[31px] top-4 bottom-4 w-px bg-slate-100 hidden sm:block" />
        <div className="space-y-3">
          {faseOrder.map((fase, idx) => {
            const faseData = getFaseData(fase)
            const isCurrent = fase === currentStatus
            const isPast = idx < currentIndex
            const isFuture = idx > currentIndex

            return (
              <div
                key={fase}
                className={[
                  'group relative flex items-center gap-4 p-3.5 rounded-[24px] transition-all duration-500',
                  isCurrent ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-brand-primary/20 scale-[1.01] z-10' : 'bg-transparent hover:bg-slate-50'
                ].join(' ')}
              >
                <div className="relative flex items-center justify-center flex-shrink-0 order-1 sm:order-none">
                  {isCurrent && (
                    <div className="absolute inset-0 animate-ping rounded-full bg-white/20" />
                  )}
                  <div className={[
                    'h-10 w-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500',
                    isPast ? 'bg-green-50 border-green-100 text-[var(--brand-success)]' :
                      isCurrent ? 'bg-white border-white text-[var(--brand-primary)] shadow-md' :
                        'bg-slate-50 border-slate-100 text-slate-300'
                  ].join(' ')}>
                    {isPast ? <Check className="h-5 w-5 stroke-[3px]" /> :
                      isCurrent ? <Clock className="h-5 w-5 animate-spin-slow" /> :
                        faseData?.bloqueada ? <Lock className="h-4 w-4" /> :
                          <span className="text-[11px] font-semibold">{idx + 1}</span>}
                  </div>
                </div>

                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h4 className={[
                      'text-base font-semibold tracking-tight transition-colors',
                      isCurrent ? 'text-white' : isPast ? 'text-slate-900 opacity-60' : 'text-slate-400'
                    ].join(' ')}>
                      {faseLabels[fase]}
                    </h4>
                    {isCurrent && (
                      <Badge className="bg-white/10 text-white border-none rounded-md font-medium text-[11px] uppercase tracking-wide px-1.5 py-0">
                        Ativa
                      </Badge>
                    )}
                  </div>
                  <p className={[
                    'text-[11px] font-medium uppercase tracking-wide',
                    isCurrent ? 'text-white/60' : 'text-slate-400'
                  ].join(' ')}>
                    {faseData?.data_inicio ? (
                      <>
                        {new Date(faseData.data_inicio).toLocaleDateString('pt-BR')}
                        {faseData.data_fim && ` → ${new Date(faseData.data_fim).toLocaleDateString('pt-BR')}`}
                      </>
                    ) : 'Pendente'}
                  </p>
                </div>

                <div className="sm:flex hidden flex-col items-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
                  <div className="h-8 w-8 rounded-lg bg-slate-50/50 flex items-center justify-center text-slate-300">
                    <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
