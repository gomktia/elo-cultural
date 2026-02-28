'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { Loader2, Check, Users, Shield } from 'lucide-react'
import type { Profile, Projeto } from '@/types/database.types'

interface AtribuicaoMatrixProps {
  editalId: string
  tenantId: string
  avaliadores: Profile[]
  projetos: Projeto[]
  atribuicoes: Array<{ avaliador_id: string; projeto_id: string }>
}

export function AtribuicaoMatrix({ editalId, tenantId, avaliadores, projetos, atribuicoes }: AtribuicaoMatrixProps) {
  const [matrix, setMatrix] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {}
    atribuicoes.forEach(a => {
      if (!m[a.avaliador_id]) m[a.avaliador_id] = new Set()
      m[a.avaliador_id].add(a.projeto_id)
    })
    return m
  })
  const [saving, setSaving] = useState(false)

  function toggle(avaliadorId: string, projetoId: string) {
    setMatrix(prev => {
      const next = { ...prev }
      if (!next[avaliadorId]) next[avaliadorId] = new Set()
      const set = new Set(next[avaliadorId])
      if (set.has(projetoId)) set.delete(projetoId)
      else set.add(projetoId)
      next[avaliadorId] = set
      return next
    })
  }

  function isAssigned(avaliadorId: string, projetoId: string) {
    return matrix[avaliadorId]?.has(projetoId) ?? false
  }

  async function saveAtribuicoes() {
    setSaving(true)
    const supabase = createClient()

    // Build desired assignments set
    const desired = new Set<string>()
    for (const [avaliadorId, projetoIds] of Object.entries(matrix)) {
      for (const projetoId of projetoIds) {
        desired.add(`${avaliadorId}:${projetoId}`)
      }
    }

    // Fetch all existing avaliacoes for this edital
    const { data: existingAvals, error: fetchError } = await supabase
      .from('avaliacoes')
      .select('id, avaliador_id, projeto_id, status')
      .eq('tenant_id', tenantId)
      .in('projeto_id', projetos.map(p => p.id))

    if (fetchError) {
      toast.error('Erro ao carregar atribuições existentes: ' + fetchError.message)
      setSaving(false)
      return
    }

    const existing = existingAvals || []
    const existingKeys = new Set(existing.map(a => `${a.avaliador_id}:${a.projeto_id}`))

    // Determine what to add and what to remove
    const toAdd: Array<{ tenant_id: string; projeto_id: string; avaliador_id: string }> = []
    for (const key of desired) {
      if (!existingKeys.has(key)) {
        const [avaliadorId, projetoId] = key.split(':')
        toAdd.push({ tenant_id: tenantId, projeto_id: projetoId, avaliador_id: avaliadorId })
      }
    }

    const toRemoveIds: string[] = []
    for (const a of existing) {
      const key = `${a.avaliador_id}:${a.projeto_id}`
      if (!desired.has(key)) {
        if (a.status === 'finalizada') {
          toast.error(`Não é possível remover avaliação já finalizada de ${a.avaliador_id}`)
          setSaving(false)
          return
        }
        toRemoveIds.push(a.id)
      }
    }

    // Remove unassigned (only em_andamento ones)
    if (toRemoveIds.length > 0) {
      const { error: delError } = await supabase
        .from('avaliacoes')
        .delete()
        .in('id', toRemoveIds)

      if (delError) {
        toast.error('Erro ao remover atribuições: ' + delError.message)
        setSaving(false)
        return
      }
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const { error: insError } = await supabase.from('avaliacoes').insert(toAdd)
      if (insError) {
        toast.error('Erro ao salvar atribuições: ' + insError.message)
        setSaving(false)
        return
      }
    }

    toast.success(`Atribuições salvas (${toAdd.length} adicionadas, ${toRemoveIds.length} removidas)`)
    setSaving(false)
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-50 pb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-8 w-2 bg-[var(--brand-primary)] rounded-full" />
            Painel de Distribuição
          </h2>
          <p className="text-slate-500 font-medium italic">Selecione quais avaliadores atuarão em cada projeto.</p>
        </div>

        <Button
          onClick={saveAtribuicoes}
          disabled={saving}
          className="h-14 px-8 rounded-2xl bg-[var(--brand-primary)] hover:opacity-90 text-white font-semibold shadow-xl shadow-blue-200/40 transition-all active:scale-95 group"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="mr-2 h-5 w-5 text-white/70 group-hover:scale-110 transition-transform" />}
          Salvar Atribuições
        </Button>
      </div>

      <div className="relative overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[var(--brand-primary)]">
            <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
              <TableHead className="sticky left-0 bg-[var(--brand-primary)] backdrop-blur-md z-20 w-[280px] py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">
                Avaliador
              </TableHead>
              {projetos.map(p => (
                <TableHead key={p.id} className="text-center min-w-[200px] py-4 px-4">
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-white tracking-tight truncate max-w-[180px] mx-auto" title={p.titulo}>
                      {p.titulo}
                    </div>
                    <div className="text-[11px] font-medium text-white/70 uppercase tracking-wide bg-white/10 inline-block px-2 py-0.5 rounded-md">
                      {p.numero_protocolo}
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {avaliadores.map(av => (
              <TableRow key={av.id} className="even:bg-slate-50/40 hover:bg-slate-100/60 transition-colors border-slate-100 group">
                <TableCell className="sticky left-0 bg-white/95 backdrop-blur-md z-20 py-5 px-8 group-hover:bg-slate-50/95 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-semibold text-sm group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-colors">
                      {av.nome?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-base font-bold text-slate-900 leading-none mb-1 group-hover:text-[var(--brand-primary)] transition-colors">
                        {av.nome}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Avaliador Externo</div>
                    </div>
                  </div>
                </TableCell>
                {projetos.map(p => {
                  const active = isAssigned(av.id, p.id)
                  return (
                    <TableCell key={p.id} className="text-center p-0">
                      <div
                        onClick={() => toggle(av.id, p.id)}
                        className={[
                          'h-20 w-full flex items-center justify-center cursor-pointer transition-all duration-300',
                          active ? 'bg-brand-primary/5' : 'hover:bg-slate-50/80'
                        ].join(' ')}
                      >
                        <div className={[
                          'h-8 w-8 rounded-xl flex items-center justify-center border-2 transition-all duration-300',
                          active
                            ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)] text-white shadow-lg shadow-brand-primary/20 scale-110'
                            : 'bg-white border-slate-100 text-transparent'
                        ].join(' ')}>
                          <Check className="h-5 w-5 stroke-[3px]" />
                        </div>
                      </div>
                    </TableCell>
                  )
                })}
              </TableRow>
            ))}
            {avaliadores.length === 0 && (
              <TableRow>
                <TableCell colSpan={projetos.length + 1} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Users className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">Nenhum avaliador cadastrado</p>
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
