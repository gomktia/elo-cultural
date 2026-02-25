import { createClient } from '@/lib/supabase/server'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Shield } from 'lucide-react'
import type { LogAuditoriaWithProfile } from '@/types/database.types'

export default async function AuditoriaPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('logs_auditoria')
    .select('*, profiles(nome)')
    .order('created_at', { ascending: false })
    .limit(200)

  const typedLogs = (logs || []) as LogAuditoriaWithProfile[]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none flex items-center gap-3">
          <div className="h-2 w-8 bg-[var(--brand-primary)] rounded-full" />
          Log de Auditoria
        </h1>
        <p className="text-sm text-slate-500 font-normal">Registro de todas as acoes do sistema</p>
      </div>

      <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm ring-1 ring-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400">Data/Hora</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Acao</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Tabela</TableHead>
              <TableHead className="py-6 px-4 font-medium text-xs uppercase tracking-wide text-slate-400">Usuario</TableHead>
              <TableHead className="py-6 px-8 font-medium text-xs uppercase tracking-wide text-slate-400 text-right">IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {typedLogs.map((log) => (
              <TableRow key={log.id} className="hover:bg-slate-50/50 transition-all duration-300 border-slate-50 group">
                <TableCell className="py-5 px-8 font-mono text-xs text-slate-500 whitespace-nowrap">
                  {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                </TableCell>
                <TableCell className="py-5 px-4">
                  <Badge className="border-none rounded-lg px-2 text-xs font-medium uppercase tracking-wide py-1 bg-slate-100 text-slate-600">
                    {log.acao}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-4">
                  <code className="text-xs font-medium text-slate-900 bg-slate-50 px-2 py-1 rounded-md uppercase tracking-wide">
                    {log.tabela_afetada}
                  </code>
                </TableCell>
                <TableCell className="py-5 px-4 text-sm font-bold text-slate-700 group-hover:text-[var(--brand-primary)] transition-colors">
                  {log.profiles?.nome || '\u2014'}
                </TableCell>
                <TableCell className="py-5 px-8 text-right font-mono text-xs text-slate-400">
                  {log.ip_address || '\u2014'}
                </TableCell>
              </TableRow>
            ))}
            {typedLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Shield className="h-8 w-8" />
                    </div>
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-wide">Nenhum registro de auditoria encontrado</p>
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
