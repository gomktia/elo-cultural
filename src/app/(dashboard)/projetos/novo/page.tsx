'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { InscricaoForm } from '@/components/projeto/InscricaoForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

function NovoProjetoContent() {
  const searchParams = useSearchParams()
  const editalId = searchParams.get('edital') || ''
  const tenantId = searchParams.get('tenant') || ''

  if (!editalId || !tenantId) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Parâmetros inválidos. Selecione um edital para se inscrever.
      </div>
    )
  }

  return <InscricaoForm editalId={editalId} tenantId={tenantId} />
}

export default function NovoProjetoPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/projetos">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nova Inscrição</h1>
          <p className="text-muted-foreground">Preencha os dados do seu projeto</p>
        </div>
      </div>
      <Suspense>
        <NovoProjetoContent />
      </Suspense>
    </div>
  )
}
