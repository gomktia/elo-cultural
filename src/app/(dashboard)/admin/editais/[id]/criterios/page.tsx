import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CriteriosTable } from '@/components/edital/CriteriosTable'
import { ArrowLeft } from 'lucide-react'
import type { Criterio } from '@/types/database.types'

export default async function CriteriosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, tenant_id')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: criterios } = await supabase
    .from('criterios')
    .select('*')
    .eq('edital_id', id)
    .order('ordem', { ascending: true })

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href={`/admin/editais/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criterios de Avaliacao</h1>
          <p className="text-muted-foreground">{edital.titulo} - {edital.numero_edital}</p>
        </div>
      </div>

      <CriteriosTable
        editalId={id}
        tenantId={edital.tenant_id}
        criterios={(criterios as Criterio[]) || []}
      />
    </div>
  )
}
