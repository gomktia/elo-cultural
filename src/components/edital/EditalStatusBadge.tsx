import type { FaseEdital } from '@/types/database.types'

const faseConfig: Record<FaseEdital, { label: string; className: string }> = {
  criacao: { label: 'Criacao', className: 'bg-slate-50 text-slate-600 border-slate-100' },
  publicacao: { label: 'Publicado', className: 'bg-blue-50 text-[var(--brand-primary)] border-blue-100' },
  inscricao: { label: 'Inscricoes Abertas', className: 'bg-green-50 text-[var(--brand-success)] border-green-100' },
  inscricao_encerrada: { label: 'Inscricoes Encerradas', className: 'bg-pink-50 text-[var(--brand-secondary)] border-pink-100' },
  divulgacao_inscritos: { label: 'Divulgacao Inscritos', className: 'bg-orange-50 text-[var(--brand-warning)] border-orange-100' },
  recurso_divulgacao_inscritos: { label: 'Recurso Divulgacao', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  habilitacao: { label: 'Habilitacao', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  resultado_preliminar_habilitacao: { label: 'Res. Preliminar Hab.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  recurso_habilitacao: { label: 'Recurso Hab.', className: 'bg-pink-100 text-[var(--brand-secondary)] border-pink-200' },
  resultado_definitivo_habilitacao: { label: 'Res. Definitivo Hab.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  avaliacao_tecnica: { label: 'Avaliacao Tecnica', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  resultado_preliminar_avaliacao: { label: 'Res. Preliminar Aval.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  recurso_avaliacao: { label: 'Recurso Aval.', className: 'bg-pink-100 text-[var(--brand-secondary)] border-pink-200' },
  resultado_final: { label: 'Resultado Final', className: 'bg-green-100 text-[var(--brand-success)] border-green-200' },
  homologacao: { label: 'Homologado', className: 'bg-green-50 text-[var(--brand-success)] border-green-100' },
  arquivamento: { label: 'Arquivado', className: 'bg-slate-50 text-slate-400 border-slate-100' },
}

export function EditalStatusBadge({ status }: { status: FaseEdital }) {
  const config = faseConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={[
      'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide whitespace-nowrap',
      config.className,
    ].join(' ')}>
      {config.label}
    </span>
  )
}
