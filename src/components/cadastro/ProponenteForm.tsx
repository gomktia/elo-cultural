'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, Heart, GraduationCap, Users, Calendar, Building2, UserPlus, Trash2 } from 'lucide-react'

const AREAS_ATUACAO = [
  'Artes Visuais', 'Audiovisual', 'Circo', 'Dança', 'Design',
  'Fotografia', 'Literatura', 'Música', 'Patrimônio Cultural',
  'Teatro', 'Culturas Populares', 'Culturas Indígenas',
  'Culturas Afro-brasileiras', 'Artesanato', 'Moda', 'Gastronomia',
]

const TEMPO_OPCOES = ['Menos de 1 ano', '1 a 3 anos', '3 a 5 anos', '5 a 10 anos', 'Mais de 10 anos']
const RENDA_OPCOES = ['Até 1 salário mínimo', '1 a 2 salários', '2 a 3 salários', '3 a 5 salários', 'Acima de 5 salários']
const GENERO_OPCOES = ['Masculino', 'Feminino', 'Não-binário', 'Transgênero', 'Prefiro não informar', 'Outro']
const ORIENTACAO_OPCOES = ['Heterossexual', 'Homossexual', 'Bissexual', 'Pansexual', 'Assexual', 'Prefiro não informar', 'Outro']
const RACA_OPCOES = ['Branca', 'Preta', 'Parda', 'Amarela', 'Indígena', 'Prefiro não informar']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const TIPO_PESSOA_OPCOES = [
  { value: 'fisica', label: 'Pessoa Física' },
  { value: 'juridica', label: 'Pessoa Jurídica' },
  { value: 'coletivo_sem_cnpj', label: 'Coletivo sem CNPJ' },
]

const COMUNIDADE_OPCOES = [
  { value: 'nenhuma', label: 'Nenhuma' },
  { value: 'extrativistas', label: 'Extrativistas' },
  { value: 'ribeirinhas', label: 'Ribeirinhas' },
  { value: 'rurais', label: 'Rurais' },
  { value: 'indigenas', label: 'Indígenas' },
  { value: 'ciganos', label: 'Ciganos' },
  { value: 'pescadores', label: 'Pescadores Artesanais' },
  { value: 'terreiro', label: 'Povos de Terreiro' },
  { value: 'quilombolas', label: 'Quilombolas' },
  { value: 'outra', label: 'Outra' },
]

const TIPO_DEFICIENCIA_OPCOES = [
  { value: '', label: 'Selecione...' },
  { value: 'auditiva', label: 'Auditiva' },
  { value: 'fisica', label: 'Física' },
  { value: 'intelectual', label: 'Intelectual' },
  { value: 'multipla', label: 'Múltipla' },
  { value: 'visual', label: 'Visual' },
  { value: 'outra', label: 'Outra' },
]

const ESCOLARIDADE_OPCOES = [
  { value: 'sem_educacao_formal', label: 'Sem educação formal' },
  { value: 'fundamental_incompleto', label: 'Fundamental incompleto' },
  { value: 'fundamental_completo', label: 'Fundamental completo' },
  { value: 'medio_incompleto', label: 'Médio incompleto' },
  { value: 'medio_completo', label: 'Médio completo' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'superior_incompleto', label: 'Superior incompleto' },
  { value: 'superior_completo', label: 'Superior completo' },
  { value: 'pos_graduacao', label: 'Pós-graduação' },
]

const BENEFICIO_OPCOES = [
  { value: 'nenhum', label: 'Nenhum' },
  { value: 'bolsa_familia', label: 'Bolsa Família' },
  { value: 'bpc', label: 'BPC (Benefício de Prestação Continuada)' },
  { value: 'outro', label: 'Outro' },
]

const FUNCAO_CULTURAL_OPCOES = [
  { value: '', label: 'Selecione...' },
  { value: 'artista', label: 'Artista' },
  { value: 'instrutor', label: 'Instrutor / Oficineiro' },
  { value: 'curador', label: 'Curador' },
  { value: 'produtor', label: 'Produtor Cultural' },
  { value: 'gestor', label: 'Gestor Cultural' },
  { value: 'tecnico', label: 'Técnico' },
  { value: 'consultor', label: 'Consultor' },
  { value: 'outro', label: 'Outro' },
]

export interface ColetivoMembro {
  nome: string
  cpf: string
}

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
    tipo_pessoa: string
    nome_artistico: string
    data_nascimento: string
    comunidade_tradicional: string
    tipo_deficiencia: string
    escolaridade: string
    beneficiario_programa_social: string
    funcao_cultural: string
    // PJ fields (Fase 1.2)
    razao_social: string
    nome_fantasia: string
    endereco_sede: string
    representante_nome: string
    representante_cpf: string
    representante_genero: string
    representante_raca_etnia: string
    representante_pcd: boolean
    representante_escolaridade: string
    // Coletivo fields (Fase 1.3)
    nome_coletivo: string
    ano_criacao: string
    quantidade_membros: string
    portfolio: string
    membros: ColetivoMembro[]
  }
  onChange: (field: string, value: any) => void
}

