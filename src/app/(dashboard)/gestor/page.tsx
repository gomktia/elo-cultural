import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { FileText, FolderOpen, Users, BarChart3, ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Edital } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function GestorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, nome')
    .eq('id', user.id)
    .single()

  const tenantId = profile?.tenant_id

  const [
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalUsuarios },
    { count: totalAvaliacoes },
    { data: editaisRecentes },
  ] = await Promise.all([
    supabase.from('editais').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'finalizada'),
    supabase.from('editais').select('*').eq('tenant_id', tenantId).eq('active', true).order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Editais Ativos', value: totalEditais ?? 0, icon: FileText },
    { label: 'Inscrições', value: totalProjetos ?? 0, icon: FolderOpen },
    { label: 'Usuários', value: totalUsuarios ?? 0, icon: Users },
    { label: 'Avaliações Concluídas', value: totalAvaliacoes ?? 0, icon: BarChart3 },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = profile?.nome?.split(' ')[0] || 'Gestor'

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
            {greeting}, <span className="text-[var(--brand-primary)]">{firstName}</span>
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <Link href="/admin/editais/novo">
          <Button className="h-11 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95 text-sm">
            <Plus className="mr-2 h-4 w-4" />
            Novo Edital
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card key={i} className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden transition-all duration-500">
            <div className="absolute top-0 left-0 w-full h-1 bg-[var(--brand-primary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors duration-500">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none transition-transform duration-500 origin-left">
                  {stat.value.toLocaleString('pt-BR')}
                </div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Editais */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Editais Recentes</h2>
            <Link href="/admin/editais" className="text-xs font-medium text-[var(--brand-primary)] hover:underline">Ver Todos</Link>
          </div>

          <div className="grid gap-3">
            {(editaisRecentes as Edital[] | null)?.map(edital => (
              <Link key={edital.id} href={`/admin/editais/${edital.id}`} className="group">
                <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm group-hover:shadow-md group-hover:border-[var(--brand-primary)]/20 transition-all duration-300">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-colors">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 leading-none mb-1 group-hover:text-[var(--brand-primary)] transition-colors text-sm">{edital.titulo}</h3>
                      <p className="text-xs text-slate-400 font-medium leading-none">{edital.numero_edital}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <EditalStatusBadge status={edital.status} />
                    <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-brand-primary group-hover:text-white transition-all transform">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Access Shortcuts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight px-1">Acesso Rápido</h2>
          <div className="grid gap-2.5">
            {[
              { href: '/gestor/rankings', icon: BarChart3, label: 'Rankings', desc: 'Classificação oficial', color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { href: '/gestor/relatorios', icon: FileText, label: 'Relatórios', desc: 'Dados e estatísticas', color: 'text-brand-primary', bg: 'bg-brand-primary/5' },
              { href: '/admin/usuarios', icon: Users, label: 'Usuários', desc: 'Permissões e acessos', color: 'text-[var(--brand-success)]', bg: 'bg-green-50' },
              { href: '/admin/auditoria', icon: BarChart3, label: 'Auditoria', desc: 'Log de segurança', color: 'text-slate-900', bg: 'bg-slate-100' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="group">
                <div className="flex items-center gap-4 p-4 rounded-[20px] bg-white border border-slate-200 shadow-sm transition-all duration-300 group-hover:shadow-md">
                  <div className={`h-10 w-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center transition-transform`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-900 leading-none mb-1">{item.label}</p>
                    <p className="text-xs text-slate-400 font-normal">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-200 group-hover:text-[var(--brand-primary)]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
