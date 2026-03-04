import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FormBuilderManager } from '@/components/edital/FormBuilderManager'
import { ArrowLeft } from 'lucide-react'

export default async function FormularioPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, numero_edital, titulo, tenant_id')
    .eq('id', id)
    .single()

  if (!edital) notFound()

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
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Formulário de Inscrição</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {edital.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{edital.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="space-y-1 mb-6">
            <h2 className="text-base font-semibold text-slate-900">Campos Customizados</h2>
            <p className="text-xs text-slate-500">Configure campos adicionais que os proponentes deverão preencher durante a inscrição.</p>
          </div>
          <FormBuilderManager editalId={id} tenantId={edital.tenant_id} />
        </CardContent>
      </Card>
    </div>
  )
}
