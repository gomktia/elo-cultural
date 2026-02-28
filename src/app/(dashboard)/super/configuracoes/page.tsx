'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Server, Database, HardDrive, Shield, Globe, Building2, Palette } from 'lucide-react'
import Link from 'next/link'

export default function SuperConfiguracoesPage() {
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [stats, setStats] = useState({
    totalTenants: 0,
    tenantsAtivos: 0,
    tenantsInativos: 0,
    tenantsSuspensos: 0,
  })
  const [tenants, setTenants] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role !== 'super_admin') { setLoading(false); return }
      setAuthorized(true)

      const { data: allTenants } = await supabase
        .from('tenants')
        .select('*')
        .order('nome')

      const list = allTenants || []
      setTenants(list)
      setStats({
        totalTenants: list.length,
        tenantsAtivos: list.filter(t => t.status === 'ativo').length,
        tenantsInativos: list.filter(t => t.status === 'inativo').length,
        tenantsSuspensos: list.filter(t => t.status === 'suspenso').length,
      })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }

  if (!authorized) {
    return (
      <div className="text-center py-12 text-slate-400 text-sm">
        Acesso negado.
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-green-50 text-[var(--brand-success)]',
    inativo: 'bg-slate-50 text-slate-400',
    suspenso: 'bg-amber-50 text-amber-600',
  }

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Configuracoes da Plataforma</h1>
            <p className="text-sm text-slate-500">Visao geral da plataforma e gestao de instancias.</p>
          </div>
        </CardContent>
      </Card>

      {/* Status da Plataforma */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-[var(--brand-primary)] p-4">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-white flex items-center gap-2">
            <Server className="h-4 w-4" />
            Status da Plataforma
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <p className="text-2xl font-semibold text-slate-900">{stats.totalTenants}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Total Tenants</p>
            </div>
            <div className="text-center p-4 bg-green-50/50 rounded-2xl border border-green-100">
              <p className="text-2xl font-semibold text-green-600">{stats.tenantsAtivos}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Ativos</p>
            </div>
            <div className="text-center p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <p className="text-2xl font-semibold text-slate-400">{stats.tenantsInativos}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Inativos</p>
            </div>
            <div className="text-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
              <p className="text-2xl font-semibold text-amber-600">{stats.tenantsSuspensos}</p>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mt-1">Suspensos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gestão Rápida de Tenants */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-[var(--brand-primary)] p-4">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-white flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Gestao Rapida de Instancias
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-3">
            {tenants.map(t => {
              const cores = t.tema_cores as { primary?: string; secondary?: string } | null
              return (
                <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-10 w-10 rounded-xl flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                      style={{ backgroundColor: cores?.primary || '#0047AB' }}
                    >
                      {t.nome.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{t.nome}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{t.dominio} &middot; {t.cnpj || 'CNPJ nao informado'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge className={`${statusColors[t.status] || statusColors.inativo} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                      {t.status}
                    </Badge>
                    <Link href={`/super/tenants/${t.id}`}>
                      <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg border-slate-200 text-xs font-semibold text-slate-600 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30 transition-all">
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
            {tenants.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-8">Nenhum tenant cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info da Plataforma */}
      <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
        <CardHeader className="bg-[var(--brand-primary)] p-4">
          <CardTitle className="text-xs font-medium uppercase tracking-wide text-white flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Informacoes do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Globe className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Plataforma</p>
                <p className="text-sm font-semibold text-slate-900">Elo Cultura Digital</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Database className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Banco de Dados</p>
                <p className="text-sm font-semibold text-slate-900">Supabase (PostgreSQL)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <HardDrive className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Hospedagem</p>
                <p className="text-sm font-semibold text-slate-900">Vercel (Edge Network)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
              <Palette className="h-5 w-5 text-[var(--brand-primary)]" />
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Framework</p>
                <p className="text-sm font-semibold text-slate-900">Next.js 14 (App Router)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