function ColetivoSection({ form, onChange }: Pick<ProponenteFormProps, 'form' | 'onChange'>) {
  const [novoNome, setNovoNome] = useState('')
  const [novoCpf, setNovoCpf] = useState('')

  function addMembro() {
    if (!novoNome.trim()) return
    const membros = [...(form.membros || []), { nome: novoNome.trim(), cpf: novoCpf.trim() }]
    onChange('membros', membros)
    setNovoNome('')
    setNovoCpf('')
  }

  function removeMembro(index: number) {
    const membros = (form.membros || []).filter((_: ColetivoMembro, i: number) => i !== index)
    onChange('membros', membros)
  }

  return (
    <div className="space-y-5 p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30">
      <div className="flex items-center gap-2 mb-1">
        <Users className="h-3.5 w-3.5 text-emerald-500" />
        <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Dados do Coletivo</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome do Coletivo</Label>
          <Input
            placeholder="Nome do coletivo cultural"
            value={form.nome_coletivo || ''}
            onChange={e => onChange('nome_coletivo', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Ano de Criacao</Label>
          <Input
            type="number"
            placeholder="Ex: 2018"
            value={form.ano_criacao || ''}
            onChange={e => onChange('ano_criacao', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Quantidade de Membros</Label>
          <Input
            type="number"
            min={1}
            placeholder="Ex: 5"
            value={form.quantidade_membros || ''}
            onChange={e => onChange('quantidade_membros', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Portfolio / Historico do Coletivo</Label>
        <Textarea
          placeholder="Descreva brevemente o historico, atividades e portfolio do coletivo..."
          value={form.portfolio || ''}
          onChange={e => onChange('portfolio', e.target.value)}
          rows={3}
          className="rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300 resize-none"
        />
      </div>

      {/* Membros */}
      <div className="pt-3 border-t border-emerald-100">
        <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Membros do Coletivo</span>
      </div>

      {(form.membros || []).length > 0 && (
        <div className="space-y-2">
          {(form.membros || []).map((m: ColetivoMembro, i: number) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{m.nome}</p>
                {m.cpf && <p className="text-xs text-slate-400">{m.cpf}</p>}
              </div>
              <button type="button" onClick={() => removeMembro(i)} className="text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-3">
        <div className="flex-1 space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome</Label>
          <Input
            placeholder="Nome do membro"
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMembro())}
            className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
        <div className="flex-1 space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">CPF (opcional)</Label>
          <Input
            placeholder="000.000.000-00"
            value={novoCpf}
            onChange={e => setNovoCpf(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addMembro())}
            className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
        <Button type="button" onClick={addMembro} variant="outline" className="h-11 rounded-2xl border-emerald-200 text-emerald-600 hover:bg-emerald-50">
          <UserPlus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
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
      {/* Tipo de Pessoa + Nome Artístico */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Users className="h-3 w-3" /> Tipo de Pessoa
          </Label>
          <Select value={form.tipo_pessoa || 'fisica'} onValueChange={v => onChange('tipo_pessoa', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TIPO_PESSOA_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome Artístico / Social</Label>
          <Input
            placeholder="Nome artístico ou social (opcional)"
            value={form.nome_artistico || ''}
            onChange={e => onChange('nome_artistico', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* === PESSOA JURIDICA FIELDS (Fase 1.2) === */}
      {form.tipo_pessoa === 'juridica' && (
        <div className="space-y-5 p-5 rounded-2xl border border-blue-100 bg-blue-50/30">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Dados da Pessoa Juridica</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Razao Social</Label>
              <Input
                placeholder="Razao social da empresa"
                value={form.razao_social || ''}
                onChange={e => onChange('razao_social', e.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome Fantasia</Label>
              <Input
                placeholder="Nome fantasia (opcional)"
                value={form.nome_fantasia || ''}
                onChange={e => onChange('nome_fantasia', e.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Endereco da Sede</Label>
            <Input
              placeholder="Endereco completo da sede"
              value={form.endereco_sede || ''}
              onChange={e => onChange('endereco_sede', e.target.value)}
              className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
            />
          </div>

          {/* Representante Legal */}
          <div className="pt-3 border-t border-blue-100">
            <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Representante Legal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Nome Completo</Label>
              <Input
                placeholder="Nome do representante legal"
                value={form.representante_nome || ''}
                onChange={e => onChange('representante_nome', e.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">CPF</Label>
              <Input
                placeholder="000.000.000-00"
                value={form.representante_cpf || ''}
                onChange={e => onChange('representante_cpf', e.target.value)}
                className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-300"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Genero</Label>
              <Select value={form.representante_genero || ''} onValueChange={v => onChange('representante_genero', v)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {GENERO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Raca / Etnia</Label>
              <Select value={form.representante_raca_etnia || ''} onValueChange={v => onChange('representante_raca_etnia', v)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {RACA_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Escolaridade</Label>
              <Select value={form.representante_escolaridade || ''} onValueChange={v => onChange('representante_escolaridade', v)}>
                <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-white text-sm text-slate-900">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {ESCOLARIDADE_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 flex items-end">
              <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 w-full h-11">
                <input
                  type="checkbox"
                  id="representante_pcd"
                  checked={form.representante_pcd || false}
                  onChange={e => onChange('representante_pcd', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 bg-slate-50 text-[#0047AB]"
                />
                <Label htmlFor="representante_pcd" className="text-xs text-slate-600 font-medium cursor-pointer">PcD</Label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === COLETIVO SEM CNPJ FIELDS (Fase 1.3) === */}
      {form.tipo_pessoa === 'coletivo_sem_cnpj' && (
        <ColetivoSection form={form} onChange={onChange} />
      )}

      {/* Data Nascimento + Escolaridade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Calendar className="h-3 w-3" /> Data de Nascimento
          </Label>
          <Input
            type="date"
            value={form.data_nascimento || ''}
            onChange={e => onChange('data_nascimento', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <GraduationCap className="h-3 w-3" /> Escolaridade
          </Label>
          <Select value={form.escolaridade || ''} onValueChange={v => onChange('escolaridade', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {ESCOLARIDADE_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Areas de Atuacao */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
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
                  ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-sm'
                  : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
              ].join(' ')}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Funcao Cultural */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Funcao Cultural Principal</Label>
          <Select value={form.funcao_cultural || ''} onValueChange={v => onChange('funcao_cultural', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {FUNCAO_CULTURAL_OPCOES.filter(o => o.value).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Tempo de Atuacao */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Tempo de Atuacao</Label>
          <Select value={form.tempo_atuacao} onValueChange={v => onChange('tempo_atuacao', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Renda */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Faixa de Renda</Label>
          <Select value={form.renda} onValueChange={v => onChange('renda', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {RENDA_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Beneficio Social */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Beneficiario de Programa Social</Label>
          <Select value={form.beneficiario_programa_social || 'nenhum'} onValueChange={v => onChange('beneficiario_programa_social', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {BENEFICIO_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Genero */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
            <Heart className="h-3 w-3" /> Genero
          </Label>
          <Select value={form.genero} onValueChange={v => onChange('genero', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {GENERO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Orientacao Sexual */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Orientacao Sexual</Label>
          <Select value={form.orientacao_sexual} onValueChange={v => onChange('orientacao_sexual', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {ORIENTACAO_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Raca/Etnia */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Raca / Etnia</Label>
          <Select value={form.raca_etnia} onValueChange={v => onChange('raca_etnia', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {RACA_OPCOES.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Comunidade Tradicional */}
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Comunidade Tradicional</Label>
          <Select value={form.comunidade_tradicional || 'nenhuma'} onValueChange={v => onChange('comunidade_tradicional', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {COMUNIDADE_OPCOES.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* PCD */}
        <div className="space-y-2 flex items-end">
          <div className="flex items-center gap-3 bg-slate-50/50 p-3 rounded-2xl border border-slate-200 w-full h-11">
            <input
              type="checkbox"
              id="pcd"
              checked={form.pcd}
              onChange={e => onChange('pcd', e.target.checked)}
              className="h-4 w-4 rounded border-slate-200 bg-slate-50 text-[#0047AB]"
            />
            <Label htmlFor="pcd" className="text-xs text-slate-600 font-medium cursor-pointer">Pessoa com Deficiencia (PcD)</Label>
          </div>
        </div>

        {/* Tipo Deficiencia - condicional */}
        {form.pcd && (
          <div className="space-y-2">
            <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Tipo de Deficiencia</Label>
            <Select value={form.tipo_deficiencia || ''} onValueChange={v => onChange('tipo_deficiencia', v)}>
              <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {TIPO_DEFICIENCIA_OPCOES.filter(o => o.value).map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Endereco */}
      <div className="space-y-2">
        <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1 flex items-center gap-2">
          <MapPin className="h-3 w-3" /> Endereco
        </Label>
        <Input
          placeholder="Endereco completo"
          value={form.endereco_completo}
          onChange={e => onChange('endereco_completo', e.target.value)}
          className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Municipio</Label>
          <Input
            placeholder="Cidade"
            value={form.municipio}
            onChange={e => onChange('municipio', e.target.value)}
            className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-300"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide ml-1">Estado</Label>
          <Select value={form.estado} onValueChange={v => onChange('estado', v)}>
            <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm text-slate-900">
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
