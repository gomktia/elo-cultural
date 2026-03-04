'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, X, GripVertical, Loader2, Save, ChevronUp, ChevronDown } from 'lucide-react'

interface CampoInscricao {
  id?: string
  label: string
  tipo: string
  obrigatorio: boolean
  opcoes: string[]
  placeholder: string
  ordem: number
}

interface FormBuilderManagerProps {
  editalId: string
  tenantId: string
}

const TIPOS_CAMPO = [
  { value: 'text', label: 'Texto curto' },
  { value: 'textarea', label: 'Texto longo' },
  { value: 'number', label: 'Número' },
  { value: 'select', label: 'Seleção' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'Arquivo' },
]

const PRESETS = [
  {
    label: 'Fomento Cultural',
    campos: [
      { label: 'Área Cultural', tipo: 'select', obrigatorio: true, opcoes: ['Artes Visuais', 'Música', 'Dança', 'Teatro', 'Literatura', 'Audiovisual', 'Patrimônio Cultural', 'Cultura Popular', 'Artesanato', 'Circo', 'Outros'], placeholder: '', ordem: 0 },
      { label: 'Público-alvo estimado', tipo: 'number', obrigatorio: true, opcoes: [], placeholder: 'Ex: 500', ordem: 1 },
      { label: 'Justificativa do Projeto', tipo: 'textarea', obrigatorio: true, opcoes: [], placeholder: 'Explique a relevância cultural do projeto...', ordem: 2 },
      { label: 'Contrapartida Social', tipo: 'textarea', obrigatorio: true, opcoes: [], placeholder: 'Descreva a contrapartida social oferecida...', ordem: 3 },
      { label: 'Acessibilidade', tipo: 'select', obrigatorio: true, opcoes: ['Sim, totalmente acessível', 'Parcialmente acessível', 'Não prevê acessibilidade'], placeholder: '', ordem: 4 },
    ]
  },
  {
    label: 'Premiação',
    campos: [
      { label: 'Área Cultural', tipo: 'select', obrigatorio: true, opcoes: ['Artes Visuais', 'Música', 'Dança', 'Teatro', 'Literatura', 'Audiovisual', 'Cultura Popular', 'Outros'], placeholder: '', ordem: 0 },
      { label: 'Breve currículo artístico', tipo: 'textarea', obrigatorio: true, opcoes: [], placeholder: 'Descreva sua trajetória artística...', ordem: 1 },
      { label: 'Link para portfólio', tipo: 'text', obrigatorio: false, opcoes: [], placeholder: 'https://...', ordem: 2 },
    ]
  },
]

