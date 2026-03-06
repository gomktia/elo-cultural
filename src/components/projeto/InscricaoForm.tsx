'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
import { inscricaoSchema } from '@/lib/schemas/projeto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DocumentUpload } from './DocumentUpload'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, ArrowRight, Check, Target, Users, MapPin, Calendar, Megaphone } from 'lucide-react'

const AREAS_PROJETO = [
  { value: 'artes_digitais', label: 'Artes Digitais' },
  { value: 'artes_transversais', label: 'Artes Transversais' },
  { value: 'artes_visuais', label: 'Artes Visuais' },
  { value: 'artesanato', label: 'Artesanato' },
  { value: 'audiovisual', label: 'Audiovisual' },
  { value: 'circo', label: 'Circo' },
  { value: 'cultura_popular', label: 'Cultura Popular' },
  { value: 'danca', label: 'Danca' },
  { value: 'economia_criativa', label: 'Economia Criativa' },
  { value: 'livro_literatura', label: 'Livro e Literatura' },
  { value: 'musica', label: 'Musica' },
  { value: 'patrimonio', label: 'Patrimonio Cultural' },
  { value: 'teatro', label: 'Teatro' },
  { value: 'tradicao_folclore', label: 'Tradicao e Folclore' },
  { value: 'outras', label: 'Outras' },
]

const PUBLICO_PRIORITARIO = [
  { value: 'vitimas_violencia', label: 'Vitimas de violencia' },
  { value: 'pobreza', label: 'Pessoas em situacao de pobreza' },
  { value: 'situacao_rua', label: 'Pessoas em situacao de rua' },
  { value: 'privacao_liberdade', label: 'Pessoas privadas de liberdade' },
  { value: 'pcd', label: 'Pessoas com deficiencia' },
  { value: 'sofrimento_fisico_psiquico', label: 'Pessoas em sofrimento fisico/psiquico' },
  { value: 'mulheres', label: 'Mulheres' },
  { value: 'lgbtqiapn', label: 'LGBTQIAPN+' },
  { value: 'povos_tradicionais', label: 'Povos e comunidades tradicionais' },
  { value: 'negros', label: 'Pessoas negras' },
  { value: 'ciganos', label: 'Povos ciganos' },
  { value: 'indigenas', label: 'Povos indigenas' },
  { value: 'aberto_todos', label: 'Aberto a todos' },
  { value: 'outro', label: 'Outro' },
]

interface InscricaoFormProps {
  editalId: string
  tenantId: string
}

interface Categoria {
  id: string
  nome: string
  vagas: number
}

interface CampoExtra {
  id: string
  label: string
  tipo: string
  obrigatorio: boolean
  opcoes: string[]
  placeholder: string | null
  ordem: number
}

