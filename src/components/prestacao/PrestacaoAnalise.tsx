'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PrestacaoStatusBadge } from './PrestacaoStatusBadge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Banknote, FileText, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import type { StatusPrestacao } from '@/types/database.types'

interface PrestacaoAnaliseProps {
  prestacao: {
    id: string
    status: StatusPrestacao
    valor_total_executado: number | null
    resumo_atividades: string | null
    observacoes: string | null
    parecer_gestor: string | null
    data_envio: string | null
    data_analise: string | null
  }
  projeto: {
    titulo: string
    numero_protocolo: string
    orcamento_total: number
    edital_titulo: string
    edital_numero: string
  }
}

export function PrestacaoAnalise({ prestacao, projeto }: PrestacaoAnaliseProps) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const [parecer, setParecer] = useState(prestacao.parecer_gestor || '')
  const [submitting, setSubmitting] = useState(false)

  const canAnalyze = prestacao.status === 'enviada' || prestacao.status === 'em_analise'
  const valorExecutado = prestacao.valor_total_executado || 0
  const diferenca = valorExecutado - projeto.orcamento_total
  const percentual = projeto.orcamento_total > 0
    ? ((valorExecutado / projeto.orcamento_total) * 100).toFixed(1)
    : '0'

  async function handleDecision(decision: 'aprovada' | 'reprovada' | 'com_pendencias') {
    if (!parecer.trim()) {
      toast.error('Escreva o parecer técnico antes de decidir')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('prestacoes_contas')
      .update({
        status: decision,
        parecer_gestor: parecer,
        analisado_por: user?.id,
        data_analise: new Date().toISOString(),
      })
      .eq('id', prestacao.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      setSubmitting(false)
      return
    }

    const labels = { aprovada: 'aprovada', reprovada: 'reprovada', com_pendencias: 'devolvida com pendências' }
    toast.success(`Prestação ${labels[decision]}`)
    setSubmitting(false)
    router.refresh()
  }

  async function marcarEmAnalise() {
    const supabase = createClient()
    await supabase.from('prestacoes_contas').update({ status: 'em_analise' }).eq('id', prestacao.id)
    router.refresh()
  }

  return (
    <div className="group">
      {/* Row header */}
      <button
        onClick={() => {
          setExpanded(!expanded)
          if (!expanded && prestacao.status === 'enviada') marcarEmAnalise()
        }}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 flex-shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{projeto.titulo}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {projeto.numero_protocolo} &middot; {projeto.edital_numero}
              {prestacao.data_envio && (
                <> &middot; Enviada em {new Date(prestacao.data_envio).toLocaleDateString('pt-BR')}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-sm font-semibold text-slate-700">
            {valorExecutado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <PrestacaoStatusBadge status={prestacao.status} />
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-slate-100 pt-5">
          {/* Comparativo financeiro */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Orçamento Previsto</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {projeto.orcamento_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Valor Executado</p>
              <p className="text-lg font-bold text-slate-900 mt-1">
                {valorExecutado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Execução</p>
              <p className={`text-lg font-bold mt-1 ${diferenca > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {percentual}%
              </p>
            </div>
          </div>

          {/* Resumo de atividades */}
          {prestacao.resumo_atividades && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Relatório de Atividades</p>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{prestacao.resumo_atividades}</p>
              </div>
            </div>
          )}

          {/* Observações */}
          {prestacao.observacoes && (
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Observações do Proponente</p>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{prestacao.observacoes}</p>
              </div>
            </div>
          )}

          {/* Formulário de parecer (se pode analisar) */}
          {canAnalyze && (
            <div className="space-y-3 border-t border-slate-100 pt-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Parecer Técnico</p>
              <Textarea
                rows={4}
                placeholder="Escreva sua análise técnica sobre a prestação de contas..."
                value={parecer}
                onChange={e => setParecer(e.target.value)}
                disabled={submitting}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => handleDecision('com_pendencias')}
                  disabled={submitting}
                  className="rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Pendências
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDecision('reprovada')}
                  disabled={submitting}
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
                <Button
                  onClick={() => handleDecision('aprovada')}
                  disabled={submitting}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Aprovar
                </Button>
              </div>
            </div>
          )}

          {/* Parecer já emitido (readonly) */}
          {!canAnalyze && prestacao.parecer_gestor && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Parecer Emitido</p>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{prestacao.parecer_gestor}</p>
                {prestacao.data_analise && (
                  <p className="text-xs text-slate-400 mt-2">
                    Analisado em {new Date(prestacao.data_analise).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
