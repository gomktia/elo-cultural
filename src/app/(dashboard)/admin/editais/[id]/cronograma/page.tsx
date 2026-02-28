import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Cronograma</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {e.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{e.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <FaseManager
        editalId={id}
        currentStatus={e.status}
        fases={(fases as EditalFase[]) || []}
      />
    </div>
  )
}
