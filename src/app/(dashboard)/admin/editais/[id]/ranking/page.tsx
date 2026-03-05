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
    .select('id, titulo, numero_edital, config_pontuacao_extra, config_cotas, config_desempate')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const hasAdvancedConfig = (edital.config_pontuacao_extra as unknown[])?.length > 0 ||
    (edital.config_cotas as unknown[])?.length > 0 ||
    (edital.config_desempate as unknown[])?.length > 0

  // Only habilitado projects should appear in ranking
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, status_atual, nota_final, categoria_id, avaliacoes(id)')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
    .eq('avaliacoes.status', 'finalizada')
    .order('nota_final', { ascending: false, nullsFirst: false })

  // Load categorias
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome, vagas')
    .eq('edital_id', id)

  const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

  const items: RankingItem[] = (projetos || []).map((p, idx) => ({
    posicao: idx + 1,
    titulo: p.titulo,
    protocolo: p.numero_protocolo,
    nota_media: p.nota_final ? Number(p.nota_final) : null,
    num_avaliacoes: Array.isArray(p.avaliacoes) ? p.avaliacoes.length : 0,
    status: p.status_atual,
    categoria_nome: p.categoria_id ? catMap.get(p.categoria_id) || undefined : undefined,
  }))

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
            <form action={handleConsolidar}>
              <Button type="submit" variant="outline" className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2">
                <RefreshCw className="h-4 w-4" />
                Consolidar Ranking
              </Button>
            </form>
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
        <RankingTable items={items} categorias={categorias || []} />
      </Suspense>
    </div>
  )
}
