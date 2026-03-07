import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import {
  FileText, FolderOpen, Users, BarChart3, Plus, ArrowRight,
  AlertTriangle, Clock, CheckCircle, DollarSign, ClipboardCheck, Scale,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { FaseEdital } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { GESTAO_ROLES } from '@/lib/constants/roles'
import { DashboardCharts } from '@/components/gestor/DashboardCharts'
import { ExportarPNABButton } from '@/components/gestor/ExportarPNABButton'

const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
]

function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default async function GestorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, nome, role')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])) {
    redirect('/dashboard')
  }

  const tenantId = profile.tenant_id

  // All queries in parallel
  const [
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalUsuarios },
    { data: editaisAtivos },
    { count: avaliacoesFinalizadas },
    { count: avaliacoesPendentes },
    { count: habilitacoesPendentes },
    { count: recursosPendentes },
    { count: prestacoesPendentes },
    { data: projetosPorCategoria },
    { data: projetosSelecionados },
    { data: projetosPerEdital },
  ] = await Promise.all([
    supabase.from('editais').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('editais').select('id, titulo, numero_edital, status, valor_total, fim_inscricao, fim_recurso, fim_recurso_inscricao, fim_recurso_selecao, fim_recurso_habilitacao').eq('tenant_id', tenantId).eq('active', true).order('created_at', { ascending: false }),
    supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'finalizada'),
    supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'em_andamento'),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status_habilitacao', 'pendente'),
    supabase.from('recursos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'pendente'),
    supabase.from('prestacoes_contas').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'enviada'),
    supabase.from('projetos').select('categoria_id, edital_categorias(nome)').eq('tenant_id', tenantId),
    supabase.from('projetos').select('orcamento_total').eq('tenant_id', tenantId).in('status_atual', ['selecionado', 'aprovado']),
    supabase.from('projetos').select('edital_id').eq('tenant_id', tenantId),
  ])

  const editaisList = editaisAtivos || []
  const dotacaoTotal = editaisList.reduce((sum: number, e) => sum + (parseFloat(e.valor_total) || 0), 0)
  const orcamentoComprometido = (projetosSelecionados || []).reduce((sum: number, p) => sum + (parseFloat(p.orcamento_total) || 0), 0)
  const orcamentoPct = dotacaoTotal > 0 ? Math.min(100, Math.round((orcamentoComprometido / dotacaoTotal) * 100)) : 0

  const totalAvaliacoes = (avaliacoesFinalizadas || 0) + (avaliacoesPendentes || 0)
  const avaliacaoPct = totalAvaliacoes > 0 ? Math.round(((avaliacoesFinalizadas || 0) / totalAvaliacoes) * 100) : 0

  // Count projects per edital
  const editalProjectCount = new Map<string, number>()
  for (const p of projetosPerEdital || []) {
    editalProjectCount.set(p.edital_id, (editalProjectCount.get(p.edital_id) || 0) + 1)
  }

  // Category distribution
  const categoriaCounts: Record<string, number> = {}
  for (const p of projetosPorCategoria || []) {
    const catName = (p as unknown as { edital_categorias?: { nome: string } | null }).edital_categorias?.nome || 'Sem categoria'
    categoriaCounts[catName] = (categoriaCounts[catName] || 0) + 1
  }
  const categoriaData = Object.entries(categoriaCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)

  // Budget per edital for chart
  const orcamentoData = editaisList
    .filter((e) => e.valor_total)
    .map((e) => ({
      name: e.numero_edital || e.titulo?.slice(0, 15),
      dotacao: parseFloat(e.valor_total) || 0,
      comprometido: 0, // Would need per-edital calc — simplified for now
    }))

  // Deadlines approaching (< 3 days)
  const now = new Date()
  const threeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const prazosProximos: Array<{ edital: string; tipo: string; data: string }> = []
  for (const e of editaisList) {
    const checks = [
      { campo: e.fim_inscricao, tipo: 'Fim inscrições' },
      { campo: e.fim_recurso, tipo: 'Fim recursos' },
      { campo: e.fim_recurso_inscricao, tipo: 'Fim recurso inscrição' },
      { campo: e.fim_recurso_selecao, tipo: 'Fim recurso seleção' },
      { campo: e.fim_recurso_habilitacao, tipo: 'Fim recurso habilitação' },
    ]
    for (const c of checks) {
      if (c.campo) {
        const d = new Date(c.campo)
        if (d > now && d <= threeDays) {
          prazosProximos.push({ edital: e.numero_edital, tipo: c.tipo, data: c.campo })
        }
      }
    }
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = profile.nome?.split(' ')[0] || 'Gestor'

  const pendencias = [
    { label: 'Habilitações pendentes', count: habilitacoesPendentes || 0, icon: ClipboardCheck, href: editaisList[0]?.id ? `/admin/editais/${editaisList[0].id}` : '#', color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Avaliações pendentes', count: avaliacoesPendentes || 0, icon: Clock, href: '/gestor/relatorios', color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Recursos sem resposta', count: recursosPendentes || 0, icon: Scale, href: '/gestor/relatorios', color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Prestações aguardando', count: prestacoesPendentes || 0, icon: FileText, href: '/gestor/prestacao-contas', color: 'text-blue-500', bg: 'bg-blue-50' },
  ]

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">
                {greeting}, <span className="text-[var(--brand-primary)]">{firstName}</span>
              </h1>
              <p className="text-sm text-slate-500">
                {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <Link href="/admin/editais/novo">
              <Button className="h-11 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-xl shadow-[var(--brand-primary)]/20 transition-all active:scale-95 text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Novo Edital
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Editais */}
        <Card className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                <FileText className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalEditais ?? 0}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Editais Ativos</p>
          </CardContent>
        </Card>

        {/* Inscrições */}
        <Card className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                <FolderOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{totalProjetos ?? 0}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Inscrições</p>
          </CardContent>
        </Card>

        {/* Orçamento */}
        <Card className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">R$ {formatCurrency(orcamentoComprometido)}</div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">
              {dotacaoTotal > 0 ? `de R$ ${formatCurrency(dotacaoTotal)}` : 'Comprometido'}
            </p>
            {dotacaoTotal > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700" style={{ width: `${orcamentoPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Avaliações */}
        <Card className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--brand-primary)]/10 group-hover:text-[var(--brand-primary)] transition-colors">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
              {avaliacoesFinalizadas ?? 0} <span className="text-sm font-medium text-slate-400">/ {totalAvaliacoes}</span>
            </div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">Avaliações</p>
            {totalAvaliacoes > 0 && (
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700" style={{ width: `${avaliacaoPct}%` }} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content: 2 columns */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts */}
          <DashboardCharts categoriaData={categoriaData} orcamentoData={orcamentoData} />

          {/* Pipeline dos Editais */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400">Pipeline dos Editais</h2>
              <Link href="/admin/editais" className="text-xs font-medium text-[var(--brand-primary)] hover:underline">Ver Todos</Link>
            </div>

            {editaisList.length > 0 ? (
              <div className="space-y-2.5">
                {editaisList.map((edital) => {
                  const faseIndex = faseOrder.indexOf(edital.status as FaseEdital)
                  const progressPct = faseIndex >= 0 ? Math.round(((faseIndex + 1) / faseOrder.length) * 100) : 0
                  const projCount = editalProjectCount.get(edital.id) || 0

                  return (
                    <Link key={edital.id} href={`/admin/editais/${edital.id}`} className="group block">
                      <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group-hover:shadow-md group-hover:border-[var(--brand-primary)]/20 transition-all duration-300">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
                              {edital.titulo}
                            </h3>
                            <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md flex-shrink-0">
                              {edital.numero_edital}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <EditalStatusBadge status={edital.status} />
                            <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-[var(--brand-primary)] transition-colors" />
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-medium text-slate-400 flex-shrink-0">
                            {projCount} inscrito{projCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Nenhum edital ativo</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* Painel de Pendências */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <div className="bg-red-600 px-5 py-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-white flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pendências
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {pendencias.map((item) => (
                <Link key={item.label} href={item.href} className="group">
                  <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/50 transition-colors">
                    <div className={`h-9 w-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center flex-shrink-0`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 leading-none">{item.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.count > 0 ? (
                        <span className="text-sm font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">{item.count}</span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-300">Nenhuma</span>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[var(--brand-primary)] transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}

              {/* Prazos próximos */}
              {prazosProximos.length > 0 && (
                <div className="px-5 py-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-9 w-9 rounded-xl bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Prazos próximos</p>
                    <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-lg ml-auto">{prazosProximos.length}</span>
                  </div>
                  <div className="space-y-1.5 pl-11">
                    {prazosProximos.map((p, i) => (
                      <div key={i} className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{p.edital}</span> — {p.tipo}
                        <span className="text-red-500 font-medium ml-1">
                          {format(new Date(p.data), "dd/MM HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {prazosProximos.length === 0 && (
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <div className="h-9 w-9 rounded-xl bg-green-50 text-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Prazos próximos</p>
                  <span className="text-[11px] font-medium text-slate-300 ml-auto">Nenhum</span>
                </div>
              )}
            </div>
          </Card>

          {/* Acesso Rápido */}
          <div className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 px-1">Acesso Rápido</h3>
            <div className="grid gap-2">
              {[
                { href: '/gestor/rankings', icon: BarChart3, label: 'Rankings', desc: 'Classificação oficial', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                { href: '/gestor/relatorios', icon: FileText, label: 'Relatórios', desc: 'Dados e estatísticas', color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/5' },
                { href: '/admin/usuarios', icon: Users, label: 'Usuários', desc: 'Permissões e acessos', color: 'text-green-600', bg: 'bg-green-50' },
              ].map(item => (
                <Link key={item.href} href={item.href} className="group">
                  <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all duration-300 group-hover:shadow-md">
                    <div className={`h-9 w-9 rounded-xl ${item.bg} ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-slate-900 leading-none mb-0.5">{item.label}</p>
                      <p className="text-[11px] text-slate-400">{item.desc}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-[var(--brand-primary)]" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Exportação PNAB */}
          {editaisList.length > 0 && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100">
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400">Exportação PNAB Federal</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {editaisList.map((ed) => (
                  <div key={ed.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate">{ed.numero_edital}</p>
                      <p className="text-[11px] text-slate-400 truncate">{ed.titulo}</p>
                    </div>
                    <ExportarPNABButton editalId={ed.id} editalNumero={ed.numero_edital} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