export function FormBuilderManager({ editalId, tenantId }: FormBuilderManagerProps) {
  const [campos, setCampos] = useState<CampoInscricao[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCampos()
  }, [editalId])

  async function loadCampos() {
    const supabase = createClient()
    const { data } = await supabase
      .from('edital_campos_inscricao')
      .select('*')
      .eq('edital_id', editalId)
      .order('ordem')

    if (data) {
      setCampos(data.map(c => ({
        id: c.id,
        label: c.label,
        tipo: c.tipo,
        obrigatorio: c.obrigatorio,
        opcoes: c.opcoes || [],
        placeholder: c.placeholder || '',
        ordem: c.ordem,
      })))
    }
    setLoading(false)
  }

  function addCampo() {
    setCampos(prev => [...prev, {
      label: '',
      tipo: 'text',
      obrigatorio: false,
      opcoes: [],
      placeholder: '',
      ordem: prev.length,
    }])
  }

  function removeCampo(idx: number) {
    setCampos(prev => prev.filter((_, i) => i !== idx))
  }

  function updateCampo(idx: number, field: keyof CampoInscricao, value: any) {
    setCampos(prev => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  function moveCampo(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= campos.length) return
    setCampos(prev => {
      const updated = [...prev]
      ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
      return updated.map((c, i) => ({ ...c, ordem: i }))
    })
  }

  function applyPreset(preset: typeof PRESETS[0]) {
    if (campos.length > 0 && !confirm('Isso substituirá os campos atuais. Continuar?')) return
    setCampos(preset.campos.map((c, i) => ({ ...c, ordem: i })))
  }

  async function salvar() {
    const camposValidos = campos.filter(c => c.label.trim())
    if (camposValidos.length === 0 && campos.length > 0) {
      toast.error('Preencha o nome de todos os campos.')
      return
    }

    setSaving(true)
    const supabase = createClient()

    // Delete existing
    await supabase.from('edital_campos_inscricao').delete().eq('edital_id', editalId)

    // Insert new
    if (camposValidos.length > 0) {
      const rows = camposValidos.map((c, i) => ({
        edital_id: editalId,
        tenant_id: tenantId,
        label: c.label,
        tipo: c.tipo,
        obrigatorio: c.obrigatorio,
        opcoes: c.opcoes.filter(o => o.trim()),
        placeholder: c.placeholder || null,
        ordem: i,
      }))

      const { error } = await supabase.from('edital_campos_inscricao').insert(rows)
      if (error) {
        toast.error('Erro ao salvar: ' + error.message)
        setSaving(false)
        return
      }
    }

    toast.success('Formulário salvo com sucesso!')
    setSaving(false)
    loadCampos()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Modelos:</span>
        {PRESETS.map(p => (
          <Button
            key={p.label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-lg text-[11px] h-7"
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {/* Campos */}
      {campos.length === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
          <p className="text-sm text-slate-400 mb-2">Nenhum campo customizado configurado.</p>
          <p className="text-[11px] text-slate-300">O formulário usará apenas os campos padrão (título, resumo, etc.).</p>
        </div>
      )}

      <div className="space-y-3">
        {campos.map((campo, idx) => (
          <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 group hover:border-[var(--brand-primary)]/20 transition-colors">
            <div className="flex items-center gap-2">
              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => moveCampo(idx, -1)} className="text-slate-300 hover:text-slate-600 disabled:opacity-20" disabled={idx === 0}>
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => moveCampo(idx, 1)} className="text-slate-300 hover:text-slate-600 disabled:opacity-20" disabled={idx === campos.length - 1}>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>
              <Badge className="bg-slate-100 text-slate-400 border-none text-[10px] px-1.5 py-0">{idx + 1}</Badge>
              <Input
                placeholder="Nome do campo"
                value={campo.label}
                onChange={e => updateCampo(idx, 'label', e.target.value)}
                className="h-8 rounded-lg border-slate-200 text-sm font-medium flex-1"
              />
              <select
                value={campo.tipo}
                onChange={e => updateCampo(idx, 'tipo', e.target.value)}
                className="h-8 rounded-lg border border-slate-200 bg-white text-xs px-2 w-32"
              >
                {TIPOS_CAMPO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={campo.obrigatorio}
                  onChange={e => updateCampo(idx, 'obrigatorio', e.target.checked)}
                  className="rounded"
                />
                <span className="text-[11px] text-slate-500 whitespace-nowrap">Obrigatório</span>
              </label>
              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => removeCampo(idx)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Placeholder */}
            {(campo.tipo === 'text' || campo.tipo === 'textarea' || campo.tipo === 'number') && (
              <Input
                placeholder="Texto de placeholder (opcional)"
                value={campo.placeholder}
                onChange={e => updateCampo(idx, 'placeholder', e.target.value)}
                className="h-7 rounded-lg border-slate-100 text-xs ml-8"
              />
            )}

            {/* Opções para select */}
            {campo.tipo === 'select' && (
              <div className="ml-8 space-y-2">
                <Label className="text-[11px] text-slate-400">Opções (uma por linha):</Label>
                <textarea
                  value={campo.opcoes.join('\n')}
                  onChange={e => updateCampo(idx, 'opcoes', e.target.value.split('\n'))}
                  rows={3}
                  placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                  className="w-full rounded-lg border border-slate-100 bg-slate-50/50 text-xs p-2 resize-none"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" size="sm" className="rounded-lg text-[11px] h-8 gap-1.5" onClick={addCampo}>
          <Plus className="h-3 w-3" /> Novo Campo
        </Button>
        <Button
          type="button"
          size="sm"
          className="rounded-lg text-[11px] h-8 gap-1.5 bg-[var(--brand-primary)] text-white"
          onClick={salvar}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar Formulário
        </Button>
      </div>
    </div>
  )
}
