import type { FaseEdital } from '@/types/database.types'

const faseConfig: Record<FaseEdital, { label: string; className: string }> = {
  criacao: { label: 'Criação', className: 'bg-slate-50 text-slate-600 border-slate-100' },
  publicacao: { label: 'Publicado', className: 'bg-blue-50 text-[#0047AB] border-blue-100' },
  inscricao: { label: 'Inscrições Abertas', className: 'bg-emerald-50 text-[#00C853] border-emerald-100' },
  inscricao_encerrada: { label: 'Inscrições Encerradas', className: 'bg-pink-50 text-[#FF1493] border-pink-100' },
  divulgacao_inscritos: { label: 'Divulgação Inscritos', className: 'bg-amber-50 text-amber-700 border-amber-100' },
  recurso_divulgacao_inscritos: { label: 'Recurso Divulgação', className: 'bg-amber-100 text-amber-800 border-amber-200' },
  habilitacao: { label: 'Habilitação', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  resultado_preliminar_habilitacao: { label: 'Res. Preliminar Hab.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  recurso_habilitacao: { label: 'Recurso Hab.', className: 'bg-pink-100 text-[#FF1493] border-pink-200' },
  resultado_definitivo_habilitacao: { label: 'Res. Definitivo Hab.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  avaliacao_tecnica: { label: 'Avaliação Técnica', className: 'bg-violet-50 text-violet-700 border-violet-100' },
  resultado_preliminar_avaliacao: { label: 'Res. Preliminar Aval.', className: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
  recurso_avaliacao: { label: 'Recurso Aval.', className: 'bg-pink-100 text-[#FF1493] border-pink-200' },
  resultado_final: { label: 'Resultado Final', className: 'bg-emerald-100 text-[#00C853] border-emerald-200' },
  homologacao: { label: 'Homologado', className: 'bg-emerald-50 text-[#00C853] border-emerald-100' },
  arquivamento: { label: 'Arquivado', className: 'bg-slate-50 text-slate-400 border-slate-100' },
}

export function EditalStatusBadge({ status }: { status: FaseEdital }) {
  const config = faseConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600 border-slate-200' }
  return (
    <span className={[
      'inline-flex items-center rounded-lg border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap',
      config.className,
    ].join(' ')}>
      {config.label}
    </span>
  )
}
