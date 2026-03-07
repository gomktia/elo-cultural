import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
  diligencia: { label: 'Diligência', color: 'bg-orange-100 text-orange-700' },
  respondida: { label: 'Respondida', color: 'bg-violet-100 text-violet-700' },
  deferido: { label: 'Deferido', color: 'bg-green-100 text-green-700' },
  indeferido: { label: 'Indeferido', color: 'bg-red-100 text-red-700' },
}

const TIPOS_LABEL: Record<string, string> = {
  prorrogacao: 'Prorrogação',
  alteracao_equipe: 'Alteração de Equipe',
  remanejamento_recursos: 'Remanejamento',
  alteracao_cronograma: 'Alteração de Cronograma',
  substituicao_item: 'Substituição de Item',
  outros: 'Outros',
}

export default async function AdminRequerimentosPage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .single()

  if (!profile?.tenant_id) return <p>Sem acesso</p>

  const { data: requerimentos } = await supabase
    .from('requerimentos')
    .select('*, projetos:projeto_id(titulo, numero_protocolo), profiles:proponente_id(nome)')
    .eq('tenant_id', profile.tenant_id)
    .order('created_at', { ascending: false })

  const items = (requerimentos || []) as Array<{
    id: string
    tipo: string
    justificativa: string
    valor_envolvido: number | null
    status: string
    protocolo: string | null
    diligencia_count: number
    diligencia_texto: string | null
    diligencia_resposta: string | null
    decisao_texto: string | null
    decidido_em: string | null
    created_at: string
    projetos: { titulo: string; numero_protocolo: string } | null
    profiles: { nome: string } | null
  }>

  const pendentes = items.filter(r => ['pendente', 'respondida'].includes(r.status)).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Requerimentos</h1>
          <p className="text-sm text-slate-500 mt-1">Solicitações de alteração durante a execução de projetos</p>
        </div>
        {pendentes > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-none text-xs">
            {pendentes} pendente{pendentes > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {items.length === 0 && (
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-8 text-center text-slate-400 text-sm">
            Nenhum requerimento recebido.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map(req => {
          const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendente
          const projeto = req.projetos as unknown as { titulo: string; numero_protocolo: string } | null
          const proponente = req.profiles as unknown as { nome: string } | null

          return (
            <Link key={req.id} href={`/admin/requerimentos/${req.id}`}>
              <Card className="border border-slate-200 rounded-2xl shadow-sm hover:border-[var(--brand-primary)]/30 hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{TIPOS_LABEL[req.tipo] || req.tipo}</p>
                        {req.protocolo && (
                          <span className="text-[11px] text-slate-400 font-mono">{req.protocolo}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {proponente?.nome || '—'} · {projeto?.titulo || '—'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge className={`${status.color} border-none text-[10px] flex-shrink-0`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
