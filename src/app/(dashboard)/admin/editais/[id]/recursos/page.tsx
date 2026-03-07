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
import { ArrowLeft, Scale, Clock, CheckCircle, XCircle, AlertTriangle, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendente: 'secondary',
  em_analise: 'outline',
  deferido: 'default',
  indeferido: 'destructive',
  deferido_parcial: 'outline',
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
    .select('id, titulo, numero_edital, tenant_id, inicio_recurso_inscricao, fim_recurso_inscricao, inicio_recurso_selecao, fim_recurso_selecao, inicio_recurso_habilitacao, fim_recurso_habilitacao')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: projetos } = await supabase
    .from('projetos')
    .select('id')
    .eq('edital_id', id)

  const projetoIds = (projetos || []).map((p: { id: string }) => p.id)

  const { data: recursos } = projetoIds.length > 0
    ? await supabase
      .from('recursos')
      .select('*, profiles!recursos_proponente_id_fkey(nome), projetos(titulo, numero_protocolo)')
      .in('projeto_id', projetoIds)
      .order('created_at', { ascending: false })
    : { data: [] }

  const total = (recursos || []).length
  const pendentes = (recursos || []).filter((r: { status: string }) => r.status === 'pendente' || r.status === 'em_analise' || r.status === 'deferido_parcial').length
  const deferidos = (recursos || []).filter((r: { status: string }) => r.status === 'deferido').length
  const indeferidos = (recursos || []).filter((r: { status: string }) => r.status === 'indeferido').length

  // Determine active recurso period
  const now = new Date()
  const prazos = [
    { tipo: 'Inscricao', inicio: edital.inicio_recurso_inscricao, fim: edital.fim_recurso_inscricao },
    { tipo: 'Selecao', inicio: edital.inicio_recurso_selecao, fim: edital.fim_recurso_selecao },
    { tipo: 'Habilitacao', inicio: edital.inicio_recurso_habilitacao, fim: edital.fim_recurso_habilitacao },
  ].filter(p => p.inicio && p.fim)

  const prazoAtivo = prazos.find(p => {
    const inicio = new Date(p.inicio!)
    const fim = new Date(p.fim!)
    return now >= inicio && now <= fim
  })

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center">
              <Scale className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Total</p>
              <p className="text-xl font-bold text-slate-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Pendentes</p>
              <p className="text-xl font-bold text-amber-600">{pendentes}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Deferidos</p>
              <p className="text-xl font-bold text-green-600">{deferidos}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Indeferidos</p>
              <p className="text-xl font-bold text-red-600">{indeferidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prazo ativo */}
      {prazoAtivo && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-200">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Prazo de recurso aberto: {prazoAtivo.tipo}
            </p>
            <p className="text-xs text-amber-600">
              {format(new Date(prazoAtivo.inicio!), 'dd/MM/yyyy', { locale: ptBR })} a{' '}
              {format(new Date(prazoAtivo.fim!), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
        </div>
      )}

      {/* Prazos configurados */}
      {prazos.length > 0 && !prazoAtivo && (
        <div className="flex flex-wrap gap-3">
          {prazos.map(p => {
            const fim = new Date(p.fim!)
            const passed = now > fim
            return (
              <div key={p.tipo} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${passed ? 'bg-slate-50 border-slate-200 text-slate-400' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <Clock className="h-3 w-3" />
                Recurso {p.tipo}: {format(new Date(p.inicio!), 'dd/MM', { locale: ptBR })} - {format(fim, 'dd/MM', { locale: ptBR })}
                {passed && <span className="text-[10px] uppercase tracking-wide">(encerrado)</span>}
              </div>
            )
          })}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-[var(--brand-primary)]">
            <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
              <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">Protocolo</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Projeto / Proponente</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Tipo</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Status</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Data</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(recursos || []).map((rec: { id: string; status: string; tipo: string; created_at: string; numero_protocolo: string; fundamentacao?: string; profiles: { nome: string } | null; projetos: { titulo: string; numero_protocolo: string } | null; [key: string]: unknown }) => {
              const statusBarColor = rec.status === 'deferido' ? 'bg-[var(--brand-success)]' :
                rec.status === 'indeferido' ? 'bg-[var(--brand-secondary)]' :
                  rec.status === 'em_analise' ? 'bg-blue-500' :
                    rec.status === 'deferido_parcial' ? 'bg-purple-500' : 'bg-amber-400'
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
                  <span className="text-xs font-semibold text-slate-600">{rec.tipo === 'habilitacao' ? 'Habilitacao' : rec.tipo === 'avaliacao' ? 'Avaliacao' : rec.tipo}</span>
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Badge className={[
                    'border-none rounded-lg px-2 text-xs font-medium uppercase tracking-wide py-1',
                    rec.status === 'deferido' ? 'bg-green-50 text-[var(--brand-success)]' :
                      rec.status === 'indeferido' ? 'bg-destructive/10 text-destructive' :
                        rec.status === 'em_analise' ? 'bg-blue-50 text-blue-600' :
                          rec.status === 'deferido_parcial' ? 'bg-purple-50 text-purple-600' :
                            'bg-slate-50 text-slate-400'
                  ].join(' ')}>
                    {rec.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-6 px-4 font-medium text-xs text-slate-400 uppercase tracking-wide">
                  {format(new Date(rec.created_at), 'dd MMM yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell className="py-6 px-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <Link href={`/admin/editais/${id}/recursos/${rec.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl border-slate-200 text-xs font-medium gap-1.5 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Detalhar
                      </Button>
                    </Link>
                    <RecursoActions
                      recursoId={rec.id}
                      editalId={id}
                      status={rec.status}
                      fundamentacao={rec.fundamentacao || ''}
                    />
                  </div>
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
  )
}
