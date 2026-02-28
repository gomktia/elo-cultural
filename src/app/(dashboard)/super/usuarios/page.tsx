import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Users, Building2 } from 'lucide-react'

const roleLabels: Record<string, string> = {
  proponente: 'Proponente',
  avaliador: 'Avaliador',
  gestor: 'Gestor',
  admin: 'Admin',
  super_admin: 'Super Admin',
}

const roleBadgeColor: Record<string, string> = {
  super_admin: 'bg-purple-50 text-purple-600',
  admin: 'bg-rose-50 text-rose-600',
  gestor: 'bg-blue-50 text-blue-600',
  avaliador: 'bg-indigo-50 text-indigo-600',
  proponente: 'bg-slate-50 text-slate-500',
}

export default async function SuperUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') redirect('/dashboard')

  const { data: usuarios } = await supabase
    .from('profiles')
    .select('*, tenants:tenant_id(nome)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-5 w-5 text-[var(--brand-primary)]" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Todos os Tenants</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Usuários Globais</h1>
        <p className="text-sm text-slate-500 font-normal">
          {usuarios?.length || 0} usuário{(usuarios?.length || 0) !== 1 ? 's' : ''} em toda a plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {(usuarios || []).map((u: any) => {
          const initials = u.nome?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'
          const tenantNome = u.tenants?.nome || 'Sem tenant'

          return (
            <div key={u.id} className="group relative">
              <div className="relative p-5 bg-white border border-slate-100 rounded-[28px] shadow-sm hover:shadow-md transition-all duration-500 hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-semibold text-sm flex-shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{u.nome}</h3>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-slate-300" />
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{tenantNome}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={`${roleBadgeColor[u.role] || roleBadgeColor.proponente} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                    {roleLabels[u.role] || u.role}
                  </Badge>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-300">
                  <span>{u.cpf_cnpj || 'CPF não informado'}</span>
                  <span>{new Date(u.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
