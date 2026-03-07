'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  enviarRelatorioFinanceiro,
  adicionarPagamentoRelatorio,
  removerPagamentoRelatorio,
} from '@/lib/actions/relatorio-financeiro-actions'
import {
  ArrowLeft,
  FileText,
  Plus,
  Trash2,
  Send,
  Loader2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  DollarSign,
} from 'lucide-react'
import { format, differenceInDays, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Relatorio {
  id: string
  status: string
  motivo: string
  data_notificacao: string
  prazo_dias: number
  data_envio: string | null
  saldo_remanescente: number | null
  saldo_devolvido: number | null
  observacoes: string | null
  parecer_gestor: string | null
  data_analise: string | null
}

interface Pagamento {
  id: string
  data_pagamento: string
  descricao: string
  valor: number
  comprovante_path: string | null
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: <Clock className="h-3 w-3" /> },
  enviado: { label: 'Enviado', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Send className="h-3 w-3" /> },
  em_analise: { label: 'Em Analise', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: <FileText className="h-3 w-3" /> },
  aprovado: { label: 'Aprovado', color: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" /> },
  reprovado: { label: 'Reprovado', color: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="h-3 w-3" /> },
}

export default function RelatorioFinanceiroPage() {
  const params = useParams()
  const router = useRouter()
  const projetoId = params.id as string

  const [loading, setLoading] = useState(true)
  const [relatorio, setRelatorio] = useState<Relatorio | null>(null)
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [projetoTitulo, setProjetoTitulo] = useState('')

  // Form state
  const [saldoRemanescente, setSaldoRemanescente] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Add payment form
  const [novoPagData, setNovoPagData] = useState('')
  const [novoPagDesc, setNovoPagDesc] = useState('')
  const [novoPagValor, setNovoPagValor] = useState('')
  const [addingPag, setAddingPag] = useState(false)

  const loadData = useCallback(async () => {
    const supabase = createClient()

    const { data: projeto } = await supabase
      .from('projetos')
      .select('titulo')
      .eq('id', projetoId)
      .single()
    if (projeto) setProjetoTitulo(projeto.titulo)

    const { data: rel } = await supabase
      .from('relatorios_financeiros')
      .select('*')
      .eq('projeto_id', projetoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (rel) {
      setRelatorio(rel as Relatorio)
      setSaldoRemanescente(rel.saldo_remanescente?.toString() || '')
      setObservacoes(rel.observacoes || '')

      const { data: pags } = await supabase
        .from('relatorio_financeiro_pagamentos')
        .select('*')
        .eq('relatorio_id', rel.id)
        .order('data_pagamento')

      setPagamentos((pags || []) as Pagamento[])
    }

    setLoading(false)
  }, [projetoId])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadData() }, [loadData])

  async function handleAddPagamento() {
    if (!relatorio || !novoPagData || !novoPagDesc.trim() || !novoPagValor) return
    setAddingPag(true)
    const result = await adicionarPagamentoRelatorio({
      relatorioId: relatorio.id,
      dataPagamento: novoPagData,
      descricao: novoPagDesc.trim(),
      valor: parseFloat(novoPagValor),
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pagamento adicionado')
      setNovoPagData('')
      setNovoPagDesc('')
      setNovoPagValor('')
      loadData()
    }
    setAddingPag(false)
  }

  async function handleRemovePagamento(pagId: string) {
    const result = await removerPagamentoRelatorio(pagId, projetoId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pagamento removido')
      setPagamentos(prev => prev.filter(p => p.id !== pagId))
    }
  }

  async function handleEnviar() {
    if (!relatorio) return
    setSubmitting(true)
    const result = await enviarRelatorioFinanceiro(relatorio.id, {
      saldoRemanescente: parseFloat(saldoRemanescente) || 0,
      observacoes: observacoes.trim(),
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Relatorio financeiro enviado com sucesso')
      loadData()
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
      </div>
    )
  }

  if (!relatorio) {
    return (
      <div className="space-y-6">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-6 text-center space-y-4">
            <FileText className="h-12 w-12 text-slate-200 mx-auto" />
            <p className="text-sm text-slate-500">Nenhum relatorio financeiro solicitado para este projeto.</p>
            <Link href={`/projetos/${projetoId}`}>
              <Button variant="outline" className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao Projeto
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isReadOnly = relatorio.status !== 'pendente'
  const prazoFinal = addDays(new Date(relatorio.data_notificacao), relatorio.prazo_dias)
  const diasRestantes = differenceInDays(prazoFinal, new Date())
  const totalPagamentos = pagamentos.reduce((s, p) => s + Number(p.valor), 0)
  const statusInfo = STATUS_MAP[relatorio.status] || STATUS_MAP.pendente

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/projetos/${projetoId}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Relatorio Financeiro</h1>
                <Badge variant="outline" className={`${statusInfo.color} text-[11px] font-medium flex items-center gap-1`}>
                  {statusInfo.icon} {statusInfo.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-500">{projetoTitulo}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border border-slate-200 rounded-2xl">
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Motivo</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">{relatorio.motivo}</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Data da Notificacao</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {format(new Date(relatorio.data_notificacao), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className={`rounded-lg p-3 ${diasRestantes <= 3 && !isReadOnly ? 'bg-red-50' : diasRestantes <= 7 && !isReadOnly ? 'bg-amber-50' : 'bg-slate-50'}`}>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Prazo</p>
              <p className={`text-sm font-semibold mt-0.5 ${diasRestantes <= 3 && !isReadOnly ? 'text-red-600' : diasRestantes <= 7 && !isReadOnly ? 'text-amber-600' : 'text-slate-900'}`}>
                {format(prazoFinal, "dd/MM/yyyy", { locale: ptBR })}
                {!isReadOnly && ` (${diasRestantes} dias restantes)`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parecer do Gestor (if analyzed) */}
      {relatorio.parecer_gestor && (
        <Card className={`border rounded-2xl ${relatorio.status === 'aprovado' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${relatorio.status === 'aprovado' ? 'text-green-800' : 'text-red-800'}`}>
              {relatorio.status === 'aprovado' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              Parecer do Gestor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap text-slate-700">{relatorio.parecer_gestor}</p>
            {relatorio.data_analise && (
              <p className="text-xs text-slate-400 mt-2">Analisado em {format(new Date(relatorio.data_analise), "dd/MM/yyyy", { locale: ptBR })}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pagamentos Table */}
      <Card className="border border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--brand-primary)]" />
            Pagamentos Realizados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pagamentos.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2">Data</th>
                  <th className="text-left pb-2">Descricao</th>
                  <th className="text-right pb-2">Valor</th>
                  {!isReadOnly && <th className="text-right pb-2 w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {pagamentos.map(pag => (
                  <tr key={pag.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-600">{format(new Date(pag.data_pagamento), "dd/MM/yyyy")}</td>
                    <td className="py-2 text-slate-900">{pag.descricao}</td>
                    <td className="py-2 text-right font-medium">R$ {Number(pag.valor).toFixed(2)}</td>
                    {!isReadOnly && (
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemovePagamento(pag.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={2} className="py-2 text-right font-semibold">Total:</td>
                  <td className="py-2 text-right font-bold text-emerald-600">R$ {totalPagamentos.toFixed(2)}</td>
                  {!isReadOnly && <td></td>}
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum pagamento registrado.</p>
          )}

          {/* Add Payment Form */}
          {!isReadOnly && (
            <div className="border border-dashed border-slate-200 rounded-xl p-4 space-y-3">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Adicionar Pagamento</p>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="text-xs text-slate-500">Data</label>
                  <Input
                    type="date"
                    value={novoPagData}
                    onChange={e => setNovoPagData(e.target.value)}
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-500">Descricao</label>
                  <Input
                    value={novoPagDesc}
                    onChange={e => setNovoPagDesc(e.target.value)}
                    placeholder="Descricao do pagamento"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500">Valor (R$)</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoPagValor}
                    onChange={e => setNovoPagValor(e.target.value)}
                    placeholder="0,00"
                    className="h-9 rounded-lg text-sm"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={handleAddPagamento}
                disabled={!novoPagData || !novoPagDesc.trim() || !novoPagValor || addingPag}
                variant="outline"
                className="rounded-xl text-sm font-semibold"
              >
                {addingPag ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Saldo & Observacoes */}
      <Card className="border border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Informacoes Complementares</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Saldo Remanescente (R$)</label>
            {isReadOnly ? (
              <p className="text-sm font-medium text-slate-900 mt-1">R$ {Number(relatorio.saldo_remanescente || 0).toFixed(2)}</p>
            ) : (
              <Input
                type="number"
                step="0.01"
                min="0"
                value={saldoRemanescente}
                onChange={e => setSaldoRemanescente(e.target.value)}
                placeholder="0,00"
                className="mt-1 h-10 rounded-xl text-sm max-w-xs"
              />
            )}
          </div>
          <div>
            <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Observacoes</label>
            {isReadOnly ? (
              <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{relatorio.observacoes || '---'}</p>
            ) : (
              <textarea
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Observacoes adicionais sobre a execucao financeira..."
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/30 focus:border-[var(--brand-primary)] min-h-[100px] resize-none"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      {!isReadOnly && (
        <div className="flex justify-end">
          <Button
            onClick={handleEnviar}
            disabled={submitting || pagamentos.length === 0}
            className="h-12 px-8 rounded-2xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold shadow-xl shadow-blue-200/40 transition-all active:scale-95"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Send className="h-5 w-5 mr-2" />}
            Enviar Relatorio Financeiro
          </Button>
        </div>
      )}

      {/* Warning if close to deadline */}
      {!isReadOnly && diasRestantes <= 5 && diasRestantes >= 0 && (
        <Card className="border border-amber-200 bg-amber-50/30 rounded-2xl">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              {diasRestantes === 0
                ? 'O prazo para envio do relatorio financeiro termina hoje!'
                : `Restam apenas ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''} para o envio do relatorio financeiro.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
