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
        <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
          <Building2 className="h-3 w-3" /> Órgão Vinculado
        </Label>
        <Input
          placeholder="Ex: Secretaria Municipal de Cultura"
          value={form.orgao_vinculado}
          onChange={e => onChange('orgao_vinculado', e.target.value)}
          required
          className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#0047AB]/20"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Briefcase className="h-3 w-3" /> Função / Cargo
          </Label>
          <Input
            placeholder="Ex: Coordenador de Editais"
            value={form.funcao_cargo}
            onChange={e => onChange('funcao_cargo', e.target.value)}
            required
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#0047AB]/20"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Hash className="h-3 w-3" /> Matrícula
          </Label>
          <Input
            placeholder="Número de matrícula"
            value={form.matricula}
            onChange={e => onChange('matricula', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300 focus:ring-2 focus:ring-[#0047AB]/20"
          />
        </div>
      </div>
    </div>
  )
}
