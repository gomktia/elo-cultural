import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, Users, FileText, Globe, Plus } from 'lucide-react'
import Link from 'next/link'

export default async function SuperTenantsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: tenants } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false })

  // Buscar contagens por tenant
  const { data: profileCounts } = await supabase
    .from('profiles')
    .select('tenant_id')

  const { data: editalCounts } = await supabase
    .from('editais')
    .select('tenant_id')

  const usersByTenant = new Map<string, number>()
  for (const p of profileCounts || []) {
    usersByTenant.set(p.tenant_id, (usersByTenant.get(p.tenant_id) || 0) + 1)
  }

  const editaisByTenant = new Map<string, number>()
  for (const e of editalCounts || []) {
    editaisByTenant.set(e.tenant_id, (editaisByTenant.get(e.tenant_id) || 0) + 1)
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-50 text-[var(--brand-success)]',
    inativo: 'bg-slate-50 text-slate-400',
    suspenso: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Prefeituras e Municipios</h1>
              <p className="text-sm text-slate-500">
                {tenants?.length || 0} tenant{(tenants?.length || 0) !== 1 ? 's' : ''} cadastrado{(tenants?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/super/tenants/novo">
              <button className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-xs uppercase tracking-wide shadow-lg shadow-[#0047AB]/20 transition-all active:scale-95">
                <Plus className="h-4 w-4" />
                Nova Prefeitura
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(tenants || []).map(t => {
          const cores = t.tema_cores as { primary?: string; secondary?: string } | null
          const brandColor = cores?.primary || '#0047AB'

          return (
            <div key={t.id} className="group relative">
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 rounded-2xl" />
              <div className="relative p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      {t.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate group-hover:text-[var(--brand-primary)] transition-colors">
                        {t.nome}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Globe className="h-3 w-3 text-slate-300" />
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{t.dominio}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${statusColors[t.status] || statusColors.inativo} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                    {t.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/50 rounded-2xl">
                  <div className="text-center">
                    <p className="text-lg font-semibold text-slate-900">{usersByTenant.get(t.id) || 0}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Usuários</p>
                  </div>
                  <div className="text-center border-x border-slate-100">
                    <p className="text-lg font-semibold text-slate-900">{editaisByTenant.get(t.id) || 0}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Editais</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-500 leading-tight">{t.cnpj || '—'}</p>
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">CNPJ</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">
                    Criado em {new Date(t.created_at).toLocaleDateString('pt-BR')}
                  </span>
                  <Link href={`/super/tenants/${t.id}`}>
                    <button className="text-[11px] font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary)]/80 uppercase tracking-wide transition-colors">
                      Editar
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
