'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { avancarEtapa, reverterEtapa, cancelarEdital } from '@/lib/actions/edital-actions'
import type { FaseEdital, EditalFase } from '@/types/database.types'
import { Check, Lock, Clock, ChevronRight, ChevronLeft, Loader2, Ban } from 'lucide-react'

const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
]

const faseLabels: Record<FaseEdital, string> = {
  criacao: 'Criação',
  publicacao: 'Publicação',
  inscricao: 'Inscrição',
  inscricao_encerrada: 'Inscrição Encerrada',
  divulgacao_inscritos: 'Divulgação de Inscritos',
  recurso_divulgacao_inscritos: 'Recurso da Divulgação',
  avaliacao_tecnica: 'Avaliação Técnica (Seleção)',
  resultado_preliminar_avaliacao: 'Resultado Prel. Avaliação',
  recurso_avaliacao: 'Recurso da Avaliação',
  habilitacao: 'Habilitação Documental',
  resultado_preliminar_habilitacao: 'Resultado Prel. Habilitação',
  recurso_habilitacao: 'Recurso da Habilitação',
  resultado_definitivo_habilitacao: 'Resultado Def. Habilitação',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologação',
  arquivamento: 'Arquivamento',
}

interface FaseManagerProps {
  editalId: string
  currentStatus: FaseEdital
  fases: EditalFase[]
  cancelado?: boolean
  justificativaCancelamento?: string | null
  onStatusChange?: () => void
}

export function FaseManager({ editalId, currentStatus, fases, cancelado, justificativaCancelamento, onStatusChange }: FaseManagerProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelJustificativa, setCancelJustificativa] = useState('')
  const [cancelando, setCancelando] = useState(false)
  const currentIndex = faseOrder.indexOf(currentStatus)

  async function avancarFase() {
    if (currentIndex >= faseOrder.length - 1) return
    if (!confirm('Tem certeza que deseja avançar para a próxima fase?')) return
    setLoading(true)

    const result = await avancarEtapa(editalId)

    if (result.error) {
      toast.error('Erro ao avançar fase: ' + result.error)
    } else {
      const nextFase = result.newPhase as FaseEdital
      toast.success(`Fase avançada para: ${faseLabels[nextFase] || nextFase}`)
      onStatusChange?.()
      router.refresh()
    }
    setLoading(false)
  }

  async function voltarFase() {
    if (currentIndex <= 0) return
    if (!confirm(`Tem certeza que deseja voltar para "${faseLabels[faseOrder[currentIndex - 1]]}"?`)) return
    setLoading(true)

    const result = await reverterEtapa(editalId)

    if (result.error) {
      toast.error('Erro ao reverter fase: ' + result.error)
    } else {
      const prevFase = result.newPhase as FaseEdital
      toast.success(`Fase revertida para: ${faseLabels[prevFase] || prevFase}`)
      onStatusChange?.()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleCancelar() {
    if (!cancelJustificativa.trim()) {
      toast.error('A justificativa é obrigatória para cancelar o edital.')
      return
    }
    setCancelando(true)

    const result = await cancelarEdital(editalId, cancelJustificativa)

    if (result.error) {
      toast.error('Erro ao cancelar: ' + result.error)
    } else {
      toast.success('Edital cancelado.')
      setCancelDialogOpen(false)
      onStatusChange?.()
      router.refresh()
    }
    setCancelando(false)
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

        {!cancelado && (
          <div className="flex items-center gap-2 flex-wrap">
            {currentIndex > 0 && (
              <Button
                onClick={voltarFase}
                disabled={loading}
                variant="outline"
                className="h-11 px-4 rounded-xl border-slate-200 font-semibold text-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronLeft className="mr-1 h-4 w-4" />}
                Voltar Fase
              </Button>
            )}
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
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-11 px-4 rounded-xl border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600 font-semibold text-xs">
                  <Ban className="mr-1 h-4 w-4" />
                  Cancelar Edital
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-2xl p-6 max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-slate-900">Cancelar Edital</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-slate-500">Esta ação é irreversível. Informe a justificativa para o cancelamento:</p>
                  <Textarea
                    value={cancelJustificativa}
                    onChange={e => setCancelJustificativa(e.target.value)}
                    placeholder="Justificativa obrigatória..."
                    rows={4}
                    className="rounded-xl"
                  />
                  <Button
                    onClick={handleCancelar}
                    disabled={cancelando || !cancelJustificativa.trim()}
                    className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold"
                  >
                    {cancelando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Cancelamento'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {cancelado && (
        <div className="rounded-2xl bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <Ban className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Edital Cancelado</p>
            {justificativaCancelamento && (
              <p className="text-xs text-red-600 mt-1">{justificativaCancelamento}</p>
            )}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="absolute left-[31px] top-4 bottom-4 w-px bg-slate-100 hidden sm:block" />
        <div className="divide-y divide-slate-100">
          {faseOrder.map((fase, idx) => {
            const faseData = getFaseData(fase)
            const isCurrent = fase === currentStatus
            const isPast = idx < currentIndex
            const isFuture = idx > currentIndex

            const statusBarColor = isCurrent ? 'bg-white' : isPast ? 'bg-[var(--brand-success)]' : 'bg-slate-200'

            return (
              <div
                key={fase}
                className={[
                  'group relative flex items-center gap-4 py-3.5 pr-3.5 pl-6 transition-all duration-500',
                  isCurrent ? 'bg-[var(--brand-primary)] text-white shadow-xl shadow-brand-primary/20 z-10' : idx % 2 === 1 ? 'bg-slate-50/40 hover:bg-slate-100/60' : 'bg-white hover:bg-slate-100/60'
                ].join(' ')}
              >
                <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${statusBarColor}`} />
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

                <div className={[
                  'sm:flex hidden flex-col items-end gap-1 transition-opacity',
                  isCurrent ? 'opacity-60 group-hover:opacity-100' : 'opacity-20 group-hover:opacity-100'
                ].join(' ')}>
                  <div className={[
                    'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                    isCurrent ? 'bg-white/20 text-white group-hover:bg-white/30' : 'bg-slate-50/50 text-slate-300 group-hover:bg-slate-100'
                  ].join(' ')}>
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
