'use client'

import { useState, useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, Search, Download, AlertTriangle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export interface RankingItem {
  posicao: number
  titulo: string
  protocolo: string
  nota_media: number | null
  num_avaliacoes: number
  status: string
  categoria_nome?: string
  classificacao_tipo?: string | null
  notas_por_avaliador?: Record<string, number | null>
  discrepancia?: boolean
}

const CLASSIFICACAO_LABELS: Record<string, { label: string; color: string }> = {
  ampla_concorrencia: { label: 'Ampla', color: 'bg-blue-50 text-blue-600' },
  cota_pessoa_negra: { label: 'Cota Negra', color: 'bg-purple-50 text-purple-600' },
  cota_pessoa_indigena: { label: 'Cota Indígena', color: 'bg-amber-50 text-amber-700' },
  cota_pessoa_pcd: { label: 'Cota PcD', color: 'bg-teal-50 text-teal-600' },
  cota_areas_perifericas: { label: 'Cota Periférica', color: 'bg-rose-50 text-rose-600' },
  remanejamento: { label: 'Remanejamento', color: 'bg-orange-50 text-orange-600' },
}

interface RankingTableProps {
  items: RankingItem[]
  categorias?: { id: string; nome: string }[]
  avaliadores?: { id: string; nome: string }[]
  numPareceristas?: number
}

function exportToXLS(items: RankingItem[]) {
  const hasCategoria = items.some(i => i.categoria_nome)
  const hasClassificacao = items.some(i => i.classificacao_tipo)
  const header = [
    'Posição', 'Título',
    ...(hasCategoria ? ['Categoria'] : []),
    'Protocolo', 'Nota Final', 'Avaliações',
    ...(hasClassificacao ? ['Classificação'] : []),
    'Status',
  ]
  const rows = items.map(item => {
    const base: (string | number)[] = [item.posicao, item.titulo]
    if (hasCategoria) base.push(item.categoria_nome || '—')
    base.push(item.protocolo, item.nota_media?.toFixed(2) ?? '', item.num_avaliacoes as any)
    if (hasClassificacao) base.push(
      item.classificacao_tipo ? (CLASSIFICACAO_LABELS[item.classificacao_tipo]?.label || item.classificacao_tipo) : '—'
    )
    base.push(item.status)
    return base
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="header"><Font ss:Bold="1"/><Interior ss:Color="#0047AB" ss:Pattern="Solid"/><Font ss:Color="#FFFFFF" ss:Bold="1"/></Style>
 <Style ss:ID="num"><NumberFormat ss:Format="0.00"/></Style>
</Styles>
<Worksheet ss:Name="Ranking">
<Table>
<Row>${header.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${rows.map(row => `<Row>${row.map((cell, i) => {
    const type = typeof cell === 'number' ? 'Number' : 'String'
    const style = i === 3 ? ' ss:StyleID="num"' : ''
    return `<Cell${style}><Data ss:Type="${type}">${cell}</Data></Cell>`
  }).join('')}</Row>`).join('\n')}
</Table>
</Worksheet>
</Workbook>`

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ranking-${new Date().toISOString().slice(0, 10)}.xls`
  a.click()
  URL.revokeObjectURL(url)
}

export function RankingTable({ items, categorias, avaliadores, numPareceristas = 3 }: RankingTableProps) {
  const showAvaliadores = (avaliadores?.length ?? 0) > 0
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<string>('todos')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')

  const statusOptions = useMemo(() => {
    const unique = new Set(items.map(i => i.status))
    return Array.from(unique).sort()
  }, [items])

  const categoriaOptions = useMemo(() => {
    if (!categorias || categorias.length === 0) return []
    return categorias
  }, [categorias])

  const filteredItems = useMemo(() => {
    let result = items
    if (filtroStatus !== 'todos') {
      result = result.filter(i => i.status === filtroStatus)
    }
    if (filtroCategoria !== 'todas') {
      result = result.filter(i => i.categoria_nome === filtroCategoria)
    }
    if (busca.trim()) {
      const q = busca.toLowerCase()
      result = result.filter(i =>
        i.titulo.toLowerCase().includes(q) || i.protocolo.toLowerCase().includes(q)
      )
    }
    return result
  }, [items, filtroStatus, filtroCategoria, busca])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-2 w-8 bg-[var(--brand-primary)] rounded-full" />
            Classificação Geral
          </h3>
          <p className="text-slate-500 font-medium text-sm">Os projetos mais bem avaliados aparecem no topo.</p>
        </div>
        <Button
          variant="outline"
          className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2"
          onClick={() => exportToXLS(filteredItems)}
          disabled={filteredItems.length === 0}
        >
          <Download className="h-4 w-4" />
          Exportar XLS
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por título ou protocolo..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="pl-9 h-10 rounded-xl border-slate-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={filtroStatus === 'todos' ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setFiltroStatus('todos')}
          >
            Todos ({items.length})
          </Button>
          {statusOptions.map(s => {
            const count = items.filter(i => i.status === s).length
            return (
              <Button
                key={s}
                variant={filtroStatus === s ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl text-xs capitalize"
                onClick={() => setFiltroStatus(s)}
              >
                {s} ({count})
              </Button>
            )
          })}
        </div>
      </div>

      {categoriaOptions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide self-center mr-1">Categoria:</span>
          <Button
            variant={filtroCategoria === 'todas' ? 'default' : 'outline'}
            size="sm"
            className="rounded-xl text-xs"
            onClick={() => setFiltroCategoria('todas')}
          >
            Todas
          </Button>
          {categoriaOptions.map(c => (
            <Button
              key={c.id}
              variant={filtroCategoria === c.nome ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl text-xs"
              onClick={() => setFiltroCategoria(c.nome)}
            >
              {c.nome}
            </Button>
          ))}
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[var(--brand-primary)]">
            <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
              <TableHead className="w-24 py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">Posição</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Projeto</TableHead>
              {categoriaOptions.length > 0 && (
                <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Categoria</TableHead>
              )}
              {showAvaliadores && avaliadores!.map((av, i) => (
                <TableHead key={av.id} className="py-4 px-3 font-semibold text-[10px] uppercase tracking-wide text-white/80 text-center">
                  <div className="truncate max-w-[80px]" title={av.nome}>P{i + 1}</div>
                </TableHead>
              ))}
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Média Final</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-center">Aval.</TableHead>
              <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => {
              const isTop3 = item.posicao <= 3
              const trophyColors = [
                'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]',
                'text-slate-400 drop-shadow-[0_0_8px_rgba(148,163,184,0.4)]',
                'text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.4)]'
              ]

              const statusBarColor = item.status === 'selecionado' ? 'bg-[var(--brand-success)]' :
                item.status === 'suplente' ? 'bg-amber-400' : 'bg-slate-300'

              return (
                <TableRow key={item.protocolo} className="relative even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100 group">
                  <TableCell className="py-6 px-8 relative">
                    <div className={`absolute left-0 top-2 bottom-2 w-1 rounded-full ${statusBarColor}`} />
                    <div className="flex items-center gap-3">
                      {isTop3 ? (
                        <div className={`h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center ${trophyColors[item.posicao - 1]}`}>
                          <Trophy className="h-5 w-5 fill-current" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center font-semibold text-slate-300 text-lg">
                          {item.posicao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4">
                    <div className="space-y-1">
                      <div className="text-base font-semibold text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                        {item.titulo}
                      </div>
                      <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        PROT: {item.protocolo}
                      </div>
                    </div>
                  </TableCell>
                  {categoriaOptions.length > 0 && (
                    <TableCell className="py-6 px-4">
                      <Badge className="bg-slate-50 text-slate-600 border-none rounded-lg px-2 text-[11px] font-medium py-1">
                        {item.categoria_nome || '—'}
                      </Badge>
                    </TableCell>
                  )}
                  {showAvaliadores && avaliadores!.map((av) => {
                    const nota = item.notas_por_avaliador?.[av.id]
                    return (
                      <TableCell key={av.id} className="py-6 px-3 text-center">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className={`text-sm font-semibold ${nota != null ? 'text-slate-600' : 'text-slate-300'}`}>
                                {nota != null ? nota.toFixed(1) : '—'}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">{av.nome}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    )
                  })}
                  <TableCell className="py-6 px-4">
                    <div className="flex items-center gap-2">
                      <div className={[
                        'text-lg md:text-2xl font-bold tracking-tight transition-transform group-hover:scale-110 origin-left',
                        isTop3 ? 'text-slate-900' : 'text-slate-400'
                      ].join(' ')}>
                        {item.nota_media?.toFixed(2) ?? '—'}
                      </div>
                      {item.discrepancia && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs">Discrepância entre pareceristas</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4 text-center">
                    <div className={`h-8 w-12 rounded-lg flex items-center justify-center mx-auto border font-semibold text-xs ${
                      item.num_avaliacoes < numPareceristas
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      {item.num_avaliacoes}/{numPareceristas}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      {item.classificacao_tipo && CLASSIFICACAO_LABELS[item.classificacao_tipo] && (
                        <Badge className={`border-none rounded-lg px-2 text-[10px] font-medium py-0.5 ${CLASSIFICACAO_LABELS[item.classificacao_tipo].color}`}>
                          {CLASSIFICACAO_LABELS[item.classificacao_tipo].label}
                        </Badge>
                      )}
                      <Badge className={[
                        'border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-1',
                        item.status === 'selecionado' ? 'bg-green-50 text-[var(--brand-success)]' :
                          item.status === 'suplente' ? 'bg-orange-50 text-[var(--brand-warning)]' :
                            'bg-slate-50 text-slate-400'
                      ].join(' ')}>
                        {item.status}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={99} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">
                      {items.length > 0 ? 'Nenhum resultado para os filtros aplicados' : 'Nenhum resultado processado'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
