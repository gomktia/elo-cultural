'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { criarAditivo, aprovarAditivo, rejeitarAditivo } from '@/lib/actions/aditivo-actions'
import { toast } from 'sonner'
import { Plus, FileEdit, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { TermoAditivo, TermoWithProjeto } from '@/types/database.types'

const TIPO_LABELS: Record<string, string> = {
  prorrogacao: 'Prorrogação',
  alteracao_valor: 'Alteração de Valor',
  alteracao_objeto: 'Alteração do Objeto',
  alteracao_equipe: 'Alteração de Equipe',
  outro: 'Outro',
}

const STATUS_BADGES: Record<string, { label: string; class: string }> = {
  pendente: { label: 'Pendente', class: 'bg-amber-50 text-amber-600 border-none' },
  aprovado: { label: 'Aprovado', class: 'bg-emerald-50 text-emerald-600 border-none' },
  rejeitado: { label: 'Rejeitado', class: 'bg-red-50 text-red-600 border-none' },
}

interface AditivosSectionProps {
  termos: TermoWithProjeto[]
  aditivos: TermoAditivo[]
}

export function AditivosSection({ termos, aditivos }: AditivosSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [selectedTermo, setSelectedTermo] = useState('')
  const [tipo, setTipo] = useState('prorrogacao')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await criarAditivo(formData)
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Aditivo registrado com sucesso')
      setShowForm(false)
    }
  }

  async function handleAprovar(id: string) {
    const result = await aprovarAditivo(id)
    if (result.error) toast.error(result.error)
    else toast.success('Aditivo aprovado')
  }

  async function handleRejeitar(id: string) {
    const result = await rejeitarAditivo(id)
    if (result.error) toast.error(result.error)
    else toast.success('Aditivo rejeitado')
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileEdit className="h-4 w-4 text-[var(--brand-primary)]" />
            Aditivos ({aditivos.length})
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl text-xs font-semibold gap-1"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus className="h-3 w-3" />
            Novo Aditivo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form action={handleSubmit} className="space-y-4 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Termo *</label>
                <Select name="termo_id" value={selectedTermo} onValueChange={setSelectedTermo}>
                  <SelectTrigger className="mt-1 h-10 rounded-xl border-slate-200 bg-white text-sm">
                    <SelectValue placeholder="Selecione o termo" />
                  </SelectTrigger>
                  <SelectContent>
                    {termos.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.numero_termo} — {(t.projetos as any)?.titulo || 'Projeto'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="termo_id" value={selectedTermo} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tipo *</label>
                <Select name="tipo" value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="mt-1 h-10 rounded-xl border-slate-200 bg-white text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_LABELS).map(([val, label]) => (
                      <SelectItem key={val} value={val}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <input type="hidden" name="tipo" value={tipo} />
              </div>
              {tipo === 'alteracao_valor' && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Novo Valor (R$)</label>
                  <Input name="valor_alterado" type="number" step="0.01" placeholder="0.00" className="mt-1 h-10 rounded-xl border-slate-200 bg-white text-sm" />
                </div>
              )}
              {tipo === 'prorrogacao' && (
                <div>
                  <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nova Data Fim Vigência</label>
                  <Input name="nova_vigencia_fim" type="date" className="mt-1 h-10 rounded-xl border-slate-200 bg-white text-sm" />
                </div>
              )}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Justificativa *</label>
                <Textarea name="justificativa" required rows={3} placeholder="Descreva o motivo do aditivo..." className="mt-1 rounded-xl border-slate-200 bg-white text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !selectedTermo} className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm">
                <Plus className="mr-2 h-4 w-4" /> Registrar Aditivo
              </Button>
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {aditivos.length > 0 ? (
          <div className="space-y-2">
            {aditivos.map(a => {
              const sb = STATUS_BADGES[a.status] || STATUS_BADGES.pendente
              return (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-900">Aditivo #{a.numero_aditivo}</span>
                      <Badge className={`text-[10px] px-1.5 py-0 rounded-md ${sb.class}`}>{sb.label}</Badge>
                      <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] px-1.5 py-0 rounded-md">
                        {TIPO_LABELS[a.tipo] || a.tipo}
                      </Badge>
                      {a.requer_aprovacao && (
                        <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] px-1.5 py-0 rounded-md">
                          Requer aprovação ({'>'}20%)
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{a.justificativa}</p>
                    {a.valor_alterado && <p className="text-xs text-slate-500 mt-0.5">Valor: R$ {Number(a.valor_alterado).toFixed(2)}</p>}
                    {a.nova_vigencia_fim && <p className="text-xs text-slate-500 mt-0.5">Nova vigência: {a.nova_vigencia_fim}</p>}
                  </div>
                  {a.status === 'pendente' && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-500 hover:text-emerald-700" onClick={() => handleAprovar(a.id)}>
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => handleRejeitar(a.id)}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <FileEdit className="h-6 w-6 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhum aditivo registrado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
