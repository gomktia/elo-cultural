'use client'

import { Badge } from '@/components/ui/badge'
import type { StatusPrestacao } from '@/types/database.types'

const statusConfig: Record<StatusPrestacao, { label: string; className: string }> = {
  rascunho: { label: 'Rascunho', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  enviada: { label: 'Enviada', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  em_analise: { label: 'Em Análise', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  aprovada: { label: 'Aprovada', className: 'bg-green-50 text-green-700 border-green-200' },
  reprovada: { label: 'Reprovada', className: 'bg-red-50 text-red-700 border-red-200' },
  com_pendencias: { label: 'Com Pendências', className: 'bg-orange-50 text-orange-700 border-orange-200' },
}

export function PrestacaoStatusBadge({ status }: { status: StatusPrestacao }) {
  const config = statusConfig[status] || statusConfig.rascunho
  return (
    <Badge variant="outline" className={`text-[11px] font-medium uppercase tracking-wide ${config.className}`}>
      {config.label}
    </Badge>
  )
}
