'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Loader2, AlertTriangle } from 'lucide-react'
import { exportarPNAB } from '@/lib/actions/exportar-pnab'

interface ExportarPNABButtonProps {
  editalId: string
  editalNumero: string
}

export function ExportarPNABButton({ editalId, editalNumero }: ExportarPNABButtonProps) {
  const [loading, setLoading] = useState(false)
  const [alertas, setAlertas] = useState<string[]>([])

  async function handleExport() {
    setLoading(true)
    setAlertas([])
    try {
      const result = await exportarPNAB(editalId)
      if (result.error) {
        alert(result.error)
        return
      }
      if (result.alertas && result.alertas.length > 0) {
        setAlertas(result.alertas)
      }
      if (result.xml) {
        const blob = new Blob([result.xml], { type: 'application/vnd.ms-excel' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename || `PNAB-${editalNumero}.xls`
        a.click()
        URL.revokeObjectURL(url)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handleExport}
        disabled={loading}
        variant="outline"
        className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        Exportar PNAB
      </Button>
      {alertas.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
          <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <AlertTriangle className="h-3 w-3" />
            {alertas.length} campo{alertas.length > 1 ? 's' : ''} faltante{alertas.length > 1 ? 's' : ''}
          </p>
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {alertas.map((a, i) => (
              <p key={i} className="text-[11px] text-amber-600">{a}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
