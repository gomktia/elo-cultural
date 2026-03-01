import { Badge } from '@/components/ui/badge'
import { Check, Clock, AlertCircle } from 'lucide-react'

const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  enviado: { label: 'Enviado', icon: Check, color: 'text-blue-600' },
  em_analise: { label: 'Em Análise', icon: Clock, color: 'text-yellow-600' },
  em_avaliacao: { label: 'Em Avaliação', icon: Clock, color: 'text-purple-600' },
  habilitado: { label: 'Habilitado', icon: Check, color: 'text-green-600' },
  inabilitado: { label: 'Inabilitado', icon: AlertCircle, color: 'text-red-600' },
  aprovado: { label: 'Aprovado', icon: Check, color: 'text-green-600' },
  reprovado: { label: 'Reprovado', icon: AlertCircle, color: 'text-red-600' },
  selecionado: { label: 'Selecionado', icon: Check, color: 'text-emerald-600' },
  suplente: { label: 'Suplente', icon: Clock, color: 'text-amber-600' },
}

interface StatusTrackerProps {
  status: string
}

export function StatusTracker({ status }: StatusTrackerProps) {
  const config = statusConfig[status] || { label: status, icon: Clock, color: 'text-muted-foreground' }
  const Icon = config.icon

  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${config.color}`} />
      <Badge variant="outline">{config.label}</Badge>
    </div>
  )
}
