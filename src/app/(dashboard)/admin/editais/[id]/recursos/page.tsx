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
      <div className="flex items-center gap-6 border-b border-slate-200 pb-8">
        <Link href={`/admin/editais/${id}`}>
          <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-slate-50 transition-all active:scale-90 shadow-sm">
            <ArrowLeft className="h-5 w-5 text-slate-500" />
          </Button>
        </Link>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Scale className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">{edital.numero_edital}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">Recursos Impetrados</h1>
          <p className="text-lg text-slate-400 font-medium">{edital.titulo}</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 p-10 shadow-premium">
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

          <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm ring-1 ring-slate-100">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-200">
                  <TableHead className="py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400">Protocolo</TableHead>
                  <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Projeto / Proponente</TableHead>
                  <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Tipo / Fase</TableHead>
                  <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Status</TableHead>
                  <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Data</TableHead>
                  <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(recursos || []).map((rec: any) => (
                  <TableRow key={rec.id} className="hover:bg-slate-50/50 transition-all duration-300 border-slate-50 group">
                    <TableCell className="py-6 px-8">
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
                ))}
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
