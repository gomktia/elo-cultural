import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Globe, Building2, Users, FileText, ClipboardList, FolderOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  // Try service client first (bypasses RLS), fallback to regular client
  async function getCount(table: string): Promise<number> {
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const serviceClient = createServiceClient()
      const { count, error } = await serviceClient.from(table).select('*', { count: 'exact', head: true })
      if (!error && count !== null) return count
      console.error(`[SuperDashboard] Service client error on ${table}:`, error?.message)
    }
    // Fallback to authenticated client
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true })
    if (error) console.error(`[SuperDashboard] Fallback error on ${table}:`, error.message)
    return count ?? 0
  }

  const [totalTenants, totalUsers, totalEditais, totalProjetos, totalAvaliacoes] = await Promise.all([
    getCount('tenants'),
    getCount('profiles'),
    getCount('editais'),
    getCount('projetos'),
    getCount('avaliacoes'),
  ])

  const stats = [
    { label: 'Tenants', value: totalTenants, icon: Building2, color: '#0047AB' },
    { label: 'Usuários', value: totalUsers, icon: Users, color: '#7C3AED' },
    { label: 'Editais', value: totalEditais, icon: FileText, color: '#059669' },
    { label: 'Projetos', value: totalProjetos, icon: FolderOpen, color: '#D97706' },
    { label: 'Avaliações', value: totalAvaliacoes, icon: ClipboardList, color: '#DC2626' },
  ]

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Visão Global</h1>
            <p className="text-sm text-slate-500">Métricas consolidadas de toda a plataforma Elo Cultura.</p>
          </div>
        </CardContent>
      </Card>

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
