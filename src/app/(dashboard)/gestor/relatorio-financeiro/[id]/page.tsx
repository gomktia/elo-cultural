import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, DollarSign, FileText, Clock, CheckCircle2, XCircle, Send } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RelatorioFinanceiroAnalise } from './RelatorioFinanceiroAnalise'

export default async function GestorRelatorioFinanceiroPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: relatorio } = await supabase
    .from('relatorios_financeiros')
    .select('*')
    .eq('id', id)
    .single()

  if (!relatorio) notFound()

  const { data: projeto } = await supabase
    .from('projetos')
    .select('titulo, numero_protocolo, orcamento_total')
    .eq('id', relatorio.projeto_id)
    .single()

  const { data: pagamentos } = await supabase
    .from('relatorio_financeiro_pagamentos')
    .select('*')
    .eq('relatorio_id', id)
    .order('data_pagamento')

  const { data: proponente } = await supabase
    .from('profiles')
    .select('nome, email')
    .eq('id', relatorio.proponente_id)
    .single()

  const pags = (pagamentos || []) as Array<{
    id: string
    data_pagamento: string
    descricao: string
    valor: number
    comprovante_path: string | null
  }>
  const totalPagamentos = pags.reduce((s, p) => s + Number(p.valor), 0)

  const STATUS_MAP: Record<string, { label: string; color: string }> = {
    pendente: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    enviado: { label: 'Enviado', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    em_analise: { label: 'Em Analise', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    aprovado: { label: 'Aprovado', color: 'bg-green-50 text-green-700 border-green-200' },
    reprovado: { label: 'Reprovado', color: 'bg-red-50 text-red-700 border-red-200' },
  }

  const statusInfo = STATUS_MAP[relatorio.status] || STATUS_MAP.pendente
  const canAnalyze = relatorio.status === 'enviado' || relatorio.status === 'em_analise'

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/gestor/prestacao-contas">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Relatorio Financeiro</h1>
                <Badge variant="outline" className={`${statusInfo.color} text-[11px] font-medium`}>
                  {statusInfo.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {projeto?.numero_protocolo}
                </code>
                <span className="text-sm text-slate-500">{projeto?.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Proponente</p>
            <p className="text-sm font-semibold text-slate-900 mt-0.5">{(proponente as any)?.nome || '---'}</p>
            <p className="text-xs text-slate-400">{(proponente as any)?.email}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Motivo</p>
            <p className="text-sm font-medium text-slate-900 mt-0.5">{relatorio.motivo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Notificacao</p>
            <p className="text-sm font-medium text-slate-900 mt-0.5">
              {relatorio.data_notificacao ? format(new Date(relatorio.data_notificacao), "dd/MM/yyyy", { locale: ptBR }) : '---'}
            </p>
            <p className="text-xs text-slate-400">Prazo: {relatorio.prazo_dias} dias</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Data Envio</p>
            <p className="text-sm font-medium text-slate-900 mt-0.5">
              {relatorio.data_envio ? format(new Date(relatorio.data_envio), "dd/MM/yyyy", { locale: ptBR }) : '---'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financeiro Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-emerald-100">
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Total Pagamentos</p>
              <p className="text-lg font-bold text-emerald-600">R$ {totalPagamentos.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Saldo Remanescente</p>
              <p className="text-lg font-bold text-slate-900">R$ {Number(relatorio.saldo_remanescente || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Orcamento do Projeto</p>
              <p className="text-lg font-bold text-blue-600">R$ {Number(projeto?.orcamento_total || 0).toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pagamentos Table */}
      <Card className="border border-slate-200 rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[var(--brand-primary)]" />
            Pagamentos Registrados ({pags.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pags.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2">Data</th>
                  <th className="text-left pb-2">Descricao</th>
                  <th className="text-right pb-2">Valor</th>
                </tr>
              </thead>
              <tbody>
                {pags.map(pag => (
                  <tr key={pag.id} className="border-b border-slate-50">
                    <td className="py-2 text-slate-600">{format(new Date(pag.data_pagamento), "dd/MM/yyyy")}</td>
                    <td className="py-2 text-slate-900">{pag.descricao}</td>
                    <td className="py-2 text-right font-medium">R$ {Number(pag.valor).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={2} className="py-2 text-right font-semibold">Total:</td>
                  <td className="py-2 text-right font-bold text-emerald-600">R$ {totalPagamentos.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-400 text-center py-4">Nenhum pagamento registrado pelo proponente.</p>
          )}
        </CardContent>
      </Card>

      {/* Observacoes do Proponente */}
      {relatorio.observacoes && (
        <Card className="border border-slate-200 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-[var(--brand-primary)]" />
              Observacoes do Proponente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{relatorio.observacoes}</p>
          </CardContent>
        </Card>
      )}

      {/* Existing Parecer (if already analyzed) */}
      {relatorio.parecer_gestor && !canAnalyze && (
        <Card className={`border rounded-2xl ${relatorio.status === 'aprovado' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <CardHeader className="pb-2">
            <CardTitle className={`text-sm font-semibold flex items-center gap-2 ${relatorio.status === 'aprovado' ? 'text-green-800' : 'text-red-800'}`}>
              {relatorio.status === 'aprovado' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              Parecer Registrado
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

      {/* Analysis Form */}
      {canAnalyze && (
        <RelatorioFinanceiroAnalise relatorioId={relatorio.id} />
      )}
    </div>
  )
}
