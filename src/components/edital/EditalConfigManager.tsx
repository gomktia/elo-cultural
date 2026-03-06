'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Plus, X, GripVertical, Trophy, ShieldCheck, MapPin, Star } from 'lucide-react'

// ── Types ──

export interface CategoriaItem {
  id?: string
  nome: string
  vagas: number
}

export interface CotaItem {
  nome: string
  percentual: number
  campo_perfil: string
  valor?: string
}

export interface PontuacaoExtraItem {
  grupo: string
  pontos: number
  campo_perfil: string
  valor: string
}

export interface ReservaVagasItem {
  regiao: string
  vagas: number
}

export interface EditalConfig {
  tipo_edital: string
  categorias: CategoriaItem[]
  config_cotas: CotaItem[]
  config_desempate: string[]
  config_pontuacao_extra: PontuacaoExtraItem[]
  config_reserva_vagas: ReservaVagasItem[]
}

interface EditalConfigManagerProps {
  config: EditalConfig
  onChange: (config: EditalConfig) => void
}

const TIPOS_EDITAL = [
  { value: 'fomento', label: 'Fomento' },
  { value: 'premiacao', label: 'Premiação' },
  { value: 'credenciamento', label: 'Credenciamento' },
  { value: 'chamamento_publico', label: 'Chamamento Público' },
  { value: 'outros', label: 'Outros' },
]

const CAMPOS_PERFIL = [
  { value: 'genero', label: 'Gênero' },
  { value: 'orientacao_sexual', label: 'Orientação Sexual' },
  { value: 'raca_etnia', label: 'Raça/Etnia' },
  { value: 'pcd', label: 'PcD' },
  { value: 'renda', label: 'Renda' },
  { value: 'municipio', label: 'Município' },
]

const CRITERIOS_DESEMPATE = [
  { value: 'maior_idade', label: 'Maior idade' },
  { value: 'mulher', label: 'Mulher' },
  { value: 'negro', label: 'Negro/a' },
  { value: 'indigena', label: 'Indígena' },
  { value: 'pcd', label: 'Pessoa com deficiência' },
  { value: 'lgbtqiapn', label: 'LGBTQIAPN+' },
  { value: 'menor_renda', label: 'Menor renda' },
  { value: 'maior_nota_tecnica', label: 'Maior nota técnica' },
  { value: 'inscricao_anterior', label: 'Inscrição mais antiga' },
  { value: 'sorteio', label: 'Sorteio (hash determinístico)' },
]

const labelClass = 'text-xs font-medium text-slate-400 uppercase tracking-wide ml-1'
const cardSection = 'p-4 rounded-xl border border-slate-200 bg-slate-50/30 space-y-3'

