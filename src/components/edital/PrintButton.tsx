'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl border-slate-200 text-xs font-semibold uppercase tracking-wide gap-1.5 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="h-3.5 w-3.5" />
      Imprimir / PDF
    </Button>
  )
}
