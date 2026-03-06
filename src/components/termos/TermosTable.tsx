'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Eye, FileText, Pen } from 'lucide-react'
import type { TermoWithProjeto } from '@/types/database.types'

const statusConfig: Record<string, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600' },
  pendente_assinatura_proponente: { label: 'Aguardando Proponente', className: 'bg-amber-50 text-amber-700' },
  pendente_assinatura_gestor: { label: 'Aguardando Gestor', className: 'bg-blue-50 text-blue-700' },
  assinado: { label: 'Assinado', className: 'bg-green-50 text-green-700' },
  vigente: { label: 'Vigente', className: 'bg-emerald-50 text-emerald-700' },
  encerrado: { label: 'Encerrado', className: 'bg-slate-100 text-slate-500' },
  rescindido: { label: 'Rescindido', className: 'bg-red-50 text-red-600' },
}

interface TermosTableProps {
  termos: TermoWithProjeto[]
  editalId: string
}

export function TermosTable({ termos, editalId }: TermosTableProps) {
  if (termos.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <FileText className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 mb-1">Nenhum termo gerado</h3>
          <p className="text-sm text-slate-500 font-normal max-w-md mx-auto">
            Os termos de execução cultural são gerados após a homologação do resultado final.
            Clique em &quot;Gerar Termos&quot; para criar os termos dos projetos selecionados.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Nº Termo</TableHead>
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Projeto</TableHead>
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Proponente</TableHead>
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Valor</TableHead>
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Status</TableHead>
            <TableHead className="text-[11px] font-medium text-slate-400 uppercase tracking-wide text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {termos.map((termo) => {
            const cfg = statusConfig[termo.status] || statusConfig.rascunho
            return (
              <TableRow key={termo.id} className="group">
                <TableCell className="font-mono text-xs font-semibold text-slate-700">
                  {termo.numero_termo}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 leading-tight">
                      {termo.projetos?.titulo || '—'}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {termo.projetos?.numero_protocolo || ''}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm text-slate-700">{termo.profiles?.nome || '—'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{termo.profiles?.cpf_cnpj || ''}</p>
                </TableCell>
                <TableCell className="text-sm font-semibold text-slate-900">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(termo.valor_total))}
                </TableCell>
                <TableCell>
                  <Badge className={`${cfg.className} border-none text-[11px] font-medium px-2.5 py-0.5 rounded-lg`}>
                    {cfg.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/admin/editais/${editalId}/termos/${termo.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-[var(--brand-primary)]">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    {termo.status === 'rascunho' && (
                      <Link href={`/admin/editais/${editalId}/termos/${termo.id}/editar`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-[var(--brand-primary)]">
                          <Pen className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
