'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { exportarFichasAvaliacao } from '@/lib/actions/exportar-fichas-avaliacao'
import { toast } from 'sonner'

export function ExportarFichasButton({ editalId }: { editalId: string }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const result = await exportarFichasAvaliacao(editalId)
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      const blob = new Blob([result.xml], { type: 'application/vnd.ms-excel' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Fichas de avaliação exportadas')
    } catch {
      toast.error('Erro ao exportar fichas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <FileDown className="h-4 w-4 mr-1.5" />}
      Fichas de Avaliação
    </Button>
  )
}
