import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText, ClipboardList, CheckCircle, Clock, BarChart3 } from 'lucide-react'
import type { AvaliacaoWithProjeto } from '@/types/database.types'

export default async function AvaliacaoListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rawAvaliacoes } = await supabase
    .from('avaliacoes')
    .select('*, projetos(titulo, numero_protocolo, editais(titulo, numero_edital))')
    .eq('avaliador_id', user.id)
    .order('created_at', { ascending: false })

  const avaliacoes = (rawAvaliacoes || []) as AvaliacaoWithProjeto[]

  // Stats
  const total = avaliacoes.length
  const concluidas = avaliacoes.filter(a => a.status === 'finalizada').length
  const pendentes = avaliacoes.filter(a => a.status === 'em_andamento').length
  const notasFinalizadas = avaliacoes.filter(a => a.status === 'finalizada' && a.pontuacao_total != null)
  const notaMedia = notasFinalizadas.length > 0
    ? (notasFinalizadas.reduce((sum, a) => sum + Number(a.pontuacao_total), 0) / notasFinalizadas.length).toFixed(1)
    : '—'
  const progressPct = total > 0 ? Math.round((concluidas / total) * 100) : 0

  // Sort: pendentes first
  const sorted = [...avaliacoes].sort((a, b) => {
    if (a.status === 'em_andamento' && b.status !== 'em_andamento') return -1
    if (a.status !== 'em_andamento' && b.status === 'em_andamento') return 1
    return 0
  })

  const stats = [
    { label: 'Total Atribuídas', value: total, icon: ClipboardList, color: 'text-slate-400', bg: 'bg-slate-50' },
    { label: 'Concluídas', value: concluidas, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Pendentes', value: pendentes, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Nota Média', value: notaMedia, icon: BarChart3, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/10' },
  ]

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Avaliações</h1>
            <p className="text-sm text-slate-500">Projetos atribuídos ao seu comitê técnico.</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{stat.value}</div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Bar */}
      {total > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700">Progresso das Avaliações</span>
              <span className="text-sm font-bold text-[var(--brand-primary)]">{concluidas} de {total}</span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* List */}
      {sorted.length > 0 ? (
        <div className="grid gap-3">
          {sorted.map((av) => (
            <Card key={av.id} className="border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {av.projetos?.titulo}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 font-medium leading-none truncate max-w-[200px]">
                      {av.projetos?.editais?.titulo}
                    </p>
                    <span className="h-1 w-1 rounded-full bg-slate-200" />
                    <p className="text-xs text-slate-300 font-mono leading-none">
                      {av.projetos?.numero_protocolo}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {av.pontuacao_total !== null && (
                    <div className="text-right">
                      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-1">Nota</p>
                      <span className="text-xl font-bold text-slate-900 tracking-tight leading-none">
                        {Number(av.pontuacao_total).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <Badge variant="outline" className={[
                    'border border-slate-200 text-[11px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-md',
                    av.status === 'finalizada' ? 'bg-green-50 text-green-600' :
                      av.status === 'em_andamento' ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-400'
                  ].join(' ')}>
                    {av.status === 'em_andamento' ? 'Pendente' : av.status === 'finalizada' ? 'Concluída' : 'Bloqueada'}
                  </Badge>
                  {av.status === 'em_andamento' && (
                    <Link href={`/avaliacao/${av.projeto_id}`}>
                      <Button className="h-9 px-4 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm shadow-xl shadow-[var(--brand-primary)]/20 transition-all active:scale-95">
                        Avaliar
                        <ArrowRight className="ml-2 h-3 w-3" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <FileText className="h-8 w-8 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500">Nenhum projeto atribuído para avaliação no momento.</p>
        </div>
      )}
    </div>
  )
}
