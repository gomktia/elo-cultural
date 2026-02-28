'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FaseEdital } from '@/types/database.types'
import { Check, Clock, Circle } from 'lucide-react'

export type { FaseEdital }

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
  inscricao_encerrada: 'Insc. Encerrada',
  divulgacao_inscritos: 'Divulg. Inscritos',
  recurso_divulgacao_inscritos: 'Recurso Divulg.',
  habilitacao: 'Habilitação',
  resultado_preliminar_habilitacao: 'Res. Prel. Hab.',
  recurso_habilitacao: 'Recurso Hab.',
  resultado_definitivo_habilitacao: 'Res. Def. Hab.',
  avaliacao_tecnica: 'Avaliação',
  resultado_preliminar_avaliacao: 'Res. Prel. Aval.',
  recurso_avaliacao: 'Recurso Aval.',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologação',
  arquivamento: 'Arquivamento',
}

interface EditalTimelineProps {
  faseAtual: FaseEdital
  prazos?: {
    inicio_inscricao?: string
    fim_inscricao?: string
    inicio_recurso?: string
    fim_recurso?: string
  }
  corTenant?: string
}

export function EditalTimeline({ faseAtual, prazos, corTenant = '#0047AB' }: EditalTimelineProps) {
  const currentIndex = faseOrder.indexOf(faseAtual)

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Cronograma e Fases do Edital
      </h3>

      <div className="flex items-start gap-0 overflow-x-auto pb-3">
        {faseOrder.map((fase, idx) => {
          const isPast = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isFuture = idx > currentIndex

          return (
            <div key={fase} className="flex items-center flex-shrink-0">
              <div className="flex flex-col items-center gap-2">
                {/* Node with glow */}
                <div className="relative flex items-center justify-center w-10 h-10">
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: corTenant }}
                      animate={{ opacity: [0.25, 0.5, 0.25], scale: [1, 1.7, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  <motion.div
                    layout
                    className={[
                      'relative z-10 flex h-9 w-9 items-center justify-center rounded-full',
                      isPast ? 'bg-[var(--brand-success)] text-white shadow-sm' :
                      isCurrent ? 'text-white shadow-md' :
                      'bg-slate-100 dark:bg-slate-800 text-slate-400',
                    ].join(' ')}
                    style={isCurrent ? { backgroundColor: corTenant } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {isPast ? (
                        <motion.span
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        </motion.span>
                      ) : isCurrent ? (
                        <motion.span
                          key="clock"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <Clock className="h-4 w-4" strokeWidth={2} />
                        </motion.span>
                      ) : (
                        <Circle className="h-3 w-3" strokeWidth={1.5} />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                {/* Label */}
                <span
                  className={[
                    'text-[11px] text-center leading-tight max-w-[72px]',
                    isCurrent ? 'font-semibold' :
                    isPast ? 'text-slate-500 dark:text-slate-400' :
                    'text-slate-400',
                  ].join(' ')}
                  style={isCurrent ? { color: corTenant } : {}}
                >
                  {faseLabels[fase]}
                  {isCurrent && fase === 'inscricao' && prazos?.fim_inscricao && (
                    <span className="block text-slate-400 font-normal mt-0.5">
                      Até {new Date(prazos.fim_inscricao).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </span>
              </div>

              {/* Connector */}
              {idx < faseOrder.length - 1 && (
                <motion.div
                  className="h-0.5 w-5 flex-shrink-0 mx-0.5 rounded-full mt-[-20px]"
                  animate={{ backgroundColor: isPast ? '#43A047' : '#e2e8f0' }}
                  transition={{ duration: 0.4, delay: idx * 0.04 }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
