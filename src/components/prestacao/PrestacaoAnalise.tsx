'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PrestacaoStatusBadge } from './PrestacaoStatusBadge'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronUp, Banknote, FileText, CheckCircle2, XCircle, AlertTriangle, Shield } from 'lucide-react'
import type { StatusPrestacao, JulgamentoPrestacao } from '@/types/database.types'

const JULGAMENTO_OPTIONS: Array<{ value: JulgamentoPrestacao; label: string; desc: string; color: string }> = [
  { value: 'aprovada_sem_ressalvas', label: 'Aprovada sem Ressalvas', desc: 'Cumprimento integral do objeto', color: 'bg-green-50 border-green-200 text-green-700' },
  { value: 'aprovada_com_ressalvas', label: 'Aprovada com Ressalvas', desc: 'Realizou a ação mas com inadequações, sem má-fé', color: 'bg-amber-50 border-amber-200 text-amber-700' },
  { value: 'rejeitada_parcial', label: 'Rejeitada Parcial', desc: 'Devolução proporcional ao não executado', color: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: 'rejeitada_total', label: 'Rejeitada Total', desc: 'Devolução total + multa + suspensão 180-540 dias', color: 'bg-red-50 border-red-200 text-red-700' },
]

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
    julgamento?: JulgamentoPrestacao | null
    plano_compensatorio?: string | null
    valor_devolucao?: number | null
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
  const [julgamento, setJulgamento] = useState<JulgamentoPrestacao | ''>(prestacao.julgamento || '')
  const [planoCompensatorio, setPlanoCompensatorio] = useState(prestacao.plano_compensatorio || '')
  const [valorDevolucao, setValorDevolucao] = useState(prestacao.valor_devolucao?.toString() || '')
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

    if (decision === 'aprovada' && !julgamento) {
      toast.error('Selecione o tipo de julgamento')
      return
    }

    setSubmitting(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const updateData: Record<string, unknown> = {
      status: decision,
      parecer_gestor: parecer,
      analisado_por: user?.id,
      data_analise: new Date().toISOString(),
    }

    if (julgamento) updateData.julgamento = julgamento
    if (planoCompensatorio.trim()) updateData.plano_compensatorio = planoCompensatorio
    if (valorDevolucao) updateData.valor_devolucao = parseFloat(valorDevolucao)

    const { error } = await supabase
      .from('prestacoes_contas')
      .update(updateData)
      .eq('id', prestacao.id)

    if (error) {
      toast.error('Erro: ' + error.message)
      setSubmitting(false)
      return
    }

    const labels = { aprovada: 'aprovada', reprovada: 'reprovada', com_pendencias: 'devolvida com pendências' }
    toast.success(`Prestação ${labels[decision]}`)

    // Fire-and-forget: notify proponente
    fetch('/api/email/notify-prestacao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prestacaoId: prestacao.id, status: decision, parecer }),
    }).catch(() => {})

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
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-100/60 transition-colors text-left"
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
            <div className="space-y-4 border-t border-slate-100 pt-5">
              {/* Julgamento */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Julgamento</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {JULGAMENTO_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setJulgamento(opt.value)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        julgamento === opt.value ? opt.color + ' ring-2 ring-offset-1 ring-current' : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-semibold">{opt.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Parecer Técnico */}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2">Parecer Técnico *</p>
                <Textarea
                  rows={4}
                  placeholder="Escreva sua análise técnica sobre a prestação de contas..."
                  value={parecer}
                  onChange={e => setParecer(e.target.value)}
                  disabled={submitting}
                />
              </div>

              {/* Campos condicionais para rejeição */}
              {(julgamento === 'rejeitada_parcial' || julgamento === 'rejeitada_total') && (
                <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-xl bg-red-50/50 border border-red-100">
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Valor de Devolução (R$)</p>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={valorDevolucao}
                      onChange={e => setValorDevolucao(e.target.value)}
                      className="w-full h-9 rounded-lg border border-red-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Plano Compensatório (alternativa)</p>
                    <input
                      type="text"
                      value={planoCompensatorio}
                      onChange={e => setPlanoCompensatorio(e.target.value)}
                      className="w-full h-9 rounded-lg border border-red-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                      placeholder="Descreva ações compensatórias..."
                    />
                  </div>
                </div>
              )}

              {/* Aprovada com ressalvas */}
              {julgamento === 'aprovada_com_ressalvas' && (
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                  <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">Plano de Ações Compensatórias</p>
                  <Textarea
                    rows={2}
                    value={planoCompensatorio}
                    onChange={e => setPlanoCompensatorio(e.target.value)}
                    placeholder="Descreva as ações compensatórias que o proponente deve realizar..."
                    className="border-amber-200 focus:ring-amber-200"
                  />
                </div>
              )}

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
                  disabled={submitting || !julgamento || (!julgamento.startsWith('rejeitada'))}
                  className="rounded-xl text-red-600 border-red-200 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reprovar
                </Button>
                <Button
                  onClick={() => handleDecision('aprovada')}
                  disabled={submitting || !julgamento || julgamento.startsWith('rejeitada')}
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
