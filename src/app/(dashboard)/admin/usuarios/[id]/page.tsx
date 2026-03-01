import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, FolderOpen, ClipboardCheck, Calendar, ShieldAlert, User, Phone, MapPin, Briefcase, FileText, GraduationCap, Building2, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Profile } from '@/types/database.types'
import { ROLE_LABELS } from '@/lib/constants/roles'

const roleBadgeVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  admin: 'destructive',
  super_admin: 'destructive',
  gestor: 'default',
  avaliador: 'secondary',
  proponente: 'outline',
}

export default async function AdminUsuarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const p = profile as Profile

  const { count: projetosCount } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true })
    .eq('proponente_id', id)

  const { count: avaliacoesCount } = await supabase
    .from('avaliacoes')
    .select('id', { count: 'exact', head: true })
    .eq('avaliador_id', id)

  const { count: recursosCount } = await supabase
    .from('recursos')
    .select('id', { count: 'exact', head: true })
    .eq('proponente_id', id)

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/admin/usuarios">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl">
                {p.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">{p.nome}</h1>
                  <Badge variant={roleBadgeVariant[p.role] || 'outline'} className="rounded-lg px-3 py-1 text-[11px] font-medium uppercase tracking-wide">
                    {ROLE_LABELS[p.role as keyof typeof ROLE_LABELS] || p.role}
                  </Badge>
                  <Badge className={`${p.active ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-slate-50 text-slate-400'} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                    {p.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-slate-400">
                  CPF/CNPJ: <span className="text-slate-600 ml-1">{p.cpf_cnpj || '—'}</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Projetos Enviados', value: projetosCount ?? 0, icon: FolderOpen, color: 'text-[var(--brand-primary)]', bg: 'bg-brand-primary/5' },
          { label: 'Avaliações Feitas', value: avaliacoesCount ?? 0, icon: ClipboardCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Recursos', value: recursosCount ?? 0, icon: ShieldAlert, color: 'text-brand-secondary', bg: 'bg-brand-secondary/5' },
          { label: 'Cadastro', value: format(new Date(p.created_at), 'dd/MM/yyyy', { locale: ptBR }), icon: Calendar, color: 'text-[var(--brand-success)]', bg: 'bg-green-50' },
        ].map((stat, i) => (
          <Card key={i} className="border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-white rounded-2xl">
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">{stat.label}</p>
                  <div className="text-xl font-semibold text-slate-900 tracking-tight">{stat.value}</div>
                </div>
                <div className={`p-2.5 rounded-xl ${stat.bg} ${stat.color} transition-all duration-300`}>
                  <stat.icon className="h-4 w-4" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-[var(--brand-primary)] group-hover:w-full transition-all duration-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Pessoais */}
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-20" />
            <CardContent className="p-6 space-y-6">
              <h2 className="text-xs font-medium tracking-wide uppercase text-slate-400">Dados Pessoais</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                <InfoField icon={User} label="Nome completo" value={p.nome} />
                <InfoField icon={Hash} label="CPF/CNPJ" value={p.cpf_cnpj} />
                <InfoField icon={Phone} label="Telefone" value={p.telefone} />
                <InfoField icon={MapPin} label="Município" value={p.municipio} />
                <InfoField icon={MapPin} label="Estado" value={p.estado} />
                <InfoField icon={MapPin} label="Endereço" value={p.endereco_completo} />
              </div>
            </CardContent>
          </Card>

          {/* Role-specific fields */}
          {p.role === 'proponente' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-20" />
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xs font-medium tracking-wide uppercase text-slate-400">Dados do Proponente</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <InfoField icon={Briefcase} label="Áreas de atuação" value={p.areas_atuacao?.join(', ')} />
                  <InfoField icon={Briefcase} label="Tempo de atuação" value={p.tempo_atuacao} />
                  <InfoField icon={User} label="Gênero" value={p.genero} />
                  <InfoField icon={User} label="Orientação sexual" value={p.orientacao_sexual} />
                  <InfoField icon={User} label="Raça/Etnia" value={p.raca_etnia} />
                  <InfoField icon={FileText} label="Renda" value={p.renda} />
                  <InfoField icon={User} label="PcD" value={p.pcd ? 'Sim' : 'Não'} />
                </div>
              </CardContent>
            </Card>
          )}

          {p.role === 'avaliador' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-20" />
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xs font-medium tracking-wide uppercase text-slate-400">Dados do Avaliador</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <InfoField icon={FileText} label="Currículo" value={p.curriculo_descricao} />
                  </div>
                  <InfoField icon={GraduationCap} label="Lattes" value={p.lattes_url} />
                  <InfoField icon={Briefcase} label="Áreas de avaliação" value={p.areas_avaliacao?.join(', ')} />
                </div>
              </CardContent>
            </Card>
          )}

          {p.role === 'gestor' && (
            <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-secondary)] opacity-20" />
              <CardContent className="p-6 space-y-6">
                <h2 className="text-xs font-medium tracking-wide uppercase text-slate-400">Dados do Gestor</h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  <InfoField icon={Building2} label="Órgão vinculado" value={p.orgao_vinculado} />
                  <InfoField icon={Briefcase} label="Cargo/Função" value={p.funcao_cargo} />
                  <InfoField icon={Hash} label="Matrícula" value={p.matricula} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl p-6 space-y-6">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Informações da Conta</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Status</p>
                <Badge className={`${p.active ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-red-50 text-red-500'} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                  {p.active ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Função</p>
                <p className="text-sm font-semibold text-slate-900">{ROLE_LABELS[p.role as keyof typeof ROLE_LABELS] || p.role}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Data de cadastro</p>
                <p className="text-sm font-medium text-slate-600">{format(new Date(p.created_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Última atualização</p>
                <p className="text-sm font-medium text-slate-600">{format(new Date(p.updated_at), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">Consentimento LGPD</p>
                <Badge className={`${p.consentimento_lgpd ? 'bg-green-50 text-[var(--brand-success)]' : 'bg-amber-50 text-amber-600'} border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-0.5`}>
                  {p.consentimento_lgpd ? 'Aceito' : 'Pendente'}
                </Badge>
                {p.data_consentimento && (
                  <p className="text-xs text-slate-400 mt-0.5">{format(new Date(p.data_consentimento), 'dd/MM/yyyy', { locale: ptBR })}</p>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoField({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>, label: string, value: string | null | undefined }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-slate-300" />
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none">{label}</p>
      </div>
      <p className="text-sm font-medium text-slate-700">{value || '—'}</p>
    </div>
  )
}
