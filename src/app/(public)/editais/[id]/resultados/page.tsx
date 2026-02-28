import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar } from 'lucide-react'
import type { Edital } from '@/types/database.types'

export default async function ResultadosPublicosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('*')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const e = edital as Edital

  // Only show results if edital is past avaliacao phase
  const resultPhases = ['resultado_preliminar_avaliacao', 'recurso_avaliacao', 'resultado_final', 'homologacao', 'arquivamento']
  const hasResults = resultPhases.includes(e.status)

  const { data: projetos } = hasResults
    ? await supabase
      .from('projetos')
      .select('id, titulo, numero_protocolo, nota_final, status_atual')
      .eq('edital_id', id)
      .order('nota_final', { ascending: false, nullsFirst: false })
    : { data: [] }

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href={`/editais/${id}`} className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-[var(--brand-primary)] transition-colors mb-6 md:mb-8 group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para o Edital
      </Link>

      <div className="space-y-6 md:space-y-8">
        <div className="space-y-2 pb-6 border-b border-slate-100">
          <p className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-wide bg-slate-50 inline-block px-2 py-1 rounded-lg">PROCESSO SELETIVO {e.numero_edital}</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 leading-none">Resultados Oficiais</h1>
          <p className="text-xs md:text-sm text-slate-400 font-medium italic">Confira a classificação final dos projetos submetidos.</p>
        </div>

        {!hasResults ? (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl md:rounded-2xl p-8 md:p-10 border border-slate-100 shadow-premium text-center">
            <div className="h-14 w-14 md:h-16 md:w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-5 md:mb-6">
              <Calendar className="h-7 w-7 md:h-8 md:w-8 text-slate-200" />
            </div>
            <p className="text-slate-400 font-semibold text-[11px] md:text-xs uppercase tracking-wide italic leading-relaxed max-w-[200px] mx-auto">
              Os resultados ainda não foram homologados para publicação.
            </p>
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl md:rounded-2xl p-0.5 md:p-1 overflow-hidden shadow-lg overflow-x-auto">
            <Table>
              <TableHeader className="bg-[var(--brand-primary)]">
                <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
                  <TableHead className="w-16 md:w-24 py-3 md:py-4 px-4 md:px-8 font-semibold text-[11px] md:text-xs uppercase tracking-wider text-white text-center">Class.</TableHead>
                  <TableHead className="py-3 md:py-4 px-3 md:px-4 font-semibold text-[11px] md:text-xs uppercase tracking-wider text-white">Projeto</TableHead>
                  <TableHead className="py-3 md:py-4 px-3 md:px-4 font-semibold text-[11px] md:text-xs uppercase tracking-wider text-white">Nota</TableHead>
                  <TableHead className="py-3 md:py-4 px-4 md:px-8 font-semibold text-[11px] md:text-xs uppercase tracking-wider text-white text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projetos?.map((projeto, idx) => {
                  const isTop3 = idx < 3
                  const colors = ['text-yellow-500', 'text-slate-400', 'text-amber-600']

                  return (
                    <TableRow key={projeto.id} className="even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100 group">
                      <TableCell className="py-3 md:py-4 px-4 md:px-8">
                        <div className="flex items-center justify-center">
                          {isTop3 ? (
                            <div className={`h-8 w-8 md:h-9 md:w-9 rounded-lg md:rounded-xl bg-white shadow flex items-center justify-center ${colors[idx]}`}>
                              <span className="font-bold text-sm md:text-base">{idx + 1}º</span>
                            </div>
                          ) : (
                            <span className="h-8 w-8 md:h-9 md:w-9 flex items-center justify-center font-semibold text-slate-300 text-sm md:text-base">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 md:py-4 px-3 md:px-4 min-w-[150px]">
                        <div className="space-y-0.5">
                          <div className="text-xs md:text-sm font-bold text-slate-900 leading-tight group-hover:text-[var(--brand-primary)] transition-colors line-clamp-2 md:line-clamp-none">
                            {projeto.titulo}
                          </div>
                          <div className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-wide leading-none">
                            ID: {projeto.numero_protocolo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 md:py-4 px-3 md:px-4">
                        <div className={[
                          'text-lg md:text-xl font-bold tracking-tight transition-transform group-hover:scale-110 origin-left',
                          isTop3 ? 'text-slate-900' : 'text-slate-400'
                        ].join(' ')}>
                          {projeto.nota_final?.toFixed(2) ?? '—'}
                        </div>
                      </TableCell>
                      <TableCell className="py-3 md:py-4 px-4 md:px-8 text-right">
                        <Badge className={[
                          'border-none rounded-lg px-2 text-[11px] md:text-xs font-semibold uppercase tracking-wide py-1 whitespace-nowrap',
                          projeto.status_atual === 'selecionado' ? 'bg-emerald-50 text-emerald-600' :
                            projeto.status_atual === 'suplente' ? 'bg-amber-50 text-amber-600' :
                              'bg-slate-50 text-slate-400'
                        ].join(' ')}>
                          {projeto.status_atual}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