export function InscricaoForm({ editalId, tenantId }: InscricaoFormProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [camposExtras, setCamposExtras] = useState<CampoExtra[]>([])
  const [camposValues, setCamposValues] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    titulo: '',
    resumo: '',
    descricao_tecnica: '',
    orcamento_total: '',
    cronograma_execucao: '',
    // Novos campos estruturados
    minicurriculo_proponente: '',
    objetivos: '',
    metas_projeto: '',
    perfil_publico: '',
    local_execucao: '',
    periodo_execucao_inicio: '',
    periodo_execucao_fim: '',
    estrategia_divulgacao: '',
    outras_fontes_detalhamento: '',
    venda_detalhamento: '',
    contrapartida_social: '',
  })
  const [areasProjetoSelected, setAreasProjetoSelected] = useState<string[]>([])
  const [publicoPrioritarioSelected, setPublicoPrioritarioSelected] = useState<string[]>([])
  const [outrasFontes, setOutrasFontes] = useState(false)
  const [vendaProdutos, setVendaProdutos] = useState(false)
  const [concorreCota, setConcorreCota] = useState(false)
  const [tipoCota, setTipoCota] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('edital_categorias')
      .select('id, nome, vagas')
      .eq('edital_id', editalId)
      .order('created_at')
      .then(({ data }) => {
        if (data && data.length > 0) setCategorias(data)
      })
    supabase
      .from('edital_campos_inscricao')
      .select('*')
      .eq('edital_id', editalId)
      .order('ordem')
      .then(({ data }) => {
        if (data && data.length > 0) setCamposExtras(data)
      })
  }, [editalId])

  const [documents, setDocuments] = useState<Array<{
    nome_arquivo: string
    storage_path: string
    tamanho_bytes: number
    tipo: string
  }>>([])
  const [aceitaTermos, setAceitaTermos] = useState(false)

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function toggleArrayItem(arr: string[], item: string, setter: (v: string[]) => void) {
    if (arr.includes(item)) {
      setter(arr.filter(a => a !== item))
    } else {
      setter([...arr, item])
    }
  }

  function handleDocUpload(doc: { nome_arquivo: string; storage_path: string; tamanho_bytes: number; tipo: string }) {
    setDocuments(prev => [...prev, doc])
  }

  async function handleSubmit() {
    if (!aceitaTermos) {
      toast.error('Voce deve aceitar os termos para enviar.')
      return
    }

    const validation = inscricaoSchema.safeParse(form)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Sessao expirada'); setLoading(false); return }

    const protocolo = `PROT-${Date.now().toString(36).toUpperCase()}`

    const { data: projeto, error } = await supabase
      .from('projetos')
      .insert({
        tenant_id: tenantId,
        edital_id: editalId,
        proponente_id: user.id,
        categoria_id: categoriaId || null,
        numero_protocolo: protocolo,
        titulo: form.titulo,
        resumo: form.resumo || null,
        descricao_tecnica: form.descricao_tecnica || null,
        orcamento_total: form.orcamento_total ? parseFloat(form.orcamento_total) : null,
        cronograma_execucao: form.cronograma_execucao || null,
        campos_extras: camposExtras.length > 0 ? Object.fromEntries(
          camposExtras.map(c => [c.label, camposValues[c.id] || ''])
        ) : {},
        ip_submissao: null,
        // Novos campos estruturados
        areas_projeto: areasProjetoSelected.length > 0 ? areasProjetoSelected : null,
        minicurriculo_proponente: form.minicurriculo_proponente || null,
        objetivos: form.objetivos || null,
        metas_projeto: form.metas_projeto || null,
        perfil_publico: form.perfil_publico || null,
        publico_prioritario: publicoPrioritarioSelected.length > 0 ? publicoPrioritarioSelected : null,
        local_execucao: form.local_execucao || null,
        periodo_execucao_inicio: form.periodo_execucao_inicio || null,
        periodo_execucao_fim: form.periodo_execucao_fim || null,
        estrategia_divulgacao: form.estrategia_divulgacao || null,
        outras_fontes_recurso: outrasFontes,
        outras_fontes_detalhamento: outrasFontes ? (form.outras_fontes_detalhamento || null) : null,
        venda_produtos_ingressos: vendaProdutos,
        venda_detalhamento: vendaProdutos ? (form.venda_detalhamento || null) : null,
        contrapartida_social: form.contrapartida_social || null,
        concorre_cota: concorreCota,
        tipo_cota: concorreCota ? (tipoCota || null) : null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar inscricao: ' + error.message)
      setLoading(false)
      return
    }

    if (documents.length > 0 && projeto) {
      await supabase.from('projeto_documentos').insert(
        documents.map(doc => ({
          tenant_id: tenantId,
          projeto_id: projeto.id,
          tipo: doc.tipo,
          nome_arquivo: doc.nome_arquivo,
          storage_path: doc.storage_path,
          tamanho_bytes: doc.tamanho_bytes,
        }))
      )
    }

    logAudit({
      supabase,
      acao: 'INSCRICAO_PROJETO',
      tabela_afetada: 'projetos',
      registro_id: projeto!.id,
      tenant_id: tenantId,
      usuario_id: user.id,
      dados_novos: {
        protocolo,
        titulo: form.titulo,
        edital_id: editalId,
        documentos: documents.length,
      },
    }).catch(() => {})

    toast.success(`Inscricao enviada! Protocolo: ${protocolo}`)

    fetch('/api/email/notify-inscricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolo, titulo: form.titulo, editalTitulo: '' }),
    }).catch(() => {})

    router.push('/projetos')
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              s < step ? 'bg-primary text-primary-foreground' :
              s === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium' : 'text-muted-foreground'} hidden sm:inline`}>
              {s === 1 ? 'Projeto' : s === 2 ? 'Detalhes' : s === 3 ? 'Documentos' : 'Revisao'}
            </span>
            {s < 4 && <div className="h-px w-4 sm:w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Project Data */}
      {step === 1 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Dados do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Titulo do Projeto *</Label>
              <Input
                value={form.titulo}
                onChange={e => updateForm('titulo', e.target.value)}
                placeholder="Nome do seu projeto cultural"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {categorias.length > 0 && (
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Categoria de Selecao *</Label>
                <Select value={categoriaId} onValueChange={setCategoriaId}>
                  <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}{c.vagas > 0 ? ` (${c.vagas} vagas)` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Areas do Projeto */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Target className="h-3 w-3" /> Areas do Projeto
              </Label>
              <div className="flex flex-wrap gap-2">
                {AREAS_PROJETO.map(area => (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() => toggleArrayItem(areasProjetoSelected, area.value, setAreasProjetoSelected)}
                    className={[
                      'px-3 py-1.5 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all border',
                      areasProjetoSelected.includes(area.value)
                        ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    ].join(' ')}
                  >
                    {area.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Resumo</Label>
              <Textarea
                value={form.resumo}
                onChange={e => updateForm('resumo', e.target.value)}
                placeholder="Breve descricao do projeto"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Minicurriculo do Proponente</Label>
              <Textarea
                value={form.minicurriculo_proponente}
                onChange={e => updateForm('minicurriculo_proponente', e.target.value)}
                placeholder="Descreva sua trajetoria cultural e qualificacoes relevantes"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Descricao Tecnica</Label>
              <Textarea
                value={form.descricao_tecnica}
                onChange={e => updateForm('descricao_tecnica', e.target.value)}
                placeholder="Detalhamento tecnico do projeto"
                rows={5}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Objetivos</Label>
              <Textarea
                value={form.objetivos}
                onChange={e => updateForm('objetivos', e.target.value)}
                placeholder="Objetivos gerais e especificos do projeto"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Metas</Label>
              <Textarea
                value={form.metas_projeto}
                onChange={e => updateForm('metas_projeto', e.target.value)}
                placeholder="Metas quantitativas e qualitativas a serem alcancadas"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {/* Campos extras do edital */}
            {camposExtras.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Informacoes Adicionais</h4>
                {camposExtras.map(campo => (
                  <div key={campo.id} className="space-y-2">
                    <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      {campo.label}{campo.obrigatorio ? ' *' : ''}
                    </Label>
                    {campo.tipo === 'text' && (
                      <Input
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                      />
                    )}
                    {campo.tipo === 'textarea' && (
                      <Textarea
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                        rows={3}
                        className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                      />
                    )}
                    {campo.tipo === 'number' && (
                      <Input
                        type="number"
                        value={camposValues[campo.id] || ''}
                        onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.value }))}
                        placeholder={campo.placeholder || ''}
                        className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                      />
                    )}
                    {campo.tipo === 'select' && (
                      <Select value={camposValues[campo.id] || ''} onValueChange={v => setCamposValues(prev => ({ ...prev, [campo.id]: v }))}>
                        <SelectTrigger className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          {campo.opcoes?.map(op => (
                            <SelectItem key={op} value={op}>{op}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {campo.tipo === 'checkbox' && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={camposValues[campo.id] === 'true'}
                          onChange={e => setCamposValues(prev => ({ ...prev, [campo.id]: e.target.checked ? 'true' : 'false' }))}
                          className="rounded"
                        />
                        <span className="text-sm text-muted-foreground">{campo.placeholder || campo.label}</span>
                      </label>
                    )}
                    {campo.tipo === 'file' && (
                      <DocumentUpload
                        tipo="complementar"
                        label=""
                        tenantId={tenantId}
                        onUpload={(doc) => {
                          setCamposValues(prev => ({ ...prev, [campo.id]: doc.storage_path }))
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={() => {
                  const missingRequired = camposExtras.filter(c => c.obrigatorio && !camposValues[c.id]?.trim())
                  if (missingRequired.length > 0) {
                    toast.error(`Preencha: ${missingRequired.map(c => c.label).join(', ')}`)
                    return
                  }
                  setStep(2)
                }}
                disabled={!form.titulo || (categorias.length > 0 && !categoriaId)}
                className="rounded-xl"
              >
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Detalhes (publico, local, orcamento, cotas) */}
      {step === 2 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Detalhes do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Publico */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Users className="h-3 w-3" /> Perfil do Publico
              </Label>
              <Textarea
                value={form.perfil_publico}
                onChange={e => updateForm('perfil_publico', e.target.value)}
                placeholder="Descreva o publico-alvo do projeto"
                rows={2}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Publico Prioritario</Label>
              <div className="flex flex-wrap gap-2">
                {PUBLICO_PRIORITARIO.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => toggleArrayItem(publicoPrioritarioSelected, p.value, setPublicoPrioritarioSelected)}
                    className={[
                      'px-3 py-1.5 rounded-xl text-[11px] font-medium uppercase tracking-wider transition-all border',
                      publicoPrioritarioSelected.includes(p.value)
                        ? 'bg-[#e32a74] text-white border-[#e32a74] shadow-sm'
                        : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
                    ].join(' ')}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Local e Periodo */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <MapPin className="h-3 w-3" /> Local de Execucao
              </Label>
              <Input
                value={form.local_execucao}
                onChange={e => updateForm('local_execucao', e.target.value)}
                placeholder="Endereco ou espaco onde o projeto sera realizado"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Inicio da Execucao
                </Label>
                <Input
                  type="date"
                  value={form.periodo_execucao_inicio}
                  onChange={e => updateForm('periodo_execucao_inicio', e.target.value)}
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Fim da Execucao</Label>
                <Input
                  type="date"
                  value={form.periodo_execucao_fim}
                  onChange={e => updateForm('periodo_execucao_fim', e.target.value)}
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            {/* Orcamento */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Orcamento Total (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.orcamento_total}
                  onChange={e => updateForm('orcamento_total', e.target.value)}
                  placeholder="0.00"
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Cronograma de Execucao</Label>
              <Textarea
                value={form.cronograma_execucao}
                onChange={e => updateForm('cronograma_execucao', e.target.value)}
                placeholder="Descreva as etapas e prazos"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {/* Divulgacao */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Megaphone className="h-3 w-3" /> Estrategia de Divulgacao
              </Label>
              <Textarea
                value={form.estrategia_divulgacao}
                onChange={e => updateForm('estrategia_divulgacao', e.target.value)}
                placeholder="Como o projeto sera divulgado?"
                rows={2}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {/* Contrapartida Social */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Contrapartida Social</Label>
              <Textarea
                value={form.contrapartida_social}
                onChange={e => updateForm('contrapartida_social', e.target.value)}
                placeholder="Descreva a contrapartida social do projeto"
                rows={2}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {/* Outras fontes */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={outrasFontes}
                  onChange={e => setOutrasFontes(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 text-[#0047AB]"
                />
                <span className="text-xs font-medium text-slate-700">O projeto possui outras fontes de recurso?</span>
              </label>
              {outrasFontes && (
                <Textarea
                  value={form.outras_fontes_detalhamento}
                  onChange={e => updateForm('outras_fontes_detalhamento', e.target.value)}
                  placeholder="Detalhe as outras fontes de recurso"
                  rows={2}
                  className="rounded-xl border-slate-200 bg-white text-sm"
                />
              )}
            </div>

            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={vendaProdutos}
                  onChange={e => setVendaProdutos(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 text-[#0047AB]"
                />
                <span className="text-xs font-medium text-slate-700">Havera venda de produtos ou ingressos?</span>
              </label>
              {vendaProdutos && (
                <Textarea
                  value={form.venda_detalhamento}
                  onChange={e => updateForm('venda_detalhamento', e.target.value)}
                  placeholder="Detalhe os produtos/ingressos e valores"
                  rows={2}
                  className="rounded-xl border-slate-200 bg-white text-sm"
                />
              )}
            </div>

            {/* Cotas */}
            <div className="space-y-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={concorreCota}
                  onChange={e => setConcorreCota(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-200 text-[#0047AB]"
                />
                <span className="text-xs font-medium text-slate-700">Deseja concorrer a vagas reservadas (cotas)?</span>
              </label>
              {concorreCota && (
                <Select value={tipoCota} onValueChange={setTipoCota}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white text-sm">
                    <SelectValue placeholder="Selecione o tipo de cota" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="negra">Pessoa Negra</SelectItem>
                    <SelectItem value="indigena">Pessoa Indigena</SelectItem>
                    <SelectItem value="pcd">Pessoa com Deficiencia (PcD)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="rounded-xl">
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Documents */}
      {step === 3 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUpload tipo="identidade" label="Documento de Identidade" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="proposta" label="Proposta do Projeto" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="orcamento" label="Planilha Orcamentaria" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="complementar" label="Documentos Complementares" tenantId={tenantId} onUpload={handleDocUpload} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} className="rounded-xl">
                Proximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revisao e Envio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <h4 className="font-medium text-sm">Dados do Projeto</h4>
              <p className="text-sm"><strong>Titulo:</strong> {form.titulo}</p>
              {categoriaId && (
                <p className="text-sm"><strong>Categoria:</strong> {categorias.find(c => c.id === categoriaId)?.nome}</p>
              )}
              {areasProjetoSelected.length > 0 && (
                <p className="text-sm"><strong>Areas:</strong> {areasProjetoSelected.map(a => AREAS_PROJETO.find(ap => ap.value === a)?.label).join(', ')}</p>
              )}
              {form.resumo && <p className="text-sm"><strong>Resumo:</strong> {form.resumo}</p>}
              {form.objetivos && <p className="text-sm"><strong>Objetivos:</strong> {form.objetivos}</p>}
              {form.orcamento_total && <p className="text-sm"><strong>Orcamento:</strong> R$ {parseFloat(form.orcamento_total).toFixed(2)}</p>}
              {form.local_execucao && <p className="text-sm"><strong>Local:</strong> {form.local_execucao}</p>}
              {(form.periodo_execucao_inicio || form.periodo_execucao_fim) && (
                <p className="text-sm"><strong>Periodo:</strong> {form.periodo_execucao_inicio} a {form.periodo_execucao_fim}</p>
              )}
              {concorreCota && tipoCota && (
                <p className="text-sm"><strong>Cota:</strong> {tipoCota === 'negra' ? 'Pessoa Negra' : tipoCota === 'indigena' ? 'Pessoa Indigena' : 'PcD'}</p>
              )}
              {publicoPrioritarioSelected.length > 0 && (
                <p className="text-sm"><strong>Publico prioritario:</strong> {publicoPrioritarioSelected.map(p => PUBLICO_PRIORITARIO.find(pp => pp.value === p)?.label).join(', ')}</p>
              )}
              {camposExtras.filter(c => camposValues[c.id]?.trim()).map(c => (
                <p key={c.id} className="text-sm"><strong>{c.label}:</strong> {camposValues[c.id]}</p>
              ))}
            </div>
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <h4 className="font-medium text-sm">Documentos ({documents.length})</h4>
              {documents.map((doc, i) => (
                <p key={i} className="text-sm">{doc.tipo}: {doc.nome_arquivo}</p>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum documento anexado.</p>
              )}
            </div>
            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="termos"
                checked={aceitaTermos}
                onChange={e => setAceitaTermos(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="termos" className="text-sm text-muted-foreground leading-snug">
                Declaro que as informacoes prestadas sao verdadeiras e que estou ciente das regras do edital.
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !aceitaTermos} className="rounded-xl">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Inscricao
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
