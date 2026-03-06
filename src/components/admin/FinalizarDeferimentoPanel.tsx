'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { finalizarDeferimentoParcial } from '@/lib/actions/revisao-avaliacao-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Loader2, CheckCircle, Clock, RotateCcw, Trophy } from 'lucide-react'

interface RevisaoPendente {
  id: string
  avaliador_id: string
  avaliador_nome: string
  status: string
  criterios_revisar: string[]
}

interface FinalizarDeferimentoPanelProps {
  recursoId: string
  editalId: string
  revisoesPendentes: RevisaoPendente[]
}

export function FinalizarDeferimentoPanel({
  recursoId,
  editalId,
  revisoesPendentes,
}: FinalizarDeferimentoPanelProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const todasRevisadas = revisoesPendentes.every(r => r.status === 'revisada')
  const revisadasCount = revisoesPendentes.filter(r => r.status === 'revisada').length

  async function handleFinalizar() {
    setLoading(true)
    const result = await finalizarDeferimentoParcial(recursoId, editalId)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Deferimento parcial finalizado. Ranking recalculado.')
      router.refresh()
    }
  }

  return (
    <Card className="border-2 border-dashed border-purple-300 rounded-2xl shadow-sm bg-purple-50/20">
      <CardContent className="p-5 space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-purple-500" /> Deferimento Parcial em Andamento
        </h3>

        <p className="text-xs text-slate-500">
          Revisoes solicitadas aos pareceristas. Quando todas estiverem concluidas, finalize para
          recalcular a nota e o ranking.
        </p>

        {/* Revisoes status */}
        <div className="space-y-2">
          {revisoesPendentes.map((rev) => (
            <div
              key={rev.id}
              className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                rev.status === 'revisada'
                  ? 'border-green-200 bg-green-50/50'
                  : 'border-amber-200 bg-amber-50/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {rev.status === 'revisada' ? (
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                )}
                <span className="text-sm font-medium text-slate-900">
                  {rev.avaliador_nome || 'Parecerista'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  {rev.criterios_revisar.length} criterio(s)
                </span>
                <Badge
                  variant="outline"
                  className={`text-[10px] uppercase tracking-wide ${
                    rev.status === 'revisada'
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-amber-50 text-amber-600 border-amber-200'
                  }`}
                >
                  {rev.status === 'revisada' ? 'Revisada' : rev.status === 'em_revisao' ? 'Em revisao' : 'Pendente'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {revisadasCount} de {revisoesPendentes.length} revisao(oes) concluida(s)
          </span>
          {todasRevisadas && (
            <Badge className="bg-green-100 text-green-700 border-none text-[11px] font-medium">
              Todas revisadas
            </Badge>
          )}
        </div>

        {/* Finalize button */}
        <Button
          onClick={handleFinalizar}
          disabled={loading || !todasRevisadas}
          className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs gap-1.5 h-10 px-5 w-full"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trophy className="h-3.5 w-3.5" />
          )}
          {todasRevisadas
            ? 'Finalizar Deferimento e Recalcular Ranking'
            : 'Aguardando revisoes dos pareceristas'}
        </Button>
      </CardContent>
    </Card>
  )
}
