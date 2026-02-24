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
          <h3 className="text-xl font-[900] text-slate-900 tracking-tight flex items-center gap-3">
            <div className="h-2 w-8 bg-emerald-500 rounded-full" />
            Classificação Geral
          </h3>
          <p className="text-slate-500 font-medium italic text-sm">Os projetos mais bem avaliados aparecem no topo.</p>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-24 py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Posição</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Projeto</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Nota Final</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-center">Avaliações</TableHead>
              <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">Status</TableHead>
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

              return (
                <TableRow key={item.protocolo} className="hover:bg-slate-50/50 transition-all duration-300 border-slate-50 group">
                  <TableCell className="py-6 px-8">
                    <div className="flex items-center gap-3">
                      {isTop3 ? (
                        <div className={`h-10 w-10 rounded-xl bg-white shadow-md flex items-center justify-center ${trophyColors[item.posicao - 1]}`}>
                          <Trophy className="h-5 w-5 fill-current" />
                        </div>
                      ) : (
                        <div className="h-10 w-10 flex items-center justify-center font-black text-slate-300 text-lg">
                          {item.posicao}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4">
                    <div className="space-y-1">
                      <div className="text-base font-black text-slate-900 leading-none group-hover:text-[var(--brand-primary)] transition-colors">
                        {item.titulo}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        PROT: {item.protocolo}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4">
                    <div className={[
                      'text-2xl font-[900] tracking-tighter transition-transform group-hover:scale-110 origin-left',
                      isTop3 ? 'text-slate-900' : 'text-slate-400'
                    ].join(' ')}>
                      {item.nota_media?.toFixed(2) ?? '—'}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-4 text-center">
                    <div className="h-8 w-12 bg-slate-50 rounded-lg flex items-center justify-center mx-auto border border-slate-100 font-black text-xs text-slate-600">
                      {item.num_avaliacoes}
                    </div>
                  </TableCell>
                  <TableCell className="py-6 px-8 text-right">
                    <Badge className={[
                      'border-none rounded-lg px-2 text-[10px] font-black uppercase tracking-widest py-1',
                      item.status === 'selecionado' ? 'bg-emerald-50 text-emerald-600' :
                        item.status === 'suplente' ? 'bg-amber-50 text-amber-600' :
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
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Nenhum resultado processado</p>
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
