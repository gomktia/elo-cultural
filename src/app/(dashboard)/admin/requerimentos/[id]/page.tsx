import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { RequerimentoDecisaoPanel } from '@/components/admin/RequerimentoDecisaoPanel'

const TIPOS_LABEL: Record<string, string> = {
  prorrogacao: 'Prorrogação de Prazo',
  alteracao_equipe: 'Alteração de Equipe',
  remanejamento_recursos: 'Remanejamento de Recursos',
  alteracao_cronograma: 'Alteração de Cronograma',
  substituicao_item: 'Substituição de Item Orçamentário',
  outros: 'Outros',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700' },
  diligencia: { label: 'Diligência', color: 'bg-orange-100 text-orange-700' },
  respondida: { label: 'Respondida', color: 'bg-violet-100 text-violet-700' },
  deferido: { label: 'Deferido', color: 'bg-green-100 text-green-700' },
  indeferido: { label: 'Indeferido', color: 'bg-red-100 text-red-700' },
}

export default async function RequerimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: req } = await supabase
    .from('requerimentos')
    .select('*, projetos:projeto_id(titulo, numero_protocolo), profiles:proponente_id(nome, cpf_cnpj, email)')
    .eq('id', id)
    .single()

  if (!req) notFound()

  const projeto = req.projetos as unknown as { titulo: string; numero_protocolo: string } | null
  const proponente = req.profiles as unknown as { nome: string; cpf_cnpj: string | null; email: string | null } | null
  const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendente
  const isPending = ['pendente', 'em_analise', 'respondida'].includes(req.status)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin/requerimentos">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {TIPOS_LABEL[req.tipo] || req.tipo}
            </h1>
            <Badge className={`${status.color} border-none text-[10px]`}>{status.label}</Badge>
          </div>
          {req.protocolo && (
            <p className="text-xs text-slate-400 font-mono mt-0.5">{req.protocolo}</p>
          )}
        </div>
      </div>

      {/* Proponente + Projeto info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Proponente</p>
            <p className="text-sm font-semibold text-slate-900">{proponente?.nome || '—'}</p>
            {proponente?.cpf_cnpj && <p className="text-xs text-slate-500">{proponente.cpf_cnpj}</p>}
            {proponente?.email && <p className="text-xs text-slate-400">{proponente.email}</p>}
          </CardContent>
        </Card>
        <Card className="border border-slate-200 rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Projeto</p>
            <p className="text-sm font-semibold text-slate-900">{projeto?.titulo || '—'}</p>
            <p className="text-xs text-slate-400 font-mono">{projeto?.numero_protocolo || '—'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Justificativa */}
      <Card className="border border-slate-200 rounded-2xl">
        <CardContent className="p-4 space-y-2">
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Justificativa</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{req.justificativa}</p>
          {req.valor_envolvido && (
            <p className="text-xs text-slate-500 pt-1">
              Valor envolvido: <strong>R$ {Number(req.valor_envolvido).toFixed(2)}</strong>
            </p>
          )}
          <p className="text-[11px] text-slate-400 pt-1">
            Enviado em {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </CardContent>
      </Card>

      {/* Diligência info */}
      {req.diligencia_texto && (
        <Card className="border border-orange-200 bg-orange-50/30 rounded-2xl">
          <CardContent className="p-4 space-y-2">
            <p className="text-[10px] font-medium text-orange-600 uppercase tracking-wide">
              Diligência ({req.diligencia_count}/2)
            </p>
            <p className="text-sm text-orange-800">{req.diligencia_texto}</p>
            {req.diligencia_resposta && (
              <div className="pt-2 border-t border-orange-200 mt-2">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Resposta do Proponente</p>
                <p className="text-sm text-slate-700 mt-1">{req.diligencia_resposta}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Decisão existente */}
      {req.decisao_texto && (req.status === 'deferido' || req.status === 'indeferido') && (
        <Card className={`border rounded-2xl ${req.status === 'deferido' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
          <CardContent className="p-4 space-y-2">
            <p className={`text-[10px] font-medium uppercase tracking-wide ${req.status === 'deferido' ? 'text-green-600' : 'text-red-600'}`}>
              Decisão — {req.status === 'deferido' ? 'Deferido' : 'Indeferido'}
            </p>
            <p className="text-sm text-slate-700">{req.decisao_texto}</p>
            {req.decidido_em && (
              <p className="text-[11px] text-slate-400">
                Em {format(new Date(req.decidido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Painel de decisão (para requerimentos em análise) */}
      {isPending && (
        <RequerimentoDecisaoPanel
          requerimentoId={req.id}
          status={req.status}
          diligenciaCount={req.diligencia_count || 0}
        />
      )}
    </div>
  )
}
