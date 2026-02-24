import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-4 w-72 rounded-lg" />
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Data/Hora</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Acao</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Tabela</TableHead>
              <TableHead className="py-6 px-4 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400">Usuario</TableHead>
              <TableHead className="py-6 px-8 font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, i) => (
              <TableRow key={i} className="border-slate-50">
                <TableCell className="py-5 px-8">
                  <Skeleton className="h-4 w-36 rounded-md" />
                </TableCell>
                <TableCell className="py-5 px-4">
                  <Skeleton className="h-6 w-24 rounded-lg" />
                </TableCell>
                <TableCell className="py-5 px-4">
                  <Skeleton className="h-5 w-20 rounded-md" />
                </TableCell>
                <TableCell className="py-5 px-4">
                  <Skeleton className="h-4 w-32 rounded-md" />
                </TableCell>
                <TableCell className="py-5 px-8 text-right">
                  <Skeleton className="h-4 w-24 rounded-md ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
