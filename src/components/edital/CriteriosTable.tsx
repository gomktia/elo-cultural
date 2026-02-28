'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import type { Criterio } from '@/types/database.types'
import { Plus, Trash2, Save } from 'lucide-react'

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

    // Delete existing criterios for this edital
    await supabase.from('criterios').delete().eq('edital_id', editalId)

    // Insert all current ones
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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-8 w-2 bg-[var(--brand-primary)] rounded-full" />
            Definição de Parâmetros
          </h2>
          <p className="text-slate-500 font-medium text-sm">Configure os critérios de pontuação para avaliação técnica.</p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={addCriterio}
            className="h-12 px-6 rounded-2xl border-slate-200 hover:bg-slate-50 font-semibold transition-all active:scale-95 flex items-center gap-2"
          >
            <Plus className="h-5 w-5 text-slate-400" />
            Novo Critério
          </Button>
          <Button
            onClick={saveAll}
            disabled={saving}
            className="h-12 px-8 rounded-2xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold shadow-xl shadow-blue-200/40 transition-all active:scale-95 group"
          >
            {saving ? <Plus className="h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5 text-white/70 group-hover:scale-110 transition-transform" />}
            Salvar Critérios
          </Button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-16 py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">#</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Descrição do Critério</TableHead>
              <TableHead className="w-28 py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">Nota Mín.</TableHead>
              <TableHead className="w-28 py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">Nota Máx.</TableHead>
              <TableHead className="w-28 py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">Peso</TableHead>
              <TableHead className="w-16 py-6 px-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => (
              <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors border-slate-50 group">
                <TableCell className="py-6 px-8 text-center">
                  <div className="h-10 w-10 flex items-center justify-center font-semibold text-slate-300 text-lg bg-slate-50 rounded-xl mx-auto">
                    {idx + 1}
                  </div>
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Input
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 font-bold transition-all"
                    value={item.descricao}
                    onChange={e => updateField(idx, 'descricao', e.target.value)}
                    placeholder="Ex: Mérito Cultural e Inovação"
                  />
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Input
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.nota_minima}
                    onChange={e => updateField(idx, 'nota_minima', Number(e.target.value))}
                  />
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Input
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.nota_maxima}
                    onChange={e => updateField(idx, 'nota_maxima', Number(e.target.value))}
                  />
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Input
                    className="h-12 rounded-xl border-slate-100 bg-slate-50/50 text-center font-semibold focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                    type="number"
                    value={item.peso}
                    onChange={e => updateField(idx, 'peso', Number(e.target.value))}
                  />
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCriterio(idx)}
                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-slate-300 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Plus className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wide leading-relaxed max-w-[200px] mx-auto">
                      Nenhum critério definido para este edital.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
