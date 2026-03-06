'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface InscritoItem {
  numero: number
  protocolo: string
  proponente: string
  projeto: string
  categoria: string
  data: string
}

interface InscritosExportProps {
  inscritos: InscritoItem[]
  editalNumero: string
}

function exportToXLS(inscritos: InscritoItem[], editalNumero: string) {
  const header = ['Nº', 'Proponente', 'Projeto', 'Categoria', 'Protocolo', 'Data Inscrição']
  const rows = inscritos.map(i => [
    i.numero,
    i.proponente,
    i.projeto,
    i.categoria,
    i.protocolo,
    new Date(i.data).toLocaleDateString('pt-BR'),
  ])

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0047AB" ss:Pattern="Solid"/></Style>
</Styles>
<Worksheet ss:Name="Inscritos">
<Table>
<Row>${header.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${rows.map(row => `<Row>${row.map(cell => {
    const type = typeof cell === 'number' ? 'Number' : 'String'
    return `<Cell><Data ss:Type="${type}">${cell}</Data></Cell>`
  }).join('')}</Row>`).join('\n')}
</Table>
</Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inscritos-${editalNumero}-${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function InscritosExport({ inscritos, editalNumero }: InscritosExportProps) {
  return (
    <Button
      variant="outline"
      className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2"
      onClick={() => exportToXLS(inscritos, editalNumero)}
    >
      <Download className="h-4 w-4" />
      Exportar XLS
    </Button>
  )
}
