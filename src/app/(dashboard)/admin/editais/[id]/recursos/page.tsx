import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RecursoActions } from '@/components/admin/RecursoActions'
import { ArrowLeft, Scale } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'secondary',
  em_analise: 'outline',
  deferido: 'default',
  indeferido: 'destructive',
}

export default async function RecursosAdminPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, tenant_id')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  // Get projetos for this edital, then get recursos
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id')
    .eq('edital_id', id)

  const projetoIds = (projetos || []).map((p: any) => p.id)

  const { data: recursos } = projetoIds.length > 0
    ? await supabase
      .from('recursos')
      .select('*, profiles!recursos_proponente_id_fkey(nome), projetos(titulo, numero_protocolo)')
      .in('projeto_id', projetoIds)
      .order('created_at', { ascending: false })
    : { data: [] }

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Recursos Impetrados</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {edital.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{edital.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                <div className="h-8 w-2 bg-amber-500 rounded-full" />
                Histórico de Solicitações
              </h3>
              <p className="text-slate-500 font-normal text-sm">Visualize e gerencie os pedidos de revisão dos proponentes.</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Table>
              <TableHeader className="bg-[var(--brand-primary)]">
                <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
                  <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">Protocolo</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Projeto / Proponente</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Tipo / Fase</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Status</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Data</TableHead>
                  <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recursos || []).map((rec: any) => {
                  const statusBarColor = rec.status === 'deferido' ? 'bg-[var(--brand-success)]' :
                    rec.status === 'indeferido' ? 'bg-[var(--brand-secondary)]' :
                      rec.status === 'em_analise' ? 'bg-blue-500' : 'bg-amber-400'
                  return (
                  <TableRow key={rec.id} className="relative even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100 group">
                    <TableCell className="py-6 px-8 relative">
                      <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${statusBarColor}`} />
                      <code className="text-xs font-medium text-slate-900 bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wide">
                        {rec.numero_protocolo}
                      </code>
                    </TableCell>
                    <TableCell className="py-6 px-4 font-medium">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                          {rec.projetos?.titulo}
                        </div>
                        <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                          {rec.profiles?.nome}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-600">{rec.tipo === 'habilitacao' ? 'Habilitação' : rec.tipo === 'avaliacao' ? 'Avaliação' : rec.tipo}</span>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Recurso</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-6 px-4">
                      <Badge className={[
                        'border-none rounded-lg px-2 text-xs font-medium uppercase tracking-wide py-1',
                        rec.status === 'deferido' ? 'bg-green-50 text-[var(--brand-success)]' :
                          rec.status === 'indeferido' ? 'bg-destructive/10 text-destructive' :
                            rec.status === 'em_analise' ? 'bg-blue-50 text-blue-600' :
                              'bg-slate-50 text-slate-400'
                      ].join(' ')}>
                        {rec.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-6 px-4 font-medium text-xs text-slate-400 uppercase tracking-wide">
                      {format(new Date(rec.created_at), 'dd MMM yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="py-6 px-4 text-right">
                      <RecursoActions
                        recursoId={rec.id}
                        editalId={id}
                        status={rec.status}
                        fundamentacao={rec.fundamentacao}
                      />
                    </TableCell>
                  </TableRow>
                  )
                })}
                {(!recursos || recursos.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                          <Scale className="h-8 w-8" />
                        </div>
                        <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">Nenhum recurso protocolado</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  )
}
