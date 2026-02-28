'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { Criterio } from '@/types/database.types'
import { Plus, Trash2, Save, GripVertical } from 'lucide-react'

interface CriteriosTableProps {
  editalId: string
  tenantId: string
  criterios: Criterio[]
  onUpdate?: () => void
}

interface CriterioForm {
  id?: string
  descricao: string
  nota_minima: number
  nota_maxima: number
  peso: number
  ordem: number
}

const numberColors = [
  'bg-blue-50 text-[var(--brand-primary)] border-blue-100',
  'bg-pink-50 text-[var(--brand-secondary)] border-pink-100',
  'bg-green-50 text-[var(--brand-success)] border-green-100',
  'bg-amber-50 text-[var(--brand-warning)] border-amber-100',
  'bg-violet-50 text-violet-600 border-violet-100',
  'bg-cyan-50 text-cyan-600 border-cyan-100',
  'bg-rose-50 text-rose-600 border-rose-100',
  'bg-teal-50 text-teal-600 border-teal-100',
]

const barColors = [
  'bg-[var(--brand-primary)]',
  'bg-[var(--brand-secondary)]',
  'bg-[var(--brand-success)]',
  'bg-[var(--brand-warning)]',
  'bg-violet-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-teal-500',
]

export function CriteriosTable({ editalId, tenantId, criterios, onUpdate }: CriteriosTableProps) {
  const [items, setItems] = useState<CriterioForm[]>(
    criterios.map((c, i) => ({
      id: c.id,
      descricao: c.descricao,
      nota_minima: c.nota_minima,
      nota_maxima: c.nota_maxima,
      peso: c.peso,
      ordem: c.ordem ?? i + 1,
    }))
  )
  const [saving, setSaving] = useState(false)

  function addCriterio() {
    setItems([...items, {
      descricao: '',
      nota_minima: 0,
      nota_maxima: 10,
      peso: 1,
      ordem: items.length + 1,
    }])
  }

  function removeCriterio(index: number) {
    setItems(items.filter((_, i) => i !== index))
  }

  function updateField(index: number, field: keyof CriterioForm, value: string | number) {
    const updated = [...items]
    updated[index] = { ...updated[index], [field]: value }
    setItems(updated)
  }

  async function saveAll() {
    setSaving(true)
    const supabase = createClient()

    await supabase.from('criterios').delete().eq('edital_id', editalId)

    const { error } = await supabase.from('criterios').insert(
      items.map(item => ({
        edital_id: editalId,
        tenant_id: tenantId,
        descricao: item.descricao,
        nota_minima: item.nota_minima,
        nota_maxima: item.nota_maxima,
        peso: item.peso,
        ordem: item.ordem,
      }))
    )

    if (error) {
      toast.error('Erro ao salvar critérios: ' + error.message)
    } else {
      toast.success('Critérios salvos com sucesso')
      onUpdate?.()
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-6 w-1.5 bg-[var(--brand-primary)] rounded-full" />
            Critérios de Pontuação
          </h2>
          <p className="text-slate-400 font-medium text-sm">Configure os critérios para avaliação técnica dos projetos.</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={addCriterio}
            className="h-10 px-5 rounded-xl border-slate-200 hover:bg-slate-50 font-semibold transition-all active:scale-95 text-sm"
          >
            <Plus className="mr-2 h-4 w-4 text-slate-400" />
            Novo Critério
          </Button>
          <Button
            onClick={saveAll}
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold shadow-lg shadow-blue-200/30 transition-all active:scale-95 text-sm"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="relative flex items-start gap-4 p-4 rounded-2xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all group"
          >
            {/* Color bar on the left */}
            <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${barColors[idx % barColors.length]}`} />

            {/* Number badge */}
            <div className={`flex-shrink-0 h-10 w-10 rounded-xl border flex items-center justify-center text-base font-bold ml-2 ${numberColors[idx % numberColors.length]}`}>
              {idx + 1}
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-3">
              {/* Description row */}
              <div>
                <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5 block">Descrição</Label>
                <Input
                  className="h-10 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 font-medium text-sm transition-all"
                  value={item.descricao}
                  onChange={e => updateField(idx, 'descricao', e.target.value)}
                  placeholder="Ex: Mérito Cultural e Inovação"
                />
              </div>

              {/* Numbers row */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5 block">Nota Mín.</Label>
                  <Input
                    className="h-10 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.nota_minima}
                    onChange={e => updateField(idx, 'nota_minima', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5 block">Nota Máx.</Label>
                  <Input
                    className="h-10 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.nota_maxima}
                    onChange={e => updateField(idx, 'nota_maxima', Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1.5 block">Peso</Label>
                  <Input
                    className="h-10 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.peso}
                    onChange={e => updateField(idx, 'peso', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeCriterio(idx)}
              className="flex-shrink-0 h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive text-slate-300 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-slate-100">
            <div className="h-14 w-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200 mb-4">
              <Plus className="h-7 w-7" />
            </div>
            <p className="text-slate-400 font-medium text-sm mb-1">Nenhum critério definido</p>
            <p className="text-slate-300 text-xs">Clique em "Novo Critério" para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
