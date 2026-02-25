import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EditalStatusBadge } from './EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { Calendar, AlertTriangle, Scale, FileText } from 'lucide-react'
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

const moodRing: Record<string, string> = {
  open: 'ring-1 ring-[var(--brand-success)]/40 shadow-lg shadow-[var(--brand-success)]/10',
  closing: 'ring-1 ring-[var(--brand-warning)]/50 shadow-lg shadow-[var(--brand-warning)]/10',
  recurso: 'ring-1 ring-[var(--brand-primary)]/40 shadow-lg shadow-[var(--brand-primary)]/10',
  default: 'shadow-sm hover:shadow-md',
}

const moodAccent: Record<string, string> = {
  open: 'bg-[var(--brand-success)]',
  closing: 'bg-[var(--brand-warning)]',
  recurso: 'bg-[var(--brand-primary)]',
  default: '',
}

export function EditalCard({ edital, href }: EditalCardProps) {
  const mood = getMood(edital)
  const daysLeft = edital.fim_inscricao
    ? differenceInDays(new Date(edital.fim_inscricao), new Date())
    : null

  return (
    <Link href={href} className="block group">
      <div className="relative h-full bg-white border border-slate-100 rounded-2xl md:rounded-[40px] p-5 md:p-8 shadow-sm group-hover:shadow-premium transition-all duration-500 group-hover:-translate-y-2 overflow-hidden flex flex-col justify-between min-h-[280px] md:min-h-[320px]">
        {/* Mood Accent Layer */}
        {mood !== 'default' && (
          <div className={`absolute top-0 left-0 right-0 h-1.5 md:h-2 ${moodAccent[mood]} opacity-80`} />
        )}

        {/* Background Decorative Element */}
        <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
          <FileText className="h-32 w-32 md:h-40 md:w-40 text-slate-900" />
        </div>

        <div className="relative z-10 space-y-3 md:space-y-4">
          <div className="flex items-start justify-between gap-4">
            <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50 px-2 py-1 rounded-lg">
              {edital.numero_edital}
            </span>
            <EditalStatusBadge status={edital.status} />
          </div>

          <h3 className="text-xl md:text-2xl font-[900] text-slate-900 leading-tight tracking-tight group-hover:text-[var(--brand-primary)] transition-colors">
            {edital.titulo}
          </h3>

          {edital.descricao && (
            <p className="text-xs md:text-sm text-slate-500 line-clamp-3 leading-relaxed font-medium italic">
              "{edital.descricao}"
            </p>
          )}
        </div>

        <div className="relative z-10 pt-6 flex items-center justify-between gap-4 flex-wrap mt-auto">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand-primary/5 group-hover:text-brand-primary transition-colors">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Prazo Final</span>
              <span className="text-[10px] md:text-xs font-black text-slate-900 uppercase">
                {edital.fim_inscricao ? format(new Date(edital.fim_inscricao), 'dd MMM yyyy', { locale: ptBR }) : 'A definir'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {mood === 'closing' && daysLeft !== null && daysLeft >= 0 && (
              <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 md:px-3 py-1 md:py-1.5 rounded-xl border border-amber-100 shadow-sm animate-pulse">
                <AlertTriangle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                {daysLeft === 0 ? 'Expira hoje' : `${daysLeft}d restantes`}
              </span>
            )}

            {mood === 'recurso' && (
              <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 md:px-3 py-1 md:py-1.5 rounded-xl border border-blue-100 shadow-sm">
                <Scale className="h-2.5 w-2.5 md:h-3 md:w-3" />
                Recursos
              </span>
            )}

            <div className="h-9 w-9 md:h-10 md:w-10 rounded-xl bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-lg shadow-blue-200/40 group-hover:opacity-90 transition-all active:scale-90">
              <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
