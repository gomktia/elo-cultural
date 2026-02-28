import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Globe, Building2, Users, FileText, ClipboardList, FolderOpen } from 'lucide-react'

export default async function SuperDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  // Estatísticas globais
  const [
    { count: totalTenants },
    { count: totalUsers },
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalAvaliacoes },
  ] = await Promise.all([
    supabase.from('tenants').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('editais').select('*', { count: 'exact', head: true }),
    supabase.from('projetos').select('*', { count: 'exact', head: true }),
    supabase.from('avaliacoes').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: 'Tenants', value: totalTenants || 0, icon: Building2, color: '#0047AB' },
    { label: 'Usuários', value: totalUsers || 0, icon: Users, color: '#7C3AED' },
    { label: 'Editais', value: totalEditais || 0, icon: FileText, color: '#059669' },
    { label: 'Projetos', value: totalProjetos || 0, icon: FolderOpen, color: '#D97706' },
    { label: 'Avaliações', value: totalAvaliacoes || 0, icon: ClipboardList, color: '#DC2626' },
  ]

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="h-5 w-5 text-[var(--brand-primary)]" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Super Admin</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Visão Global</h1>
        <p className="text-sm text-slate-500 font-normal">Métricas consolidadas de toda a plataforma Elo Cultura.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="group relative">
              <div className="relative p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-0.5 text-center">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}10` }}
                >
                  <Icon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
                <p className="text-3xl font-semibold text-slate-900">{stat.value}</p>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
