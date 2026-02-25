import Link from 'next/link'
import { EditalStatusBadge } from './EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { Calendar, AlertTriangle, Scale } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditalCardProps {
  edital: Edital
  href: string
}

function getMood(edital: Edital): 'open' | 'closing' | 'recurso' | 'default' {
  const recursoStatuses = [
    'resultado_preliminar_habilitacao', 'recurso_habilitacao',
    'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  ]
  if (recursoStatuses.includes(edital.status)) return 'recurso'
  if (edital.status === 'inscricao') {
    if (edital.fim_inscricao) {
      const daysLeft = differenceInDays(new Date(edital.fim_inscricao), new Date())
      if (daysLeft <= 7) return 'closing'
    }
    return 'open'
  }
  return 'default'
}

const moodColors: Record<string, { accent: string; bg: string; glow: string }> = {
  open: { accent: '#77a80b', bg: 'rgba(119, 168, 11, 0.06)', glow: 'rgba(119, 168, 11, 0.15)' },
  closing: { accent: '#eeb513', bg: 'rgba(238, 181, 19, 0.06)', glow: 'rgba(238, 181, 19, 0.15)' },
  recurso: { accent: '#0047AB', bg: 'rgba(0, 71, 171, 0.06)', glow: 'rgba(0, 71, 171, 0.15)' },
  default: { accent: '#0047AB', bg: 'transparent', glow: 'transparent' },
}

export function EditalCard({ edital, href }: EditalCardProps) {
  const mood = getMood(edital)
  const colors = moodColors[mood]
  const daysLeft = edital.fim_inscricao
    ? differenceInDays(new Date(edital.fim_inscricao), new Date())
    : null

  return (
    <Link href={href} className="block group">
      <div className="relative h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md border border-slate-200 group-hover:border-slate-300 flex flex-col min-h-[260px]">
        {/* Colored accent bar — left side */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: colors.accent }}
        />

        {/* Card content */}
        <div className="p-5 md:p-6 pl-5 md:pl-7 flex flex-col flex-1">
          {/* Top row: number + status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <span
              className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg"
              style={{ color: colors.accent, backgroundColor: colors.bg }}
            >
              {edital.numero_edital}
            </span>
            <EditalStatusBadge status={edital.status} />
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 leading-snug tracking-tight group-hover:text-[var(--brand-primary)] transition-colors mb-3">
            {edital.titulo}
          </h3>

          {/* Description */}
          {edital.descricao && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-auto">
              {edital.descricao}
            </p>
          )}

          {/* Bottom row: deadline + badges */}
          <div className="pt-4 mt-auto flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-300" />
              <span className="text-xs font-medium text-slate-500">
                {edital.fim_inscricao ? format(new Date(edital.fim_inscricao), 'dd MMM yyyy', { locale: ptBR }) : 'A definir'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {mood === 'closing' && daysLeft !== null && daysLeft >= 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/60">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                </span>
              )}

              {mood === 'recurso' && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/[0.06] px-2 py-1 rounded-lg">
                  <Scale className="h-2.5 w-2.5" />
                  Recurso
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
