import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileCheck, Clock, CheckCircle2, AlertTriangle, XCircle, Inbox } from 'lucide-react'
import { PrestacaoStatusBadge } from '@/components/prestacao/PrestacaoStatusBadge'
import { PrestacaoAnalise } from '@/components/prestacao/PrestacaoAnalise'
import type { StatusPrestacao } from '@/types/database.types'

export default async function GestorPrestacaoContasPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['gestor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const tenantId = profile.tenant_id

  // Buscar todas as prestações do tenant com dados do projeto
  const { data: prestacoes } = await supabase
    .from('prestacoes_contas')
    .select('*, projetos(titulo, numero_protocolo, orcamento_total, editais(titulo, numero_edital))')
    .eq('tenant_id', tenantId)
    .neq('status', 'rascunho')
    .order('data_envio', { ascending: false })

  // Contadores
  const enviadas = (prestacoes || []).filter(p => p.status === 'enviada').length
  const emAnalise = (prestacoes || []).filter(p => p.status === 'em_analise').length
  const aprovadas = (prestacoes || []).filter(p => p.status === 'aprovada').length
  const reprovadas = (prestacoes || []).filter(p => p.status === 'reprovada').length

  const stats = [
    { label: 'Aguardando', value: enviadas, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Em Análise', value: emAnalise, icon: FileCheck, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Aprovadas', value: aprovadas, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Reprovadas', value: reprovadas, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-slate-400 mb-1">
          <FileCheck className="h-3 w-3" />
          <span className="text-[11px] font-medium uppercase tracking-wider">Gestão</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Prestação de Contas</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analise e aprove as prestações de contas dos projetos aprovados.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{stat.label}</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Lista de prestações */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-900">Prestações Recebidas</h2>
          <p className="text-xs text-slate-400 mt-0.5">Clique em uma prestação para analisar</p>
        </div>

        {(!prestacoes || prestacoes.length === 0) ? (
          <div className="px-6 py-16 text-center">
            <Inbox className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Nenhuma prestação de contas recebida ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {prestacoes.map((p: any) => (
              <PrestacaoAnalise
                key={p.id}
                prestacao={{
                  id: p.id,
                  status: p.status as StatusPrestacao,
                  valor_total_executado: p.valor_total_executado,
                  resumo_atividades: p.resumo_atividades,
                  observacoes: p.observacoes,
                  parecer_gestor: p.parecer_gestor,
                  data_envio: p.data_envio,
                  data_analise: p.data_analise,
                }}
                projeto={{
                  titulo: p.projetos?.titulo || 'Projeto',
                  numero_protocolo: p.projetos?.numero_protocolo || '',
                  orcamento_total: Number(p.projetos?.orcamento_total) || 0,
                  edital_titulo: p.projetos?.editais?.titulo || '',
                  edital_numero: p.projetos?.editais?.numero_edital || '',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