export function EditalConfigManager({ config, onChange }: EditalConfigManagerProps) {
  function update<K extends keyof EditalConfig>(key: K, value: EditalConfig[K]) {
    onChange({ ...config, [key]: value })
  }

  // ── Categorias ──
  function addCategoria() {
    update('categorias', [...config.categorias, { nome: '', vagas: 0 }])
  }
  function removeCategoria(idx: number) {
    update('categorias', config.categorias.filter((_, i) => i !== idx))
  }
  function updateCategoria(idx: number, field: keyof CategoriaItem, value: string | number) {
    const updated = [...config.categorias]
    updated[idx] = { ...updated[idx], [field]: value }
    update('categorias', updated)
  }

  // ── Cotas ──
  function addCota() {
    update('config_cotas', [...config.config_cotas, { nome: '', percentual: 0, campo_perfil: 'genero' }])
  }
  function removeCota(idx: number) {
    update('config_cotas', config.config_cotas.filter((_, i) => i !== idx))
  }
  function updateCota(idx: number, field: keyof CotaItem, value: string | number) {
    const updated = [...config.config_cotas]
    updated[idx] = { ...updated[idx], [field]: value }
    update('config_cotas', updated)
  }

  // ── Pontuação Extra ──
  function addPontuacao() {
    update('config_pontuacao_extra', [...config.config_pontuacao_extra, { grupo: '', pontos: 0, campo_perfil: 'genero', valor: '' }])
  }
  function removePontuacao(idx: number) {
    update('config_pontuacao_extra', config.config_pontuacao_extra.filter((_, i) => i !== idx))
  }
  function updatePontuacao(idx: number, field: keyof PontuacaoExtraItem, value: string | number) {
    const updated = [...config.config_pontuacao_extra]
    updated[idx] = { ...updated[idx], [field]: value }
    update('config_pontuacao_extra', updated)
  }

  // ── Reserva de Vagas ──
  function addReserva() {
    update('config_reserva_vagas', [...config.config_reserva_vagas, { regiao: '', vagas: 0 }])
  }
  function removeReserva(idx: number) {
    update('config_reserva_vagas', config.config_reserva_vagas.filter((_, i) => i !== idx))
  }
  function updateReserva(idx: number, field: keyof ReservaVagasItem, value: string | number) {
    const updated = [...config.config_reserva_vagas]
    updated[idx] = { ...updated[idx], [field]: value }
    update('config_reserva_vagas', updated)
  }

  // ── Desempate ──
  function toggleDesempate(criterio: string) {
    const current = config.config_desempate
    if (current.includes(criterio)) {
      update('config_desempate', current.filter(c => c !== criterio))
    } else {
      update('config_desempate', [...current, criterio])
    }
  }
  function moveDesempate(idx: number, dir: -1 | 1) {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= config.config_desempate.length) return
    const updated = [...config.config_desempate]
    ;[updated[idx], updated[newIdx]] = [updated[newIdx], updated[idx]]
    update('config_desempate', updated)
  }

  return (
    <div className="space-y-6">
      {/* Tipo de Edital */}
      <div className={cardSection}>
        <div className="flex items-center gap-2 mb-1">
          <Trophy className="h-4 w-4 text-[var(--brand-primary)]" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Tipo de Edital</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {TIPOS_EDITAL.map(t => (
            <Button
              key={t.value}
              type="button"
              variant={config.tipo_edital === t.value ? 'default' : 'outline'}
              size="sm"
              className="rounded-lg text-[11px] h-8 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]"
              onClick={() => update('tipo_edital', t.value)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Categorias de Seleção */}
      <div className={cardSection}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Categorias de Seleção</h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-lg text-[11px] h-7 gap-1 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={addCategoria}>
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        {config.categorias.length === 0 && (
          <p className="text-[11px] text-slate-400 italic">Sem categorias — todos os projetos concorrem juntos.</p>
        )}
        {config.categorias.map((cat, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              placeholder="Nome da categoria"
              value={cat.nome}
              onChange={e => updateCategoria(idx, 'nome', e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm flex-1"
            />
            <div className="flex items-center gap-1">
              <Label className="text-[11px] text-slate-400 whitespace-nowrap">Vagas:</Label>
              <Input
                type="number"
                min={0}
                value={cat.vagas}
                onChange={e => updateCategoria(idx, 'vagas', parseInt(e.target.value) || 0)}
                className="h-8 w-20 rounded-lg border-slate-200 text-sm text-center"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => removeCategoria(idx)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Cotas */}
      <div className={cardSection}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Cotas</h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-lg text-[11px] h-7 gap-1 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={addCota}>
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        {config.config_cotas.length === 0 && (
          <p className="text-[11px] text-slate-400 italic">Sem cotas configuradas.</p>
        )}
        {config.config_cotas.map((cota, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Nome (ex: LGBTQIAPN+)"
              value={cota.nome}
              onChange={e => updateCota(idx, 'nome', e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm flex-1 min-w-[140px]"
            />
            <div className="flex items-center gap-1">
              <Input
                type="number"
                min={0}
                max={100}
                value={cota.percentual}
                onChange={e => updateCota(idx, 'percentual', parseInt(e.target.value) || 0)}
                className="h-8 w-16 rounded-lg border-slate-200 text-sm text-center"
              />
              <span className="text-xs text-slate-400">%</span>
            </div>
            <select
              value={cota.campo_perfil}
              onChange={e => updateCota(idx, 'campo_perfil', e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white text-xs px-2"
            >
              {CAMPOS_PERFIL.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => removeCota(idx)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Pontuação Extra */}
      <div className={cardSection}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-[var(--brand-primary)]" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Pontuação Extra (Ações Afirmativas)</h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-lg text-[11px] h-7 gap-1 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={addPontuacao}>
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        {config.config_pontuacao_extra.length === 0 && (
          <p className="text-[11px] text-slate-400 italic">Sem pontuação extra configurada.</p>
        )}
        {config.config_pontuacao_extra.map((p, idx) => (
          <div key={idx} className="flex items-center gap-2 flex-wrap">
            <Input
              placeholder="Grupo (ex: Mulheres)"
              value={p.grupo}
              onChange={e => updatePontuacao(idx, 'grupo', e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm flex-1 min-w-[120px]"
            />
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">+</span>
              <Input
                type="number"
                min={0}
                value={p.pontos}
                onChange={e => updatePontuacao(idx, 'pontos', parseFloat(e.target.value) || 0)}
                className="h-8 w-16 rounded-lg border-slate-200 text-sm text-center"
              />
              <span className="text-xs text-slate-400">pts</span>
            </div>
            <select
              value={p.campo_perfil}
              onChange={e => updatePontuacao(idx, 'campo_perfil', e.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-white text-xs px-2"
            >
              {CAMPOS_PERFIL.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Input
              placeholder="Valor (ex: feminino)"
              value={p.valor}
              onChange={e => updatePontuacao(idx, 'valor', e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm w-32"
            />
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => removePontuacao(idx)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {/* Critérios de Desempate */}
      <div className={cardSection}>
        <div className="flex items-center gap-2 mb-1">
          <GripVertical className="h-4 w-4 text-slate-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Critérios de Desempate (em ordem)</h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CRITERIOS_DESEMPATE.map(c => {
            const isSelected = config.config_desempate.includes(c.value)
            const position = config.config_desempate.indexOf(c.value)
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleDesempate(c.value)}
                className={[
                  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all',
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-[var(--brand-primary)]/30'
                ].join(' ')}
              >
                {isSelected && <span className="text-[10px] font-bold opacity-60">{position + 1}º</span>}
                {c.label}
              </button>
            )
          })}
        </div>
        {config.config_desempate.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 mr-1">Ordem:</span>
            {config.config_desempate.map((val, idx) => {
              const label = CRITERIOS_DESEMPATE.find(c => c.value === val)?.label || val
              return (
                <div key={val} className="flex items-center gap-0.5">
                  <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[10px] font-semibold px-1.5 py-0">
                    {idx + 1}º {label}
                  </Badge>
                  <div className="flex flex-col">
                    {idx > 0 && (
                      <button type="button" onClick={() => moveDesempate(idx, -1)} className="text-[9px] text-slate-300 hover:text-slate-600 leading-none">▲</button>
                    )}
                    {idx < config.config_desempate.length - 1 && (
                      <button type="button" onClick={() => moveDesempate(idx, 1)} className="text-[9px] text-slate-300 hover:text-slate-600 leading-none">▼</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Reserva de Vagas Regionais */}
      <div className={cardSection}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-rose-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">Reserva de Vagas Regionais</h3>
          </div>
          <Button type="button" variant="outline" size="sm" className="rounded-lg text-[11px] h-7 gap-1 border-slate-200 shadow-none hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 hover:text-[var(--brand-primary)]" onClick={addReserva}>
            <Plus className="h-3 w-3" /> Adicionar
          </Button>
        </div>
        {config.config_reserva_vagas.length === 0 && (
          <p className="text-[11px] text-slate-400 italic">Sem reserva de vagas regionais.</p>
        )}
        {config.config_reserva_vagas.map((r, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              placeholder="Região (ex: Zona Norte, Distrito Rural)"
              value={r.regiao}
              onChange={e => updateReserva(idx, 'regiao', e.target.value)}
              className="h-8 rounded-lg border-slate-200 text-sm flex-1"
            />
            <div className="flex items-center gap-1">
              <Label className="text-[11px] text-slate-400 whitespace-nowrap">Vagas:</Label>
              <Input
                type="number"
                min={0}
                value={r.vagas}
                onChange={e => updateReserva(idx, 'vagas', parseInt(e.target.value) || 0)}
                className="h-8 w-20 rounded-lg border-slate-200 text-sm text-center"
              />
            </div>
            <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500" onClick={() => removeReserva(idx)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
