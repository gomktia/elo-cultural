import { createClient } from '@/lib/supabase/server'
import { getCoordenadas } from '@/lib/municipios-coordenadas'
import { MapaCultural } from '@/components/mapa/MapaCultural'
import { MapPin, Users, FileText, Banknote } from 'lucide-react'

export default async function MapaPage() {
  const supabase = await createClient()

  // Buscar projetos com dados do proponente (município/estado)
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, orcamento_total, proponente_id, status_habilitacao, profiles!projetos_proponente_id_fkey(municipio, estado)')
    .eq('status_habilitacao', 'habilitado')

  // Agrupar por município
  const municipioMap = new Map<string, { municipio: string; estado: string; lat: number; lng: number; total_projetos: number; valor_total: number }>()

  for (const projeto of (projetos || [])) {
    const profile = (projeto as any).profiles as { municipio: string | null; estado: string | null } | null
    if (!profile?.municipio || !profile?.estado) continue

    const coords = getCoordenadas(profile.municipio, profile.estado)
    if (!coords) continue

    const key = `${profile.municipio}-${profile.estado}`.toLowerCase()
    const existing = municipioMap.get(key)

    if (existing) {
      existing.total_projetos += 1
      existing.valor_total += Number(projeto.orcamento_total) || 0
    } else {
      municipioMap.set(key, {
        municipio: profile.municipio,
        estado: profile.estado,
        lat: coords.lat,
        lng: coords.lng,
        total_projetos: 1,
        valor_total: Number(projeto.orcamento_total) || 0,
      })
    }
  }

  const pontos = Array.from(municipioMap.values())

  // Totais por estado para sidebar
  const estadoMap = new Map<string, { total_projetos: number; valor_total: number }>()
  for (const p of pontos) {
    const existing = estadoMap.get(p.estado)
    if (existing) {
      existing.total_projetos += p.total_projetos
      existing.valor_total += p.valor_total
    } else {
      estadoMap.set(p.estado, { total_projetos: p.total_projetos, valor_total: p.valor_total })
    }
  }
  const estadosTotais = Array.from(estadoMap.entries())
    .map(([estado, data]) => ({ estado, ...data }))
    .sort((a, b) => b.total_projetos - a.total_projetos)

  const totalProjetos = pontos.reduce((sum, p) => sum + p.total_projetos, 0)
  const totalMunicipios = pontos.length
  const totalValor = pontos.reduce((sum, p) => sum + p.valor_total, 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="bg-[#0B1929] py-14 md:py-20">
        <div className="container mx-auto px-6 md:px-8 text-center">
          <p className="text-[11px] font-medium text-white/40 uppercase tracking-widest mb-3">
            Distribuição Geográfica
          </p>
          <h1 className="font-[Sora,sans-serif] text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
            Mapa Cultural
          </h1>
          <p className="text-sm md:text-base text-white/60 mt-3 max-w-xl mx-auto leading-relaxed">
            Visualize onde os projetos culturais aprovados estão sendo executados em todo o território.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 md:px-8 -mt-8 pb-16 space-y-8">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Projetos no Mapa', value: totalProjetos.toLocaleString('pt-BR'), icon: FileText, color: 'text-[#0047AB]', bg: 'bg-[#0047AB]/10' },
            { label: 'Municípios', value: totalMunicipios.toLocaleString('pt-BR'), icon: MapPin, color: 'text-[#e32a74]', bg: 'bg-[#e32a74]/10' },
            { label: 'Investimento Total', value: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }), icon: Banknote, color: 'text-[#eeb513]', bg: 'bg-[#eeb513]/10' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-tight">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Mapa + Sidebar */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Mapa */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl bg-[#0047AB]/10 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-[#0047AB]" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">Projetos por Município</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Clique nos círculos para ver detalhes</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <MapaCultural pontos={pontos} />
            </div>
          </div>

          {/* Sidebar: Estados */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                Por Estado
              </h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[560px] overflow-y-auto">
              {estadosTotais.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm text-slate-400">Nenhum projeto mapeado ainda.</p>
                </div>
              ) : (
                estadosTotais.map(({ estado, total_projetos, valor_total }) => (
                  <div key={estado} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{estado}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {valor_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="h-7 min-w-[28px] px-2 rounded-lg bg-[#0047AB]/10 text-[#0047AB] text-xs font-bold flex items-center justify-center">
                        {total_projetos}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="text-center pt-4">
          <p className="text-xs text-slate-400">
            Localização baseada no município de residência do proponente. Dados atualizados em tempo real.
          </p>
        </div>
      </div>
    </div>
  )
}
