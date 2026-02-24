'use server'

import { createClient } from '@/lib/supabase/server'

export async function consolidarRanking(editalId: string) {
  const supabase = await createClient()

  // Single query: fetch all projetos with their finalized avaliacoes (eliminates N+1)
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, avaliacoes(pontuacao_total)')
    .eq('edital_id', editalId)
    .eq('avaliacoes.status', 'finalizada')
    .not('avaliacoes.pontuacao_total', 'is', null)

  if (!projetos || projetos.length === 0) return { error: 'Nenhum projeto encontrado' }

  // Batch updates: calculate averages locally
  const updates = projetos
    .filter(p => Array.isArray(p.avaliacoes) && p.avaliacoes.length > 0)
    .map(p => {
      const avaliacoes = p.avaliacoes as Array<{ pontuacao_total: number }>
      const media = avaliacoes.reduce((sum, a) => sum + Number(a.pontuacao_total), 0) / avaliacoes.length
      return { id: p.id, nota_final: media }
    })

  // Execute all updates concurrently (still multiple queries, but parallel)
  if (updates.length > 0) {
    const results = await Promise.all(
      updates.map(({ id, nota_final }) =>
        supabase.from('projetos').update({ nota_final }).eq('id', id)
      )
    )

    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      return { error: `Falha ao atualizar ${errors.length} projeto(s)` }
    }
  }

  return { success: true }
}
