'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Link2, Briefcase } from 'lucide-react'

const AREAS_AVALIACAO = [
  'Artes Visuais', 'Audiovisual', 'Circo', 'Danca', 'Design',
  'Fotografia', 'Literatura', 'Musica', 'Patrimonio Cultural',
  'Teatro', 'Culturas Populares', 'Culturas Indigenas',
  'Culturas Afro-brasileiras', 'Artesanato', 'Gestao Cultural',
  'Politicas Culturais', 'Economia Criativa',
]

interface AvaliadorFormProps {
  form: {
    curriculo_descricao: string
    areas_avaliacao: string[]
    lattes_url: string
  }
  onChange: (field: string, value: any) => void
}

export function AvaliadorForm({ form, onChange }: AvaliadorFormProps) {
  function toggleArea(area: string) {
    const current = form.areas_avaliacao || []
    if (current.includes(area)) {
      onChange('areas_avaliacao', current.filter((a: string) => a !== area))
    } else {
      onChange('areas_avaliacao', [...current, area])
    }
  }

  return (
    <div className="space-y-6">
      {/* Curriculo */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <FileText className="h-3 w-3" /> Descricao do Curriculo
        </Label>
        <Textarea
          placeholder="Descreva sua experiencia e formacao na area cultural..."
          value={form.curriculo_descricao}
          onChange={e => onChange('curriculo_descricao', e.target.value)}
          rows={4}
          className="rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40"
        />
      </div>

      {/* Areas de Avaliacao */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <Briefcase className="h-3 w-3" /> Areas de Atuacao / Avaliacao
        </Label>
        <div className="flex flex-wrap gap-2">
          {AREAS_AVALIACAO.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={[
                'px-3 py-1.5 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all border',
                form.areas_avaliacao?.includes(area)
                  ? 'bg-[#0047AB] text-white border-[#0047AB]'
                  : 'bg-white/[0.02] text-white/40 border-white/10 hover:border-white/20'
              ].join(' ')}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Lattes */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <Link2 className="h-3 w-3" /> Link do Curriculo Lattes
        </Label>
        <Input
          placeholder="http://lattes.cnpq.br/..."
          value={form.lattes_url}
          onChange={e => onChange('lattes_url', e.target.value)}
          className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10"
        />
      </div>
    </div>
  )
}
