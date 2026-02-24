import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { RankingTable } from '@/components/avaliacao/RankingTable'
import { RankingTableSkeleton } from '@/components/avaliacao/RankingTableSkeleton'
import { ArrowLeft } from 'lucide-react'
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

  // Single query: fetch projetos with evaluation count via join (eliminates N+1)
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, status_atual, nota_final, avaliacoes(id)')
    .eq('edital_id', id)
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/admin/editais/${id}`}>
          <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-[900] tracking-tight text-slate-900">Ranking</h1>
          <p className="text-sm text-slate-500 font-medium">{edital.titulo} — {edital.numero_edital}</p>
        </div>
      </div>

      <Suspense fallback={<RankingTableSkeleton />}>
        <RankingTable items={items} />
      </Suspense>
    </div>
  )
}
