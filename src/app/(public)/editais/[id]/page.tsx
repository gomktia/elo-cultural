import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { Separator } from '@/components/ui/separator'
import type { Edital, Criterio } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowLeft, Calendar, FileText } from 'lucide-react'
import { EditalCountdown } from '@/components/edital/EditalCountdown'

export default async function EditalPublicoPage({
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
    .eq('active', true)
    .single()

  if (!edital) notFound()

  const e = edital as Edital

  const { data: criterios } = await supabase
    .from('criterios')
    .select('*')
    .eq('edital_id', id)
    .order('ordem', { ascending: true })

  const isOpen = e.status === 'inscricao'

  return (
    <div className="container mx-auto px-4 py-8 md:py-10 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Link href="/editais" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-[var(--brand-primary)] transition-colors mb-6 md:mb-8 group">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Explorar outros Editais
      </Link>

      <div className="space-y-6 md:space-y-8">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-[11px] md:text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wide bg-brand-primary/5 px-2 py-1 rounded-lg">
                  Edital {e.numero_edital}
                </span>
                <EditalStatusBadge status={e.status} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight max-w-2xl">
                {e.titulo}
              </h1>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {(e.inicio_inscricao || e.fim_inscricao) && (
            <div className="bg-white rounded-2xl md:rounded-2xl p-5 md:p-6 border border-slate-100 shadow-premium flex flex-col justify-center gap-4">
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-wide">Abertura</p>
                  <p className="text-sm md:text-base font-semibold text-slate-900">
                    {e.inicio_inscricao ? format(new Date(e.inicio_inscricao), "dd 'de' MMMM", { locale: ptBR }) : 'A definir'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5" />
                </div>
                <div>
                  <p className="text-[11px] md:text-xs font-medium text-slate-400 uppercase tracking-wide">Encerramento</p>
                  <p className="text-sm md:text-base font-semibold text-slate-900">
                    {e.fim_inscricao ? format(new Date(e.fim_inscricao), "dd 'de' MMMM, yyyy", { locale: ptBR }) : 'A definir'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {e.descricao && (
            <div className="bg-[var(--brand-primary)] rounded-2xl md:rounded-2xl p-5 md:p-6 text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
                <FileText className="h-16 w-16 md:h-20 md:w-20" />
              </div>
              <h3 className="text-[11px] md:text-xs font-semibold text-white/50 uppercase tracking-wider mb-2 md:mb-3">Sobre o Processo</h3>
              <p className="text-white font-medium leading-relaxed italic relative z-10 text-xs md:text-sm line-clamp-4">
                "{e.descricao}"
              </p>
            </div>
          )}
        </div>

        {e.fim_inscricao && new Date(e.fim_inscricao).getTime() > Date.now() && (
          <EditalCountdown deadline={e.fim_inscricao} />
        )}

        {criterios && criterios.length > 0 && (
          <div className="bg-white/60 backdrop-blur-md border border-slate-100 rounded-2xl md:rounded-2xl p-5 md:p-8 shadow-premium">
            <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-3 mb-5 md:mb-6">
              <div className="h-5 md:h-6 w-1 md:w-1.5 bg-purple-500 rounded-full" />
              Regras de Avaliação
            </h2>
            <div className="grid gap-3">
              {(criterios as Criterio[]).map((c, i) => (
                <div key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl md:rounded-2xl bg-white border border-slate-50 hover:border-purple-100 hover:shadow-md transition-all group gap-3 sm:gap-4">
                  <div className="flex items-center gap-3 md:gap-4">
                    <span className="h-7 w-7 md:h-8 md:w-8 rounded-lg md:rounded-xl bg-slate-50 flex items-center justify-center font-semibold text-slate-400 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors text-xs md:text-xs text-center leading-none">
                      {i + 1}
                    </span>
                    <span className="font-bold text-slate-700 text-xs md:text-sm">{c.descricao}</span>
                  </div>
                  <div className="flex items-center gap-4 ml-10 sm:ml-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Peso</p>
                      <p className="font-semibold text-slate-900 text-xs md:text-xs">{c.peso}x</p>
                    </div>
                    <div className="h-5 md:h-6 w-[1px] bg-slate-100" />
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Escala</p>
                      <p className="font-semibold text-slate-900 text-xs md:text-xs">{c.nota_minima} - {c.nota_maxima}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 pt-2 md:pt-4">
          {isOpen && (
            <Link href={`/projetos/novo?edital=${id}&tenant=${e.tenant_id}`} className="w-full sm:w-auto">
              <Button className="w-full h-11 px-8 rounded-xl md:rounded-2xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-lg shadow-brand-primary/20 transition-all active:scale-98 text-xs md:text-sm uppercase tracking-wide">
                Inscrever meu Projeto
              </Button>
            </Link>
          )}
          <Link href={`/editais/${id}/resultados`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full h-11 px-8 rounded-xl md:rounded-2xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-98 text-xs md:text-sm flex items-center justify-center gap-2 uppercase tracking-wide">
              <FileText className="h-4 w-4 md:h-5 md:w-5 text-slate-400" />
              Ver Resultados
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
