import Link from 'next/link'
import { EditalStatusBadge } from './EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { Calendar, AlertTriangle, Scale, ArrowUpRight } from 'lucide-react'
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
      <div className="relative h-full bg-white rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)] border border-slate-100 group-hover:border-slate-200/80 flex flex-col min-h-[280px] md:min-h-[310px]"
        style={{ boxShadow: `0 1px 3px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02)` }}
      >
        {/* Colored accent bar — left side */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 md:w-1.5 transition-all duration-500 group-hover:w-2"
          style={{ backgroundColor: colors.accent }}
        />

        {/* Hover glow effect */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: `radial-gradient(circle at top left, ${colors.glow}, transparent 60%)` }}
        />

        {/* Card content */}
        <div className="relative z-10 p-5 md:p-7 pl-6 md:pl-8 flex flex-col flex-1">
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
          <h3 className="text-base md:text-lg font-semibold text-slate-900 leading-snug tracking-tight group-hover:text-[var(--brand-primary)] transition-colors mb-3">
            {edital.titulo}
          </h3>

          {/* Description */}
          {edital.descricao && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-auto">
              {edital.descricao}
            </p>
          )}

          {/* Bottom row: deadline + action */}
          <div className="pt-5 mt-auto flex items-center justify-between gap-3 border-t border-slate-100 group-hover:border-slate-200/80 transition-colors">
            <div className="flex items-center gap-2.5">
              <Calendar className="h-4 w-4 text-slate-300" />
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-0.5">Prazo</span>
                <span className="text-xs font-medium text-slate-600">
                  {edital.fim_inscricao ? format(new Date(edital.fim_inscricao), 'dd MMM yyyy', { locale: ptBR }) : 'A definir'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {mood === 'closing' && daysLeft !== null && daysLeft >= 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/60 animate-pulse">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                </span>
              )}

              {mood === 'recurso' && (
                <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-[var(--brand-primary)] bg-[var(--brand-primary)]/[0.06] px-2 py-1 rounded-lg border border-[var(--brand-primary)]/10">
                  <Scale className="h-2.5 w-2.5" />
                  Recurso
                </span>
              )}

              <div
                className="h-8 w-8 md:h-9 md:w-9 rounded-xl flex items-center justify-center text-white shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg"
                style={{ backgroundColor: colors.accent }}
              >
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
