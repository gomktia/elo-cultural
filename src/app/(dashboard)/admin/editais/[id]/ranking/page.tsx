import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RankingTable } from '@/components/avaliacao/RankingTable'
import { RankingTableSkeleton } from '@/components/avaliacao/RankingTableSkeleton'
import { ArrowLeft, RefreshCw } from 'lucide-react'
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
    .select('id, titulo, numero_edital')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  // Only habilitado projects should appear in ranking
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, status_atual, nota_final, avaliacoes(id)')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
    .eq('avaliacoes.status', 'finalizada')
    .order('nota_final', { ascending: false, nullsFirst: false })

  const items: RankingItem[] = (projetos || []).map((p, idx) => ({
    posicao: idx + 1,
    titulo: p.titulo,
    protocolo: p.numero_protocolo,
    nota_media: p.nota_final ? Number(p.nota_final) : null,
    num_avaliacoes: Array.isArray(p.avaliacoes) ? p.avaliacoes.length : 0,
    status: p.status_atual,
  }))

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

      <Suspense fallback={<RankingTableSkeleton />}>
        <RankingTable items={items} />
      </Suspense>
    </div>
  )
}
