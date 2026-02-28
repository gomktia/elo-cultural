import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTracker } from '@/components/projeto/StatusTracker'
import { ProjetoTimeline } from '@/components/projeto/ProjetoTimeline'
import { ArrowLeft, Scale, FileText, FileCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { ProjetoWithEdital, ProjetoDocumento } from '@/types/database.types'

export default async function ProjetoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: rawProjeto } = await supabase
    .from('projetos')
    .select('*, editais(titulo, numero_edital, status)')
    .eq('id', id)
    .single()

  if (!rawProjeto) notFound()

  const projeto = rawProjeto as ProjetoWithEdital

  const { data: documentos } = await supabase
    .from('projeto_documentos')
    .select('*')
    .eq('projeto_id', id)

  const typedDocs = (documentos || []) as ProjetoDocumento[]

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
