import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusTracker } from '@/components/projeto/StatusTracker'
import { Plus, ArrowRight, FolderOpen, CheckCircle, Clock, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { UnifiedProjects } from './UnifiedProjects'

const statusBorderColor: Record<string, string> = {
  enviado: 'border-l-blue-500',
  em_analise: 'border-l-yellow-500',
  em_avaliacao: 'border-l-purple-500',
  habilitado: 'border-l-green-500',
  inabilitado: 'border-l-red-500',
  aprovado: 'border-l-green-500',
  reprovado: 'border-l-red-500',
  selecionado: 'border-l-emerald-500',
  suplente: 'border-l-amber-500',
}

export default async function MeusProjetosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const cookieTenantId = cookieStore.get('tenant_id')?.value
  const isRootDomain = !cookieTenantId

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  const isGlobalProponente = profile?.role === 'proponente' && !profile?.tenant_id

  // Unified view: proponente on root domain sees all projects grouped by city
  if (isRootDomain && isGlobalProponente) {
    const { data: allProjects } = await supabase
      .from('projetos')
      .select('id, titulo, status_atual, data_envio, numero_protocolo, editais!inner(titulo, numero_edital, tenant_id, tenants!inner(nome, dominio, tema_cores))')
      .eq('proponente_id', user.id)
      .order('data_envio', { ascending: false })

    type ProjectWithJoins = {
      id: string; titulo: string; status_atual: string; data_envio: string; numero_protocolo: string;
      editais: { titulo: string; numero_edital: string; tenant_id: string; tenants: { nome: string; dominio: string; tema_cores: unknown } };
    }
    const unified = (allProjects || []).map((p) => {
      const proj = p as unknown as ProjectWithJoins
      return {
        id: proj.id,
        titulo: proj.titulo,
        status_atual: proj.status_atual,
        data_envio: proj.data_envio,
        numero_protocolo: proj.numero_protocolo,
        edital_titulo: proj.editais.titulo,
        edital_numero: proj.editais.numero_edital,
        municipio: proj.editais.tenants.nome,
        dominio: proj.editais.tenants.dominio,
        tema_cores: proj.editais.tenants.tema_cores as { primary: string } | null,
      }
    })

    return (
      <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
          <div className="h-1 w-full bg-[var(--brand-primary)]" />
          <CardContent className="p-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Meus Projetos</h1>
              <p className="text-sm text-slate-500">Visão unificada de todas as suas inscrições culturais.</p>
            </div>
          </CardContent>
        </Card>
        {unified.length > 0 ? (
          <UnifiedProjects projects={unified} />
        ) : (
          <Card className="border border-slate-200 rounded-2xl p-8 text-center">
            <p className="text-sm text-slate-500">Você ainda não tem projetos inscritos.</p>
            <p className="text-xs text-slate-400 mt-2">Acesse o domínio de uma prefeitura para explorar editais abertos.</p>
          </Card>
        )}
      </div>
    )
  }

  const [{ data: projetos }, { count: editaisAbertos }] = await Promise.all([
    supabase
      .from('projetos')
      .select('*, editais(titulo, numero_edital)')
      .eq('proponente_id', user.id)
      .order('data_envio', { ascending: false }),
    supabase
      .from('editais')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile?.tenant_id)
      .eq('status', 'inscricao')
      .eq('active', true),
  ])

  const projetosList = projetos || []
  const totalProjetos = projetosList.length
  const selecionados = projetosList.filter(p => ['selecionado', 'aprovado'].includes(p.status_atual)).length
  const emAnalise = projetosList.filter(p => ['enviado', 'em_analise', 'em_avaliacao', 'habilitado'].includes(p.status_atual)).length

  return (
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Meus Projetos</h1>
              <p className="text-sm text-slate-500">Acompanhe o status das suas propostas culturais.</p>
            </div>
            <Link href="/editais">
              <Button className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm shadow-xl shadow-[var(--brand-primary)]/20 transition-all active:scale-95">
                <Plus className="mr-2 h-4 w-4" />
                Nova Inscrição
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Projetos Inscritos', value: totalProjetos, icon: FolderOpen, color: 'text-slate-400', bg: 'bg-slate-50' },
          { label: 'Selecionados', value: selecionados, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' },
          { label: 'Em Análise', value: emAnalise, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Editais Abertos', value: editaisAbertos ?? 0, icon: FileText, color: 'text-[var(--brand-primary)]', bg: 'bg-[var(--brand-primary)]/10' },
        ].map((stat) => (
          <Card key={stat.label} className="group border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">{stat.value}</div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {projetosList.length > 0 ? (
        <div className="grid gap-3">
          {projetosList.map((projeto) => (
            <Card key={projeto.id} className={`border-slate-200 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden bg-white border-l-4 ${statusBorderColor[projeto.status_atual] || 'border-l-slate-300'}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3 sm:items-center sm:gap-4">
                  <div className="hidden sm:flex h-10 w-10 rounded-xl bg-slate-50 items-center justify-center text-slate-300 shrink-0">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-2 sm:truncate group-hover:text-[var(--brand-primary)] transition-colors">
                      {projeto.titulo}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 sm:mt-0.5">
                      <p className="text-xs text-slate-400 font-medium leading-none truncate">
                        {projeto.editais?.titulo}
                      </p>
                      <span className="h-1 w-1 rounded-full bg-slate-200 shrink-0" />
                      <p className="text-xs text-slate-300 font-mono leading-none shrink-0">
                        {projeto.numero_protocolo}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2 sm:hidden">
                      <StatusTracker status={projeto.status_atual} />
                      <span className="text-[11px] text-slate-400">
                        {format(new Date(projeto.data_envio), 'dd MMM yyyy', { locale: ptBR })}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-6">
                    <StatusTracker status={projeto.status_atual} />
                    <div className="text-xs font-medium text-slate-500 text-right">
                      <p className="text-[11px] text-slate-400 mb-0.5">Enviado em</p>
                      {format(new Date(projeto.data_envio), 'dd MMM yyyy', { locale: ptBR })}
                    </div>
                  </div>
                  <Link href={`/projetos/${projeto.id}`} className="shrink-0">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-brand-primary/5 hover:text-brand-primary transition-all">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-3xl text-center">
          <FolderOpen className="h-12 w-12 text-slate-200 mb-4" />
          <p className="text-sm text-slate-500">Você ainda não possui projetos inscritos.</p>
          <Link href="/editais" className="mt-4">
            <Button variant="outline" className="rounded-xl border-slate-200 font-medium text-sm">
              Explorar Editais
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
