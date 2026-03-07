'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { DollarSign, Plus, Loader2, CheckCircle2, Clock, XCircle, Banknote } from 'lucide-react'
import { registrarPagamento, atualizarStatusPagamento } from '@/lib/actions/pagamento-actions'
import { createClient } from '@/lib/supabase/client'
import type { TermoWithProjeto } from '@/types/database.types'

interface Pagamento {
  id: string
  numero_parcela: number
  valor: number
  data_pagamento: string | null
  status: string
  observacoes: string | null
  termos_execucao?: { numero_termo: string; projetos?: { titulo: string } | null } | null
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-slate-100 text-slate-500' },
  liberado: { label: 'Liberado', color: 'bg-blue-50 text-blue-600' },
  pago: { label: 'Pago', color: 'bg-green-50 text-green-600' },
  cancelado: { label: 'Cancelado', color: 'bg-red-50 text-red-500' },
}

interface PagamentosSectionProps {
  editalId: string
  termos: TermoWithProjeto[]
}

export function PagamentosSection({ editalId, termos }: PagamentosSectionProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  async function loadPagamentos() {
    const supabase = createClient()
    const termoIds = termos.map(t => t.id)
    const { data } = await supabase
      .from('pagamentos')
      .select('id, numero_parcela, valor, data_pagamento, status, observacoes, termos_execucao:termo_id(numero_termo, projetos:projeto_id(titulo))')
      .in('termo_id', termoIds)
      .order('created_at', { ascending: false })
    setPagamentos((data || []) as unknown as Pagamento[])
    setLoaded(true)
  }

  if (!loaded) {
    loadPagamentos()
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    formData.set('edital_id', editalId)
    const result = await registrarPagamento(formData)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Pagamento registrado')
      setShowForm(false)
      loadPagamentos()
    }
    setSaving(false)
  }

  async function handleStatusChange(pagamentoId: string, status: 'liberado' | 'pago' | 'cancelado') {
    const result = await atualizarStatusPagamento(pagamentoId, status, editalId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Status atualizado para ${STATUS_BADGES[status]?.label || status}`)
      loadPagamentos()
    }
  }

  const termosAssinados = termos.filter(t => ['assinado', 'vigente'].includes(t.status))

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            Pagamentos
          </CardTitle>
          <Button
            size="sm"
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Registrar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form action={handleSubmit} className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Termo *</label>
                <select name="termo_id" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" onChange={e => {
                  const termo = termosAssinados.find(t => t.id === e.target.value)
                  const projetoInput = e.target.form?.querySelector('[name="projeto_id"]') as HTMLInputElement
                  if (projetoInput && termo) projetoInput.value = termo.projeto_id
                }}>
                  <option value="">Selecione...</option>
                  {termosAssinados.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.numero_termo} — {(t.projetos as unknown as { titulo: string } | null)?.titulo || 'Projeto'}
                    </option>
                  ))}
                </select>
                <input type="hidden" name="projeto_id" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Parcela</label>
                <input name="numero_parcela" type="number" min="1" defaultValue="1" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor (R$) *</label>
                <input name="valor" type="number" step="0.01" min="0" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Data Liberação</label>
                <input name="data_pagamento" type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Observações</label>
                <input name="observacoes" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Ex: Parcela única, transferência bancária..." />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Banknote className="h-4 w-4 mr-2" />}
              Registrar Pagamento
            </Button>
          </form>
        )}

        {pagamentos.length === 0 ? (
          <div className="py-8 text-center">
            <Banknote className="h-6 w-6 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhum pagamento registrado.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pagamentos.map(p => {
              const badge = STATUS_BADGES[p.status] || STATUS_BADGES.pendente
              const termoInfo = p.termos_execucao as { numero_termo: string; projetos?: { titulo: string } | null } | null | undefined
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        Parcela {p.numero_parcela} — {Number(p.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <Badge className={`${badge.color} border-none text-[10px] font-semibold px-1.5 py-0 rounded-md`}>
                        {badge.label}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {termoInfo?.numero_termo || ''} {termoInfo?.projetos?.titulo ? `— ${termoInfo.projetos.titulo}` : ''}
                      {p.data_pagamento && ` · ${new Date(p.data_pagamento).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {p.status === 'pendente' && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(p.id, 'liberado')} className="h-7 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Liberar
                      </Button>
                    )}
                    {p.status === 'liberado' && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(p.id, 'pago')} className="h-7 text-[11px] text-green-600 hover:text-green-700 hover:bg-green-50">
                        Confirmar Pago
                      </Button>
                    )}
                    {(p.status === 'pendente' || p.status === 'liberado') && (
                      <Button size="sm" variant="ghost" onClick={() => handleStatusChange(p.id, 'cancelado')} className="h-7 text-[11px] text-red-500 hover:text-red-600 hover:bg-red-50">
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
