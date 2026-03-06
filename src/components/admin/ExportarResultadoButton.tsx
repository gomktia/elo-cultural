'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2 } from 'lucide-react'
import { exportarResultado } from '@/lib/actions/exportar-resultado'

interface ExportarResultadoButtonProps {
  editalId: string
  editalNumero: string
}

export function ExportarResultadoButton({ editalId, editalNumero }: ExportarResultadoButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const result = await exportarResultado(editalId)
      if (result.error) {
        alert(result.error)
        return
      }
      if (result.xml) {
        const blob = new Blob([result.xml], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || `Resultado-${editalNumero}.xls`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      variant="outline"
      className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2"
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar Resultado
    </Button>
  )
}
