import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { FaseManager } from '@/components/edital/FaseManager'
import { ArrowLeft } from 'lucide-react'
import type { Edital, EditalFase } from '@/types/database.types'

export default async function CronogramaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('*')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const e = edital as Edital

  const { data: fases } = await supabase
    .from('edital_fases')
    .select('*')
    .eq('edital_id', id)
    .order('created_at', { ascending: true })

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/editais/${id}`}>
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cronograma</h1>
          <p className="text-muted-foreground">{e.titulo} - {e.numero_edital}</p>
        </div>
      </div>

      <FaseManager
        editalId={id}
        currentStatus={e.status}
        fases={(fases as EditalFase[]) || []}
      />
    </div>
  )
}
