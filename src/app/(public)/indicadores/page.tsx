import { createClient } from '@/lib/supabase/server'
import { FileText, FolderOpen, CheckCircle2, Banknote, BarChart3, PieChart, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { EditaisPorStatusChart, AreasCulturaisChart } from '@/components/indicadores/IndicadoresCharts'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import type { FaseEdital } from '@/types/database.types'

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = {
  inscricao: 'Inscrições Abertas',
  inscricao_encerrada: 'Inscrições Encerradas',
  avaliacao_tecnica: 'Em Avaliação',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologado',
  arquivamento: 'Arquivado',
  publicacao: 'Publicado',
  criacao: 'Em Criação',
  habilitacao: 'Habilitação',
  resultado_preliminar_habilitacao: 'Resultado Habilitação',
  resultado_preliminar_avaliacao: 'Resultado Avaliação',
  recurso_habilitacao: 'Recursos Habilitação',
  recurso_avaliacao: 'Recursos Avaliação',
  resultado_definitivo_habilitacao: 'Habilitação Definitiva',
  divulgacao_inscritos: 'Divulgação Inscritos',
  recurso_divulgacao_inscritos: 'Recursos Divulgação',
}

const AREAS_CANONICAS: Record<string, string> = {
  'artes visuais': 'Artes Visuais',
  'audiovisual': 'Audiovisual',
  'circo': 'Circo',
  'dança': 'Dança',
  'danca': 'Dança',
  'design': 'Design',
  'fotografia': 'Fotografia',
  'literatura': 'Literatura',
  'música': 'Música',
  'musica': 'Música',
  'patrimônio cultural': 'Patrimônio Cultural',
  'patrimonio cultural': 'Patrimônio Cultural',
  'teatro': 'Teatro',
  'culturas populares': 'Culturas Populares',
  'cultura popular': 'Culturas Populares',
  'culturas indígenas': 'Culturas Indígenas',
  'culturas indigenas': 'Culturas Indígenas',
  'culturas afro-brasileiras': 'Culturas Afro-brasileiras',
  'artesanato': 'Artesanato',
  'moda': 'Moda',
  'gastronomia': 'Gastronomia',
  'gestão cultural': 'Gestão Cultural',
  'gestao cultural': 'Gestão Cultural',
  'políticas culturais': 'Políticas Culturais',
  'politicas culturais': 'Políticas Culturais',
  'economia criativa': 'Economia Criativa',
}

function normalizeArea(area: string): string {
  const trimmed = area.trim()
  const lower = trimmed.toLowerCase()
  // Try exact lowercase match
  if (AREAS_CANONICAS[lower]) return AREAS_CANONICAS[lower]
  // Strip accents (NFD) and try again
  const noAccents = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (AREAS_CANONICAS[noAccents]) return AREAS_CANONICAS[noAccents]
  // Strip all non-ASCII chars (handles broken encoding like m�sica → msica)
  const asciiOnly = lower.replace(/[^\x20-\x7E]/g, '')
  for (const [key, val] of Object.entries(AREAS_CANONICAS)) {
    const keyAscii = key.replace(/[^\x20-\x7E]/g, '')
    if (keyAscii === asciiOnly) return val
  }
  // Fallback: capitalize each word
  return trimmed.replace(/\b\w/g, c => c.toUpperCase())
}

function groupStatus(status: string): string {
  if (['criacao', 'publicacao'].includes(status)) return 'Publicados'
  if (['inscricao', 'inscricao_encerrada'].includes(status)) return 'Inscrições'
  if (['habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao', 'resultado_definitivo_habilitacao', 'divulgacao_inscritos', 'recurso_divulgacao_inscritos'].includes(status)) return 'Habilitação'
  if (['avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao'].includes(status)) return 'Avaliação'
  if (['resultado_final', 'homologacao'].includes(status)) return 'Finalizados'
  if (status === 'arquivamento') return 'Arquivados'
  return 'Outros'
}

export default async function IndicadoresPage() {
  const supabase = await createClient()

  // Queries em paralelo
  const [
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalAprovados },
    { data: editaisData },
    { data: projetosComOrcamento },
    { data: proponentesAreas },
    { data: editaisRecentes },
  ] = await Promise.all([
    supabase.from('editais').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('projetos').select('id', { count: 'exact', head: true }),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('status_habilitacao', 'habilitado'),
    supabase.from('editais').select('status').eq('active', true),
    supabase.from('projetos').select('orcamento_total').eq('status_habilitacao', 'habilitado').not('orcamento_total', 'is', null),
    supabase.from('profiles').select('areas_atuacao').eq('role', 'proponente').eq('active', true).not('areas_atuacao', 'is', null),
    supabase.from('editais').select('id, titulo, numero_edital, status, created_at').eq('active', true).order('created_at', { ascending: false }).limit(10),
  ])

  // Calcular valor total investido
  const valorTotal = (projetosComOrcamento || []).reduce(
    (sum, p) => sum + (Number(p.orcamento_total) || 0),
    0
  )

  // Agrupar editais por status
  const statusCounts: Record<string, number> = {}
  for (const e of (editaisData || [])) {
    const group = groupStatus(e.status)
    statusCounts[group] = (statusCounts[group] || 0) + 1
  }
  const editaisPorStatus = Object.entries(statusCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  // Agrupar areas culturais
  const areaCounts: Record<string, number> = {}
  for (const p of (proponentesAreas || [])) {
    const areas = p.areas_atuacao as string[] | null
    if (areas) {
      for (const area of areas) {
        const normalized = normalizeArea(area)
        if (normalized) {
          areaCounts[normalized] = (areaCounts[normalized] || 0) + 1
        }
      }
    }
  }
  const areasCulturais = Object.entries(areaCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  const stats = [
    {
      label: 'Editais Publicados',
      value: totalEditais ?? 0,
      icon: FileText,
      color: 'text-[#0047AB]',
      bg: 'bg-[#0047AB]/10',
    },
    {
      label: 'Inscrições Recebidas',
      value: totalProjetos ?? 0,
      icon: FolderOpen,
      color: 'text-[#e32a74]',
      bg: 'bg-[#e32a74]/10',
    },
    {
      label: 'Projetos Aprovados',
      value: totalAprovados ?? 0,
      icon: CheckCircle2,
      color: 'text-[#77a80b]',
      bg: 'bg-[#77a80b]/10',
    },
    {
      label: 'Investimento Cultural',
      value: valorTotal,
      icon: Banknote,
      color: 'text-[#eeb513]',
      bg: 'bg-[#eeb513]/10',
      isCurrency: true,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="bg-[#0B1929] py-14 md:py-20">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mb-3">
            Transparência Pública
          </p>
          <h1 className="font-[Sora,sans-serif] text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Painel de Indicadores
          </h1>
          <p className="text-sm md:text-base text-white/60 mt-3 max-w-xl mx-auto leading-relaxed">
            Acompanhe os números dos processos seletivos culturais em tempo real.
            Dados abertos para garantir transparência e accountability.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-8 -mt-8 pb-16 space-y-10">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md hover:border-slate-300"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-tight">
                  {stat.label}
                </p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">
                {stat.isCurrency
                  ? valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                  : stat.value.toLocaleString('pt-BR')
                }
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Editais por Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#0047AB]/10 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#0047AB]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Editais por Fase</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Distribuição dos editais por etapa do processo</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <EditaisPorStatusChart data={editaisPorStatus} />
            </div>
          </div>

          {/* Areas Culturais */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#e32a74]/10 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-[#e32a74]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Áreas Culturais</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Distribuição dos proponentes por área de atuação</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <AreasCulturaisChart data={areasCulturais} />
            </div>
          </div>
        </div>

        {/* Editais Recentes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Editais Recentes</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Últimos editais publicados na plataforma</p>
                </div>
              </div>
              <Link
                href="/editais"
                className="text-xs font-medium text-[#0047AB] hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {(editaisRecentes || []).length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="text-sm text-slate-400">Nenhum edital publicado ainda.</p>
              </div>
            ) : (
              (editaisRecentes || []).map((edital) => (
                <Link key={edital.id} href={`/editais/${edital.id}`} className="group">
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-[#0047AB] transition-colors flex-shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[#0047AB] transition-colors">
                          {edital.titulo}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {edital.numero_edital} &middot; {new Date(edital.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <EditalStatusBadge status={edital.status as FaseEdital} />
                      <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-[#0047AB] transition-colors" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Dados atualizados em tempo real. Informações públicas conforme Lei de Acesso à Informação (LAI).
          </p>
        </div>
      </div>
    </div>
  )
}
