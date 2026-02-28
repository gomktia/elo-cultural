import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { PublicacoesManager } from '@/components/edital/PublicacoesManager'
import { ArrowLeft } from 'lucide-react'

export default async function PublicacoesAdminPage({
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

  const { data: publicacoes } = await supabase
    .from('publicacoes')
    .select('*')
    .eq('edital_id', id)
    .order('data_publicacao', { ascending: false })

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PublicacoesManager
        editalId={id}
        editalTitulo={edital.titulo}
        tenantId={edital.tenant_id}
        publicacoes={publicacoes || []}
        backHref={`/admin/editais/${id}`}
      />
    </div>
  )
}
