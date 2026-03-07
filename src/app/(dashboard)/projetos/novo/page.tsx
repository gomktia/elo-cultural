'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { InscricaoForm } from '@/components/projeto/InscricaoForm'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

function NovoProjetoContent() {
  const searchParams = useSearchParams()
  const editalId = searchParams.get('edital') || ''
  const tenantId = searchParams.get('tenant') || ''
  const [tipoEdital, setTipoEdital] = useState<string>('fomento')

  useEffect(() => {
    if (!editalId) return
    const supabase = createClient()
    supabase
      .from('editais')
      .select('tipo_edital')
      .eq('id', editalId)
      .single()
      .then(({ data }) => {
        if (data?.tipo_edital) setTipoEdital(data.tipo_edital)
      })
  }, [editalId])

  if (!editalId || !tenantId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Parâmetros inválidos. Selecione um edital para se inscrever.
      </div>
    )
  }

  return <InscricaoForm editalId={editalId} tenantId={tenantId} tipoEdital={tipoEdital} />
}

export default function NovoProjetoPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href="/projetos">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Nova Inscrição</h1>
              <p className="text-sm text-slate-500">Preencha os dados do seu projeto</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Suspense>
        <NovoProjetoContent />
      </Suspense>
    </div>
  )
}
