import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RankingTable } from '@/components/avaliacao/RankingTable'
import { RankingTableSkeleton } from '@/components/avaliacao/RankingTableSkeleton'
import { ArrowLeft, RefreshCw, ShieldCheck, Star, GripVertical } from 'lucide-react'
import { ExportarFichasButton } from '@/components/admin/ExportarFichasButton'
import { ExportarResultadoButton } from '@/components/admin/ExportarResultadoButton'
import { consolidarRanking } from '@/lib/actions/consolidar-ranking'
import { revalidatePath } from 'next/cache'
import type { RankingItem } from '@/components/avaliacao/RankingTable'

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, config_pontuacao_extra, config_cotas, config_desempate, numero_pareceristas, limiar_discrepancia')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const hasAdvancedConfig = (edital.config_pontuacao_extra as unknown[])?.length > 0 ||
    (edital.config_cotas as unknown[])?.length > 0 ||
    (edital.config_desempate as unknown[])?.length > 0

  const numPareceristas = (edital.numero_pareceristas as number) || 3
  const limiarDiscrepancia = (edital.limiar_discrepancia as number) || 20

  // Only habilitado projects should appear in ranking
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, status_atual, nota_final, categoria_id, classificacao_tipo, avaliacoes(id, pontuacao_total, avaliador_id, status)')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
    .order('nota_final', { ascending: false, nullsFirst: false })

  // Load categorias
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome, vagas')
    .eq('edital_id', id)

  // Load avaliador names for column headers
  const avaliadorIds = new Set<string>()
  ;(projetos || []).forEach(p => {
    const avaliacoes = p.avaliacoes as Array<{ avaliador_id: string; status: string }> | null
    if (avaliacoes) {
      avaliacoes.filter(a => a.status === 'finalizada').forEach(a => avaliadorIds.add(a.avaliador_id))
    }
  })

  const { data: avaliadores } = avaliadorIds.size > 0
    ? await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', Array.from(avaliadorIds))
    : { data: [] }

  const avaliadorMap = new Map((avaliadores || []).map(a => [a.id, a.nome]))
  const avaliadorList = Array.from(avaliadorIds).map(id => ({
    id,
    nome: avaliadorMap.get(id) || 'Parecerista',
  }))

  const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

  const items: RankingItem[] = (projetos || []).map((p, idx) => {
    const avaliacoes = (p.avaliacoes as Array<{ id: string; pontuacao_total: number | null; avaliador_id: string; status: string }>) || []
    const finalizadas = avaliacoes.filter(a => a.status === 'finalizada')

    // Build per-evaluator scores map
    const notas_por_avaliador: Record<string, number | null> = {}
    for (const a of finalizadas) {
      notas_por_avaliador[a.avaliador_id] = a.pontuacao_total != null ? Number(a.pontuacao_total) : null
    }

    // Discrepancy check
    const scores = finalizadas
      .map(a => a.pontuacao_total != null ? Number(a.pontuacao_total) : null)
      .filter((n): n is number => n !== null)
    const discrepancia = scores.length >= 2
      ? Math.max(...scores) - Math.min(...scores) > limiarDiscrepancia
      : false

    return {
      posicao: idx + 1,
      titulo: p.titulo,
      protocolo: p.numero_protocolo,
      nota_media: p.nota_final ? Number(p.nota_final) : null,
      num_avaliacoes: finalizadas.length,
      status: p.status_atual,
      categoria_nome: p.categoria_id ? catMap.get(p.categoria_id) || undefined : undefined,
      classificacao_tipo: (p as Record<string, unknown>).classificacao_tipo as string | null || undefined,
      notas_por_avaliador,
      discrepancia,
    }
  })

  const countSelecionados = (projetos || []).filter(p => p.status_atual === 'selecionado').length
  const countSuplentes = (projetos || []).filter(p => p.status_atual === 'suplente').length

  async function handleConsolidar() {
    'use server'
    await consolidarRanking(id)
    revalidatePath(`/admin/editais/${id}/ranking`)
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-5">
              <Link href={`/admin/editais/${id}`}>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Ranking</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ExportarResultadoButton editalId={id} editalNumero={edital.numero_edital} />
              <ExportarFichasButton editalId={id} />
              <form action={handleConsolidar}>
                <Button type="submit" variant="outline" className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Consolidar Ranking
                </Button>
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats & Config Info */}
      {(countSelecionados > 0 || countSuplentes > 0 || hasAdvancedConfig) && (
        <div className="flex items-center gap-3 flex-wrap">
          {countSelecionados > 0 && (
            <Badge className="bg-green-50 text-green-700 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
              {countSelecionados} selecionado{countSelecionados !== 1 ? 's' : ''}
            </Badge>
          )}
          {countSuplentes > 0 && (
            <Badge className="bg-orange-50 text-orange-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
              {countSuplentes} suplente{countSuplentes !== 1 ? 's' : ''}
            </Badge>
          )}
          {hasAdvancedConfig && (
            <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[11px] font-medium px-2 py-0.5 rounded-md gap-1">
              <ShieldCheck className="h-3 w-3" />
              Config avançada ativa
            </Badge>
          )}
        </div>
      )}

      <Suspense fallback={<RankingTableSkeleton />}>
        <RankingTable
          items={items}
          categorias={categorias || []}
          avaliadores={avaliadorList}
          numPareceristas={numPareceristas}
        />
      </Suspense>
    </div>
  )
}
