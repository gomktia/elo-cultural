import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'

export interface RankingItem {
  posicao: number
  titulo: string
  protocolo: string
  nota_media: number | null
  num_avaliacoes: number
  status: string
}

interface RankingTableProps {
  items: RankingItem[]
}

export function RankingTable({ items }: RankingTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-2 w-8 bg-[var(--brand-primary)] rounded-full" />
            Classificação Geral
          </h3>
          <p className="text-slate-500 font-medium italic text-sm">Os projetos mais bem avaliados aparecem no topo.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[var(--brand-primary)]">
            <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
              <TableHead className="w-24 py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">Posição</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Projeto</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Nota Final</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-center">Avaliações</TableHead>
              <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, idx) => {
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
                  <TableCell className="py-6 px-4">
                    <div className={[
                      'text-lg md:text-2xl font-bold tracking-tight transition-transform group-hover:scale-110 origin-left',
                      isTop3 ? 'text-slate-900' : 'text-slate-400'
                    ].join(' ')}>
                      {item.nota_media?.toFixed(2) ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4 text-center">
                    <div className="h-8 w-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto border border-slate-100 font-semibold text-xs text-slate-600">
                      {item.num_avaliacoes}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <Badge className={[
                      'border-none rounded-lg px-2 text-[11px] font-medium uppercase tracking-wide py-1',
                      item.status === 'selecionado' ? 'bg-green-50 text-[var(--brand-success)]' :
                        item.status === 'suplente' ? 'bg-orange-50 text-[var(--brand-warning)]' :
                          'bg-slate-50 text-slate-400'
                    ].join(' ')}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              )
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Trophy className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">Nenhum resultado processado</p>
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
