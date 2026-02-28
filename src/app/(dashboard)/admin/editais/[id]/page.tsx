import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { AvancarEtapaButton } from '@/components/edital/AvancarEtapaButton'
import { ArrowLeft, FileText, Settings, Users, BarChart3, Scale, Calendar, Brain } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Edital } from '@/types/database.types'

export default async function AdminEditalDetailPage({
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

  const { count: projetosCount } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true })
    .eq('edital_id', id)

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Card */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-5">
              <Link href="/admin/editais">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{e.titulo}</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {e.numero_edital}
                  </code>
                  <EditalStatusBadge status={e.status} />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Número Edital', value: e.numero_edital, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Projetos Inscritos', value: projetosCount ?? 0, icon: Users, color: 'text-[var(--brand-success)]', bg: 'bg-green-50' },
          { label: 'Início Inscrição', value: e.inicio_inscricao ? format(new Date(e.inicio_inscricao), 'dd/MM/yyyy', { locale: ptBR }) : '—', icon: Settings, color: 'text-brand-primary', bg: 'bg-brand-primary/5' },
          { label: 'Fim Inscrição', value: e.fim_inscricao ? format(new Date(e.fim_inscricao), 'dd/MM/yyyy', { locale: ptBR }) : '—', icon: Calendar, color: 'text-brand-secondary', bg: 'bg-brand-secondary/5' },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-white rounded-2xl">
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">{stat.label}</p>
                  <div className="text-xl font-semibold text-slate-900 tracking-tight transition-transform duration-300 origin-left">
                    {stat.value}
                  </div>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-all duration-300`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[var(--brand-primary)] group-hover:w-full transition-all duration-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description & Navigation Section */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {e.descricao && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-20" />
              <CardHeader className="pt-6 px-6 pb-2">
                <CardTitle className="text-xs font-medium tracking-wide uppercase text-slate-400">Descrição do Edital</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <p className="text-slate-600 font-normal leading-relaxed text-sm whitespace-pre-wrap">
                  {e.descricao}
                </p>
              </CardContent>
            </Card>
          )}

          {/* New Management Navigation Grid */}
          <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Ferramentas de Gestão</h2>
              <p className="text-xs text-slate-500 font-normal">Acesse os módulos específicos para análise e controle.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { title: 'Habilitação Documental', url: 'habilitacao', icon: Scale, desc: 'Análise de documentos e triagem.', color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
                { title: 'Critérios de Avaliação', url: 'criterios', icon: FileText, desc: 'Gestão de quesitos e pontuações.', color: 'text-indigo-600', bg: 'bg-indigo-100/50' },
                { title: 'Cronograma', url: 'cronograma', icon: Settings, desc: 'Ajuste de datas e prazos.', color: 'text-slate-600', bg: 'bg-slate-200/50' },
                { title: 'Atribuições', url: 'atribuicoes', icon: Users, desc: 'Vincular avaliadores aos projetos.', color: 'text-violet-600', bg: 'bg-violet-100/50' },
                { title: 'Ranking Final', url: 'ranking', icon: BarChart3, desc: 'Visualizar classificação dos projetos.', color: 'text-[var(--brand-success)]', bg: 'bg-green-100/50' },
                { title: 'Recursos', url: 'recursos', icon: Scale, desc: 'Gestão de contestações enviadas.', color: 'text-brand-secondary', bg: 'bg-brand-secondary/10' },
                { title: 'Publicações', url: 'publicacoes', icon: FileText, desc: 'Atas e documentos oficiais.', color: 'text-slate-900', bg: 'bg-slate-900/5' },
                { title: 'Triagem por IA', url: 'triagem-ia', icon: Brain, desc: 'Análise automatizada dos projetos.', color: 'text-purple-600', bg: 'bg-purple-100/50' },
              ].map((nav, i) => (
                <Link key={i} href={`/admin/editais/${id}/${nav.url}`} className="group p-0.5">
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-active:scale-98">
                    <div className={`h-10 w-10 rounded-xl ${nav.bg} ${nav.color} flex items-center justify-center transition-transform duration-300`}>
                      <nav.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-none mb-1 group-hover:text-[var(--brand-primary)] transition-colors">{nav.title}</h3>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">{nav.desc}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-[var(--brand-primary)] rounded-2xl p-6 text-white overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <FileText className="h-24 w-24 rotate-12" />
            </div>
            <div className="relative z-10 space-y-5">
              <h3 className="text-sm font-semibold tracking-wide leading-none uppercase">Ações Rápidas</h3>
              <div className="space-y-3">
                <AvancarEtapaButton editalId={id} currentStatus={e.status} />
                <Link href={`/admin/editais/${id}/publicacoes`} className="block w-full">
                  <Button className="w-full h-10 rounded-xl bg-white text-[var(--brand-primary)] font-semibold hover:bg-slate-50 transition-all text-xs uppercase tracking-wide shadow-sm">
                    Publicar Resultado
                  </Button>
                </Link>
                <Link href={`/admin/editais/${id}/cronograma`} className="block w-full">
                  <Button variant="outline" className="w-full h-10 rounded-xl border-white/40 bg-white/15 hover:bg-white/25 text-white font-semibold transition-all text-xs uppercase tracking-wide">
                    Editar Edital
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-2xl p-6 space-y-6">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-2">Linha do Tempo</h3>
            <div className="space-y-5">
              {(() => {
                const faseOrder = [
                  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
                  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
                  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
                  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
                  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
                ]
                const currentIdx = faseOrder.indexOf(e.status)
                const milestones = [
                  { label: 'Criação', fase: 'criacao' },
                  { label: 'Publicação', fase: 'publicacao' },
                  { label: 'Inscrição', fase: 'inscricao' },
                  { label: 'Avaliação', fase: 'avaliacao_tecnica' },
                  { label: 'Habilitação', fase: 'habilitacao' },
                  { label: 'Resultado Final', fase: 'resultado_final' },
                  { label: 'Homologação', fase: 'homologacao' },
                ]
                return milestones.map((step, i) => {
                  const stepIdx = faseOrder.indexOf(step.fase)
                  const isDone = currentIdx > stepIdx
                  const isCurrent = currentIdx === stepIdx
                  return (
                    <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                      {i !== milestones.length - 1 && <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200/50" />}
                      <div className={`h-4 w-4 rounded-full flex-shrink-0 border-[3px] border-white shadow-sm ${
                        isCurrent ? 'bg-[var(--brand-primary)]' : isDone ? 'bg-[var(--brand-success)]' : 'bg-slate-200'
                      }`} />
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold leading-none ${isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                        <p className="text-xs text-slate-400 font-normal tracking-wide lowercase">
                          {isCurrent ? 'Em andamento' : isDone ? 'Concluída' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
