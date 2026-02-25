'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Briefcase, Heart } from 'lucide-react'

const AREAS_ATUACAO = [
  'Artes Visuais', 'Audiovisual', 'Circo', 'Danca', 'Design',
  'Fotografia', 'Literatura', 'Musica', 'Patrimonio Cultural',
  'Teatro', 'Culturas Populares', 'Culturas Indigenas',
  'Culturas Afro-brasileiras', 'Artesanato', 'Moda', 'Gastronomia',
]

const TEMPO_OPCOES = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos']
const RENDA_OPCOES = ['Ate 1 salario minimo', '1 a 2 salarios', '2 a 3 salarios', '3 a 5 salarios', 'Acima de 5 salarios']
const GENERO_OPCOES = ['Masculino', 'Feminino', 'Nao-binario', 'Transgenero', 'Prefiro nao informar', 'Outro']
const ORIENTACAO_OPCOES = ['Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual', 'Assexual', 'Prefiro nao informar', 'Outro']
const RACA_OPCOES = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indigena', 'Prefiro nao informar']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

interface ProponenteFormProps {
  form: {
    areas_atuacao: string[]
    tempo_atuacao: string
    renda: string
    genero: string
    orientacao_sexual: string
    raca_etnia: string
    pcd: boolean
    endereco_completo: string
    municipio: string
    estado: string
  }
  onChange: (field: string, value: any) => void
}

export function ProponenteForm({ form, onChange }: ProponenteFormProps) {
  function toggleArea(area: string) {
    const current = form.areas_atuacao || []
    if (current.includes(area)) {
      onChange('areas_atuacao', current.filter((a: string) => a !== area))
    } else {
      onChange('areas_atuacao', [...current, area])
    }
  }

  return (
    <div className="space-y-6">
      {/* Areas de Atuacao */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <Briefcase className="h-3 w-3" /> Areas de Atuacao Cultural
        </Label>
        <div className="flex flex-wrap gap-2">
          {AREAS_ATUACAO.map(area => (
            <button
              key={area}
              type="button"
              onClick={() => toggleArea(area)}
              className={[
                'px-3 py-1.5 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all border',
                form.areas_atuacao?.includes(area)
                  ? 'bg-[#0047AB] text-white border-[#0047AB]'
                  : 'bg-white/[0.02] text-white/40 border-white/10 hover:border-white/20'
              ].join(' ')}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Tempo de Atuacao */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Tempo de Atuacao</Label>
          <Select value={form.tempo_atuacao} onValueChange={v => onChange('tempo_atuacao', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Renda */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Faixa de Renda</Label>
          <Select value={form.renda} onValueChange={v => onChange('renda', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {RENDA_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Genero */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Heart className="h-3 w-3" /> Genero
          </Label>
          <Select value={form.genero} onValueChange={v => onChange('genero', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {GENERO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Orientacao Sexual */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Orientacao Sexual</Label>
          <Select value={form.orientacao_sexual} onValueChange={v => onChange('orientacao_sexual', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {ORIENTACAO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Raca/Etnia */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Raca / Etnia</Label>
          <Select value={form.raca_etnia} onValueChange={v => onChange('raca_etnia', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {RACA_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* PCD */}
        <div className="space-y-2 flex items-end">
          <div className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5 w-full h-11">
            <input
              type="checkbox"
              id="pcd"
              checked={form.pcd}
              onChange={e => onChange('pcd', e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-white/5 text-[#0047AB]"
            />
            <Label htmlFor="pcd" className="text-xs text-white/60 font-bold cursor-pointer">Pessoa com Deficiencia (PcD)</Label>
          </div>
        </div>
      </div>

      {/* Endereco */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Endereco
        </Label>
        <Input
          placeholder="Endereco completo"
          value={form.endereco_completo}
          onChange={e => onChange('endereco_completo', e.target.value)}
          className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Municipio</Label>
          <Input
            placeholder="Cidade"
            value={form.municipio}
            onChange={e => onChange('municipio', e.target.value)}
            className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1">Estado</Label>
          <Select value={form.estado} onValueChange={v => onChange('estado', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
