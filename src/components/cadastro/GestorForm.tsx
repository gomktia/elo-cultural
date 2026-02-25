'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Briefcase, Hash } from 'lucide-react'

interface GestorFormProps {
  form: {
    orgao_vinculado: string
    funcao_cargo: string
    matricula: string
  }
  onChange: (field: string, value: any) => void
}

export function GestorForm({ form, onChange }: GestorFormProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
          <Building2 className="h-3 w-3" /> Orgao Vinculado
        </Label>
        <Input
          placeholder="Ex: Secretaria Municipal de Cultura"
          value={form.orgao_vinculado}
          onChange={e => onChange('orgao_vinculado', e.target.value)}
          required
          className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Briefcase className="h-3 w-3" /> Funcao / Cargo
          </Label>
          <Input
            placeholder="Ex: Coordenador de Editais"
            value={form.funcao_cargo}
            onChange={e => onChange('funcao_cargo', e.target.value)}
            required
            className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-white/40 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Hash className="h-3 w-3" /> Matricula
          </Label>
          <Input
            placeholder="Numero de matricula"
            value={form.matricula}
            onChange={e => onChange('matricula', e.target.value)}
            className="h-11 rounded-2xl border-white/5 bg-white/[0.02] text-sm text-white placeholder:text-white/10 focus:ring-2 focus:ring-[#0047AB]/40"
          />
        </div>
      </div>
    </div>
  )
}
