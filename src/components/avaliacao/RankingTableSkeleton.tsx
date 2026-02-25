import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

export function RankingTableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="w-24 py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400">Posicao</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Projeto</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Nota Final</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400 text-center">Avaliacoes</TableHead>
              <TableHead className="py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-slate-50">
                <TableCell className="py-6 px-8">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </TableCell>
                <TableCell className="py-6 px-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-48 rounded-md" />
                    <Skeleton className="h-3 w-28 rounded-md" />
                  </div>
                </TableCell>
                <TableCell className="py-6 px-4">
                  <Skeleton className="h-7 w-16 rounded-md" />
                </TableCell>
                <TableCell className="py-6 px-4 text-center">
                  <Skeleton className="h-8 w-12 rounded-lg mx-auto" />
                </TableCell>
                <TableCell className="py-6 px-8 text-right">
                  <Skeleton className="h-6 w-20 rounded-lg ml-auto" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
