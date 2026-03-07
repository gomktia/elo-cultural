'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2, Plus, FileText, Clock, CheckCircle2, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import { criarRequerimento, responderDiligencia } from '@/lib/actions/requerimento-actions'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const TIPOS_REQUERIMENTO = [
  { value: 'prorrogacao', label: 'Prorrogação de Prazo' },
  { value: 'alteracao_equipe', label: 'Alteração de Equipe' },
  { value: 'remanejamento_recursos', label: 'Remanejamento de Recursos' },
  { value: 'alteracao_cronograma', label: 'Alteração de Cronograma' },
  { value: 'substituicao_item', label: 'Substituição de Item Orçamentário' },
  { value: 'outros', label: 'Outros' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-3 w-3" /> },
  em_analise: { label: 'Em Análise', color: 'bg-blue-100 text-blue-700', icon: <FileText className="h-3 w-3" /> },
  diligencia: { label: 'Diligência', color: 'bg-orange-100 text-orange-700', icon: <AlertTriangle className="h-3 w-3" /> },
  respondida: { label: 'Respondida', color: 'bg-violet-100 text-violet-700', icon: <MessageSquare className="h-3 w-3" /> },
  deferido: { label: 'Deferido', color: 'bg-green-100 text-green-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  indeferido: { label: 'Indeferido', color: 'bg-red-100 text-red-700', icon: <XCircle className="h-3 w-3" /> },
}

interface Requerimento {
  id: string
  tipo: string
  justificativa: string
  valor_envolvido: number | null
  status: string
  protocolo: string | null
  diligencia_texto: string | null
  diligencia_resposta: string | null
  diligencia_count: number
  decisao_texto: string | null
  created_at: string
  decidido_em: string | null
}

interface RequerimentoSectionProps {
  projetoId: string
  termoId: string | null
  tenantId: string
  requerimentos: Requerimento[]
  termoVigente: boolean
}

export function RequerimentoSection({ projetoId, termoId, tenantId, requerimentos, termoVigente }: RequerimentoSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tipo, setTipo] = useState('')
  const [justificativa, setJustificativa] = useState('')
  const [valorEnvolvido, setValorEnvolvido] = useState('')
  const [diligenciaResposta, setDiligenciaResposta] = useState('')
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const [respondLoading, setRespondLoading] = useState(false)

  async function handleSubmit() {
    if (!tipo || !justificativa.trim()) {
      toast.error('Preencha o tipo e a justificativa')
      return
    }
    setLoading(true)
    const result = await criarRequerimento({
      projetoId,
      termoId,
      tenantId,
      tipo,
      justificativa: justificativa.trim(),
      valorEnvolvido: valorEnvolvido ? parseFloat(valorEnvolvido) : null,
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Requerimento criado! Protocolo: ${result.protocolo}`)
      setShowForm(false)
      setTipo('')
      setJustificativa('')
      setValorEnvolvido('')
    }
  }

  async function handleResponderDiligencia(reqId: string) {
    if (!diligenciaResposta.trim()) {
      toast.error('Escreva sua resposta')
      return
    }
    setRespondLoading(true)
    const result = await responderDiligencia(reqId, diligenciaResposta.trim())
    setRespondLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Resposta enviada')
      setRespondingId(null)
      setDiligenciaResposta('')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Requerimentos</h3>
        {termoVigente && (
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Novo Requerimento
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="border border-blue-200 bg-blue-50/30 rounded-2xl">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Tipo *</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-sm">
                  <SelectValue placeholder="Selecione o tipo de requerimento" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_REQUERIMENTO.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                placeholder="Descreva detalhadamente o motivo do requerimento"
                rows={4}
                className="rounded-xl border-slate-200 bg-white text-sm"
              />
            </div>

            {(tipo === 'remanejamento_recursos' || tipo === 'substituicao_item') && (
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Valor Envolvido (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={valorEnvolvido}
                  onChange={e => setValorEnvolvido(e.target.value)}
                  placeholder="0.00"
                  className="h-10 rounded-xl border-slate-200 bg-white text-sm"
                />
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} className="rounded-xl">
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={loading} className="rounded-xl">
                {loading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                Enviar Requerimento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {requerimentos.length === 0 && !showForm && (
        <p className="text-sm text-slate-400 py-4 text-center">Nenhum requerimento registrado.</p>
      )}

      {requerimentos.map(req => {
        const status = STATUS_CONFIG[req.status] || STATUS_CONFIG.pendente
        const tipoLabel = TIPOS_REQUERIMENTO.find(t => t.value === req.tipo)?.label || req.tipo

        return (
          <Card key={req.id} className="border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{tipoLabel}</p>
                  {req.protocolo && (
                    <p className="text-[11px] text-slate-400 font-mono">{req.protocolo}</p>
                  )}
                </div>
                <Badge className={`${status.color} border-none text-[10px] gap-1`}>
                  {status.icon}
                  {status.label}
                </Badge>
              </div>

              <p className="text-sm text-slate-600">{req.justificativa}</p>

              {req.valor_envolvido && (
                <p className="text-xs text-slate-500">
                  Valor envolvido: <strong>R$ {req.valor_envolvido.toFixed(2)}</strong>
                </p>
              )}

              <p className="text-[11px] text-slate-400">
                Enviado em {format(new Date(req.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>

              {/* Diligência pendente */}
              {req.status === 'diligencia' && req.diligencia_texto && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 space-y-2">
                  <p className="text-xs font-semibold text-orange-800">Diligência solicitada ({req.diligencia_count}/2)</p>
                  <p className="text-sm text-orange-700">{req.diligencia_texto}</p>
                  {respondingId === req.id ? (
                    <div className="space-y-2 pt-1">
                      <Textarea
                        value={diligenciaResposta}
                        onChange={e => setDiligenciaResposta(e.target.value)}
                        placeholder="Escreva sua resposta à diligência..."
                        rows={3}
                        className="rounded-xl border-orange-200 bg-white text-sm"
                      />
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => setRespondingId(null)} className="rounded-xl text-xs">
                          Cancelar
                        </Button>
                        <Button size="sm" onClick={() => handleResponderDiligencia(req.id)} disabled={respondLoading} className="rounded-xl text-xs">
                          {respondLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          Enviar Resposta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setRespondingId(req.id)} className="rounded-xl text-xs border-orange-300 text-orange-700 hover:bg-orange-100">
                      Responder Diligência
                    </Button>
                  )}
                </div>
              )}

              {/* Resposta da diligência */}
              {req.diligencia_resposta && req.status !== 'diligencia' && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="text-[11px] font-medium text-slate-500">Resposta à diligência</p>
                  <p className="text-sm text-slate-700">{req.diligencia_resposta}</p>
                </div>
              )}

              {/* Decisão */}
              {req.decisao_texto && (req.status === 'deferido' || req.status === 'indeferido') && (
                <div className={`p-3 rounded-xl border space-y-1 ${req.status === 'deferido' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className={`text-[11px] font-medium ${req.status === 'deferido' ? 'text-green-600' : 'text-red-600'}`}>
                    Decisão — {req.status === 'deferido' ? 'Deferido' : 'Indeferido'}
                  </p>
                  <p className="text-sm text-slate-700">{req.decisao_texto}</p>
                  {req.decidido_em && (
                    <p className="text-[11px] text-slate-400">
                      Em {format(new Date(req.decidido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
