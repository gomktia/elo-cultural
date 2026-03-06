import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTracker } from '@/components/projeto/StatusTracker'
import { ProjetoTimeline } from '@/components/projeto/ProjetoTimeline'
import { ArrowLeft, Scale, FileText, FileCheck, AlertTriangle, FileSignature } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Users, DollarSign, Clock } from 'lucide-react'
import type { ProjetoWithEdital, ProjetoDocumento, ProjetoEquipe, ProjetoOrcamentoItem, ProjetoCronograma } from '@/types/database.types'

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawProjeto } = await supabase
    .from('projetos')
    .select('*, editais(titulo, numero_edital, status, fim_inscricao, inicio_recurso_inscricao, fim_recurso_inscricao, inicio_recurso_selecao, fim_recurso_selecao, inicio_recurso_habilitacao, fim_recurso_habilitacao, inicio_habilitacao, fim_habilitacao)')
    .eq('id', id)
    .single()

  if (!rawProjeto) notFound()

  const projeto = rawProjeto as ProjetoWithEdital

  const { data: documentos } = await supabase
    .from('projeto_documentos')
    .select('*')
    .eq('projeto_id', id)

  const typedDocs = (documentos || []) as ProjetoDocumento[]

  const { data: equipeData } = await supabase.from('projeto_equipe').select('*').eq('projeto_id', id).order('created_at')
  const equipe = (equipeData || []) as ProjetoEquipe[]

  const { data: orcamentoData } = await supabase.from('projeto_orcamento_itens').select('*').eq('projeto_id', id).order('created_at')
  const orcamentoItens = (orcamentoData || []) as ProjetoOrcamentoItem[]

  const { data: cronogramaData } = await supabase.from('projeto_cronograma').select('*').eq('projeto_id', id).order('created_at')
  const cronogramaItens = (cronogramaData || []) as ProjetoCronograma[]

  // Documentos exigidos na habilitação vs enviados (Fase 12.2)
  const { data: docsExigidos } = await supabase
    .from('edital_docs_habilitacao')
    .select('id, nome, obrigatorio')
    .eq('edital_id', projeto.edital_id)
    .order('ordem')

  const { data: conferencias } = await supabase
    .from('habilitacao_doc_conferencia')
    .select('doc_exigido_id, documento_id, status')
    .eq('projeto_id', id)

  const docsPendentes = (docsExigidos || []).filter(doc => {
    const conf = (conferencias || []).find((c: any) => c.doc_exigido_id === doc.id)
    return !conf || !conf.documento_id || conf.status === 'pendente' || conf.status === 'reprovado'
  })

  // Load termo de execução (if exists)
  const { data: termo } = await supabase
    .from('termos_execucao')
    .select('id, numero_termo, status, valor_total, vigencia_inicio, vigencia_fim, data_envio_para_assinatura')
    .eq('projeto_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const editalStatus = projeto.editais?.status

  const timelineEvents = [
    { label: 'Inscrição enviada', date: format(new Date(projeto.data_envio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), done: true },
    { label: 'Habilitação', done: projeto.status_habilitacao !== 'pendente', current: projeto.status_habilitacao === 'pendente' && editalStatus === 'habilitacao' },
    { label: 'Avaliação técnica', done: projeto.nota_final !== null, current: editalStatus === 'avaliacao_tecnica' },
    { label: 'Resultado', done: editalStatus ? ['resultado_final', 'homologacao', 'arquivamento'].includes(editalStatus) : false },
  ]

  const canRecurso = editalStatus
    ? ['resultado_preliminar_habilitacao', 'recurso_habilitacao', 'resultado_preliminar_avaliacao', 'recurso_avaliacao'].includes(editalStatus)
    : false

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-5">
              <Link href="/projetos">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{projeto.titulo}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {projeto.editais?.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{projeto.editais?.titulo}</span>
                </div>
              </div>
            </div>
            <StatusTracker status={projeto.status_atual} />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm font-mono">{projeto.numero_protocolo}</div>
            <p className="text-xs text-muted-foreground">Protocolo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm">{projeto.nota_final?.toFixed(2) ?? '\u2014'}</div>
            <p className="text-xs text-muted-foreground">Nota Final</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm">{projeto.orcamento_total ? `R$ ${Number(projeto.orcamento_total).toFixed(2)}` : '\u2014'}</div>
            <p className="text-xs text-muted-foreground">Orcamento</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjetoTimeline events={timelineEvents} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos</CardTitle>
          </CardHeader>
          <CardContent>
            {typedDocs.length > 0 ? (
              <div className="space-y-2">
                {typedDocs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{doc.nome_arquivo}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{doc.tipo}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {projeto.resumo && (
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent><p className="text-sm whitespace-pre-wrap">{projeto.resumo}</p></CardContent>
        </Card>
      )}

      {projeto.campos_extras && Object.keys(projeto.campos_extras).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Informações Adicionais</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {Object.entries(projeto.campos_extras as Record<string, string>).map(([label, value]) => (
                <div key={label} className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
                  <p className="text-sm text-slate-900">{String(value) || '—'}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {equipe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Equipe ({equipe.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipe.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{m.nome} <span className="text-slate-400 font-normal">— {m.funcao}</span></p>
                    {m.cpf_cnpj && <p className="text-xs text-slate-400">{m.cpf_cnpj}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {orcamentoItens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-4 w-4" /> Orcamento</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wide border-b">
                  <th className="text-left pb-2">Item</th>
                  <th className="text-right pb-2">Qtd</th>
                  <th className="text-right pb-2">Unit.</th>
                  <th className="text-right pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {orcamentoItens.map(item => (
                  <tr key={item.id} className="border-b border-slate-50">
                    <td className="py-1.5">{item.item}</td>
                    <td className="py-1.5 text-right">{item.quantidade}</td>
                    <td className="py-1.5 text-right">R$ {Number(item.valor_unitario).toFixed(2)}</td>
                    <td className="py-1.5 text-right font-medium">R$ {Number(item.valor_total).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-200">
                  <td colSpan={3} className="py-2 text-right font-semibold">Total:</td>
                  <td className="py-2 text-right font-bold text-emerald-600">R$ {orcamentoItens.reduce((s, i) => s + Number(i.valor_total), 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {cronogramaItens.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Cronograma</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cronogramaItens.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.atividade}</p>
                    <p className="text-xs text-slate-400">
                      {item.fase.replace('_', ' ')}
                      {item.data_inicio && ` · ${item.data_inicio}`}
                      {item.data_fim && ` a ${item.data_fim}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos Pendentes (Fase 12.2) */}
      {docsPendentes.length > 0 && (
        <Card className="border border-rose-200 bg-rose-50/30 rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              Documentos Pendentes de Envio ({docsPendentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {docsPendentes.map((doc: any) => {
                const conf = (conferencias || []).find((c: any) => c.doc_exigido_id === doc.id)
                const statusLabel = conf?.status === 'reprovado' ? 'Reprovado - reenviar' : 'Pendente'
                const statusColor = conf?.status === 'reprovado' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-rose-100">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-rose-400" />
                      <span className="text-sm font-medium text-slate-900">{doc.nome}</span>
                      {doc.obrigatorio && (
                        <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded-md uppercase">Obrigatório</span>
                      )}
                    </div>
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusColor}`}>{statusLabel}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prazos Importantes */}
      {(() => {
        const ed = projeto.editais as any
        if (!ed) return null
        const now = new Date()
        const prazos = [
          { label: 'Recurso da Inscrição', fim: ed.fim_recurso_inscricao },
          { label: 'Recurso da Seleção', fim: ed.fim_recurso_selecao },
          { label: 'Habilitação', fim: ed.fim_habilitacao },
          { label: 'Recurso da Habilitação', fim: ed.fim_recurso_habilitacao },
        ]
          .filter(p => p.fim && new Date(p.fim) > now)
          .map(p => ({ ...p, dias: differenceInDays(new Date(p.fim), now) }))

        if (prazos.length === 0) return null
        return (
          <Card className="border border-amber-200 bg-amber-50/30 rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-amber-800">
                <AlertTriangle className="h-4 w-4" />
                Prazos Importantes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {prazos.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-amber-100">
                    <span className="text-sm font-medium text-slate-900">{p.label}</span>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">{format(new Date(p.fim), "dd/MM/yyyy", { locale: ptBR })}</p>
                      <p className={`text-xs font-semibold ${p.dias <= 3 ? 'text-red-600' : p.dias <= 7 ? 'text-amber-600' : 'text-slate-500'}`}>
                        {p.dias === 0 ? 'Hoje!' : p.dias === 1 ? 'Amanhã' : `${p.dias} dias restantes`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Termo de Execução Cultural */}
      {termo && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <FileSignature className="h-5 w-5 text-[var(--brand-primary)]" />
              <h2 className="text-base font-semibold text-slate-900">Termo de Execução Cultural</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Número</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{termo.numero_termo}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5 capitalize">{(termo.status || '').replace(/_/g, ' ')}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Valor</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">
                  {Number(termo.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
              {termo.vigencia_fim && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Vigência até</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">
                    {new Date(termo.vigencia_fim).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
            {termo.status === 'pendente_assinatura_proponente' && (
              <Link href={`/projetos/${id}/assinar-termo`}>
                <Button className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm rounded-xl">
                  <FileSignature className="mr-2 h-4 w-4" />
                  Assinar Termo
                </Button>
              </Link>
            )}
            {(termo.status === 'assinado' || termo.status === 'vigente') && (
              <p className="text-sm text-green-600 font-medium">Termo assinado por ambas as partes.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        {canRecurso && (
          <Link href={`/projetos/${id}/recurso`}>
            <Button variant="outline">
              <Scale className="mr-2 h-4 w-4" />
              Interpor Recurso
            </Button>
          </Link>
        )}
        {projeto.status_habilitacao === 'habilitado' && (
          <Link href={`/projetos/${id}/prestacao-contas`}>
            <Button variant="outline" className="border-[var(--brand-primary)]/30 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5">
              <FileCheck className="mr-2 h-4 w-4" />
              Prestação de Contas
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}
