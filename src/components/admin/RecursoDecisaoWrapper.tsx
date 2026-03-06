'use client'

import { useState } from 'react'
import { RecursoDecisaoPanel } from './RecursoDecisaoPanel'
import { DeferimentoParcialPanel } from './DeferimentoParcialPanel'
import { FinalizarDeferimentoPanel } from './FinalizarDeferimentoPanel'

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

interface RevisaoPendente {
  id: string
  avaliador_id: string
  avaliador_nome: string
  status: string
  criterios_revisar: string[]
}

interface RecursoDecisaoWrapperProps {
  recursoId: string
  editalId: string
  fundamentacao: string
  recursoStatus: string
  avaliacoes: Avaliacao[]
  revisoesPendentes: RevisaoPendente[]
}

export function RecursoDecisaoWrapper({
  recursoId,
  editalId,
  fundamentacao,
  recursoStatus,
  avaliacoes,
  revisoesPendentes,
}: RecursoDecisaoWrapperProps) {
  const [showParcial, setShowParcial] = useState(false)

  // If status is deferido_parcial, show finalization panel
  if (recursoStatus === 'deferido_parcial') {
    return (
      <FinalizarDeferimentoPanel
        recursoId={recursoId}
        editalId={editalId}
        revisoesPendentes={revisoesPendentes}
      />
    )
  }

  // Normal pending/em_analise: show decision panel + optional partial deferment
  return (
    <div className="space-y-4">
      <RecursoDecisaoPanel
        recursoId={recursoId}
        editalId={editalId}
        fundamentacao={fundamentacao}
        onDeferimentoParcial={() => setShowParcial(!showParcial)}
      />

      {showParcial && (
        <DeferimentoParcialPanel
          recursoId={recursoId}
          editalId={editalId}
          avaliacoes={avaliacoes}
        />
      )}
    </div>
  )
}
