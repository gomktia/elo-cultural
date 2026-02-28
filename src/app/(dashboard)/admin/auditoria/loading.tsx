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

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-[var(--brand-primary)]">
            <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
              <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white">Data/Hora</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Acao</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Tabela</TableHead>
              <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">Usuario</TableHead>
              <TableHead className="py-4 px-8 font-semibold text-xs uppercase tracking-wide text-white text-right">IP</TableHead>
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
