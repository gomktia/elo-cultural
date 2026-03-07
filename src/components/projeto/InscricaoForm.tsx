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
import { Loader2, ArrowLeft, ArrowRight, Check, Target, Users, MapPin, Calendar, Megaphone, Accessibility, UserPlus, Trash2, DollarSign, Clock, AlertTriangle } from 'lucide-react'

// ── Equipe (Fase 1.6) ──
interface EquipeMembro {
  nome: string
  funcao: string
  cpf_cnpj: string
  minicurriculo: string
}

// ── Orcamento (Fase 1.7) ──
const CATEGORIAS_ORCAMENTO = [
  { value: 'producao', label: 'Produção' },
  { value: 'divulgacao', label: 'Divulgação' },
  { value: 'acessibilidade', label: 'Acessibilidade' },
  { value: 'outras_fontes', label: 'Outras Fontes' },
]

interface OrcamentoItem {
  categoria: string
  item: string
  unidade_medida: string
  quantidade: string
  valor_unitario: string
}

// ── Cronograma (Fase 1.8) ──
const FASES_CRONOGRAMA = [
  { value: 'pre_producao', label: 'Pré-produção' },
  { value: 'divulgacao', label: 'Divulgação' },
  { value: 'producao', label: 'Produção' },
  { value: 'pos_producao', label: 'Pós-produção' },
]

interface CronogramaItem {
  fase: string
  atividade: string
  data_inicio: string
  data_fim: string
}

const ACESSIBILIDADE_ARQUITETONICA = [
  { key: 'rotas_acessiveis', label: 'Rotas acessíveis' },
  { key: 'piso_tatil', label: 'Piso tátil' },
  { key: 'rampas', label: 'Rampas' },
  { key: 'elevadores', label: 'Elevadores' },
  { key: 'corrimaos', label: 'Corrimãos' },
  { key: 'banheiros_adaptados', label: 'Banheiros adaptados' },
  { key: 'vagas_estacionamento', label: 'Vagas de estacionamento PcD' },
  { key: 'assentos_obesos', label: 'Assentos para obesos' },
  { key: 'iluminacao', label: 'Iluminação adequada' },
]

const ACESSIBILIDADE_COMUNICACIONAL = [
  { key: 'libras', label: 'Intérprete de Libras' },
  { key: 'braille', label: 'Material em Braille' },
  { key: 'sinalizacao_tatil', label: 'Sinalização tátil' },
  { key: 'audiodescricao', label: 'Audiodescrição' },
  { key: 'legendas', label: 'Legendas' },
  { key: 'linguagem_simples', label: 'Linguagem simples' },
  { key: 'textos_leitor_tela', label: 'Textos para leitor de tela' },
]

const ACESSIBILIDADE_ATITUDINAL = [
  { key: 'capacitacao_equipes', label: 'Capacitação de equipes' },
  { key: 'contratacao_pcd', label: 'Contratação de PcD' },
  { key: 'formacao_sensibilizacao', label: 'Formação e sensibilização' },
]

const AREAS_PROJETO = [
  { value: 'artes_digitais', label: 'Artes Digitais' },
  { value: 'artes_transversais', label: 'Artes Transversais' },
  { value: 'artes_visuais', label: 'Artes Visuais' },
  { value: 'artesanato', label: 'Artesanato' },
  { value: 'audiovisual', label: 'Audiovisual' },
  { value: 'circo', label: 'Circo' },
  { value: 'cultura_popular', label: 'Cultura Popular' },
  { value: 'danca', label: 'Dança' },
  { value: 'economia_criativa', label: 'Economia Criativa' },
  { value: 'livro_literatura', label: 'Livro e Literatura' },
  { value: 'musica', label: 'Música' },
  { value: 'patrimonio', label: 'Patrimônio Cultural' },
  { value: 'teatro', label: 'Teatro' },
  { value: 'tradicao_folclore', label: 'Tradição e Folclore' },
  { value: 'outras', label: 'Outras' },
]

const PUBLICO_PRIORITARIO = [
  { value: 'vitimas_violencia', label: 'Vítimas de violência' },
  { value: 'pobreza', label: 'Pessoas em situação de pobreza' },
  { value: 'situacao_rua', label: 'Pessoas em situação de rua' },
  { value: 'privacao_liberdade', label: 'Pessoas privadas de liberdade' },
  { value: 'pcd', label: 'Pessoas com deficiência' },
  { value: 'sofrimento_fisico_psiquico', label: 'Pessoas em sofrimento físico/psíquico' },
  { value: 'mulheres', label: 'Mulheres' },
  { value: 'lgbtqiapn', label: 'LGBTQIAPN+' },
  { value: 'povos_tradicionais', label: 'Povos e comunidades tradicionais' },
  { value: 'negros', label: 'Pessoas negras' },
  { value: 'ciganos', label: 'Povos ciganos' },
  { value: 'indigenas', label: 'Povos indígenas' },
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
  const [acessibilidade, setAcessibilidade] = useState<Record<string, boolean>>({})
  const [acessibilidadeDescricao, setAcessibilidadeDescricao] = useState('')
  const [equipe, setEquipe] = useState<EquipeMembro[]>([])
  const [orcamento, setOrcamento] = useState<OrcamentoItem[]>([])
  const [cronograma, setCronograma] = useState<CronogramaItem[]>([])

  // Auto-sync orcamento_total from itemized budget (Fase 1.7)
  const orcamentoItensTotal = orcamento.reduce(
    (sum, item) => sum + (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0), 0
  )
  useEffect(() => {
    if (orcamento.length > 0) {
      updateForm('orcamento_total', orcamentoItensTotal.toFixed(2))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orcamentoItensTotal, orcamento.length])

  // Cronograma date validation (Fase 1.8)
  const cronogramaWarnings = cronograma.map((item, i) => {
    const warnings: string[] = []
    if (form.periodo_execucao_inicio && item.data_inicio && item.data_inicio < form.periodo_execucao_inicio) {
      warnings.push('Data início anterior ao período de execução')
    }
    if (form.periodo_execucao_fim && item.data_fim && item.data_fim > form.periodo_execucao_fim) {
      warnings.push('Data fim posterior ao período de execução')
    }
    if (item.data_inicio && item.data_fim && item.data_inicio > item.data_fim) {
      warnings.push('Data início posterior à data fim')
    }
    return warnings
  })
  const hasCronogramaWarnings = cronogramaWarnings.some(w => w.length > 0)

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
      toast.error('Você deve aceitar os termos para enviar.')
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
    if (!user) { toast.error('Sessão expirada'); setLoading(false); return }

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
        acessibilidade: Object.keys(acessibilidade).filter(k => acessibilidade[k]).length > 0
          ? Object.fromEntries(Object.entries(acessibilidade).filter(([, v]) => v))
          : null,
        acessibilidade_descricao: acessibilidadeDescricao || null,
      })
      .select('id')
      .single()

    if (error) {
      toast.error('Erro ao enviar inscrição: ' + error.message)
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

    // Save equipe (Fase 1.6)
    if (equipe.length > 0 && projeto) {
      await supabase.from('projeto_equipe').insert(
        equipe.map(m => ({
          tenant_id: tenantId,
          projeto_id: projeto.id,
          nome: m.nome,
          funcao: m.funcao,
          cpf_cnpj: m.cpf_cnpj || null,
          minicurriculo: m.minicurriculo || null,
        }))
      )
    }

    // Save orcamento (Fase 1.7)
    if (orcamento.length > 0 && projeto) {
      await supabase.from('projeto_orcamento_itens').insert(
        orcamento.map(item => ({
          tenant_id: tenantId,
          projeto_id: projeto.id,
          categoria: item.categoria,
          item: item.item,
          unidade_medida: item.unidade_medida || null,
          quantidade: parseInt(item.quantidade) || 1,
          valor_unitario: parseFloat(item.valor_unitario) || 0,
          valor_total: (parseInt(item.quantidade) || 1) * (parseFloat(item.valor_unitario) || 0),
        }))
      )
    }

    // Save cronograma (Fase 1.8)
    if (cronograma.length > 0 && projeto) {
      await supabase.from('projeto_cronograma').insert(
        cronograma.map(item => ({
          tenant_id: tenantId,
          projeto_id: projeto.id,
          fase: item.fase,
          atividade: item.atividade,
          data_inicio: item.data_inicio || null,
          data_fim: item.data_fim || null,
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

    toast.success(`Inscrição enviada! Protocolo: ${protocolo}`)

    fetch('/api/email/notify-inscricao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ protocolo, titulo: form.titulo, editalTitulo: '', projetoId: projeto!.id }),
    }).catch(() => {})

    router.push('/projetos')
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(s => (
          <div key={s} className="flex items-center gap-1.5">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              s < step ? 'bg-primary text-primary-foreground' :
              s === step ? 'bg-primary text-primary-foreground' :
              'bg-muted text-muted-foreground'
            }`}>
              {s < step ? <Check className="h-4 w-4" /> : s}
            </div>
            <span className={`text-sm ${s === step ? 'font-medium' : 'text-muted-foreground'} hidden lg:inline`}>
              {s === 1 ? 'Projeto' : s === 2 ? 'Detalhes' : s === 3 ? 'Equipe' : s === 4 ? 'Documentos' : 'Revisão'}
            </span>
            {s < 5 && <div className="h-px w-3 sm:w-6 bg-border" />}
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
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Título do Projeto *</Label>
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

            {/* Áreas do Projeto */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                <Target className="h-3 w-3" /> Áreas do Projeto
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
                placeholder="Breve descrição do projeto"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Minicurrículo do Proponente</Label>
              <Textarea
                value={form.minicurriculo_proponente}
                onChange={e => updateForm('minicurriculo_proponente', e.target.value)}
                placeholder="Descreva sua trajetória cultural e qualificações relevantes"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Descrição Técnica</Label>
              <Textarea
                value={form.descricao_tecnica}
                onChange={e => updateForm('descricao_tecnica', e.target.value)}
                placeholder="Detalhamento técnico do projeto"
                rows={5}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Objetivos</Label>
              <Textarea
                value={form.objetivos}
                onChange={e => updateForm('objetivos', e.target.value)}
                placeholder="Objetivos gerais e específicos do projeto"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Metas</Label>
              <Textarea
                value={form.metas_projeto}
                onChange={e => updateForm('metas_projeto', e.target.value)}
                placeholder="Metas quantitativas e qualitativas a serem alcançadas"
                rows={3}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            {/* Campos extras do edital */}
            {camposExtras.length > 0 && (
              <div className="border-t pt-4 mt-4 space-y-4">
                <h4 className="text-sm font-semibold text-slate-700">Informações Adicionais</h4>
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
                Próximo
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
                <Users className="h-3 w-3" /> Perfil do Público
              </Label>
              <Textarea
                value={form.perfil_publico}
                onChange={e => updateForm('perfil_publico', e.target.value)}
                placeholder="Descreva o público-alvo do projeto"
                rows={2}
                className="rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Público Prioritário</Label>
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
                <MapPin className="h-3 w-3" /> Local de Execução
              </Label>
              <Input
                value={form.local_execucao}
                onChange={e => updateForm('local_execucao', e.target.value)}
                placeholder="Endereço ou espaço onde o projeto será realizado"
                className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> Início da Execução
                </Label>
                <Input
                  type="date"
                  value={form.periodo_execucao_inicio}
                  onChange={e => updateForm('periodo_execucao_inicio', e.target.value)}
                  className="h-11 rounded-2xl border-slate-200 bg-slate-50/50 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Fim da Execução</Label>
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
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Orçamento Total (R$)</Label>
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
              <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Cronograma de Execução</Label>
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
                <Megaphone className="h-3 w-3" /> Estratégia de Divulgação
              </Label>
              <Textarea
                value={form.estrategia_divulgacao}
                onChange={e => updateForm('estrategia_divulgacao', e.target.value)}
                placeholder="Como o projeto será divulgado?"
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
                <span className="text-xs font-medium text-slate-700">Haverá venda de produtos ou ingressos?</span>
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

            {/* Acessibilidade (Fase 1.5) */}
            <div className="space-y-4 p-5 rounded-2xl border border-violet-100 bg-violet-50/30">
              <div className="flex items-center gap-2">
                <Accessibility className="h-3.5 w-3.5 text-violet-500" />
                <span className="text-[11px] font-semibold text-violet-600 uppercase tracking-wide">Medidas de Acessibilidade</span>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Arquitetonica</p>
                <div className="flex flex-wrap gap-2">
                  {ACESSIBILIDADE_ARQUITETONICA.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAcessibilidade(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={[
                        'px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all border',
                        acessibilidade[item.key]
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Comunicacional</p>
                <div className="flex flex-wrap gap-2">
                  {ACESSIBILIDADE_COMUNICACIONAL.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAcessibilidade(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={[
                        'px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all border',
                        acessibilidade[item.key]
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Atitudinal</p>
                <div className="flex flex-wrap gap-2">
                  {ACESSIBILIDADE_ATITUDINAL.map(item => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setAcessibilidade(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                      className={[
                        'px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all border',
                        acessibilidade[item.key]
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      ].join(' ')}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">Como as medidas serão implementadas?</Label>
                <Textarea
                  value={acessibilidadeDescricao}
                  onChange={e => setAcessibilidadeDescricao(e.target.value)}
                  placeholder="Descreva como as medidas de acessibilidade selecionadas serão implementadas no projeto..."
                  rows={3}
                  className="rounded-xl border-slate-200 bg-white text-sm"
                />
              </div>
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
                    <SelectItem value="indigena">Pessoa Indígena</SelectItem>
                    <SelectItem value="pcd">Pessoa com Deficiência (PcD)</SelectItem>
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
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Equipe + Orcamento + Cronograma */}
      {step === 3 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Equipe, Orçamento e Cronograma</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* === EQUIPE (Fase 1.6) === */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">Ficha Técnica / Equipe</span>
              </div>

              {equipe.length > 0 && (
                <div className="space-y-2">
                  {equipe.map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{m.nome} <span className="text-slate-400 font-normal">— {m.funcao}</span></p>
                        {m.cpf_cnpj && <p className="text-xs text-slate-400">{m.cpf_cnpj}</p>}
                      </div>
                      <button type="button" onClick={() => setEquipe(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <EquipeAddForm onAdd={(m) => setEquipe(prev => [...prev, m])} />
            </div>

            {/* === ORCAMENTO (Fase 1.7) === */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wide">Planilha Orçamentária</span>
              </div>

              {orcamento.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">
                        <th className="text-left pb-2">Categoria</th>
                        <th className="text-left pb-2">Item</th>
                        <th className="text-right pb-2">Qtd</th>
                        <th className="text-right pb-2">Unit. (R$)</th>
                        <th className="text-right pb-2">Total (R$)</th>
                        <th className="pb-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {orcamento.map((item, i) => {
                        const total = (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0)
                        return (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-2 text-xs text-slate-500">{CATEGORIAS_ORCAMENTO.find(c => c.value === item.categoria)?.label}</td>
                            <td className="py-2">{item.item}</td>
                            <td className="py-2 text-right">{item.quantidade}</td>
                            <td className="py-2 text-right">{parseFloat(item.valor_unitario).toFixed(2)}</td>
                            <td className="py-2 text-right font-medium">{total.toFixed(2)}</td>
                            <td className="py-2 text-right">
                              <button type="button" onClick={() => setOrcamento(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      <tr className="border-t-2 border-slate-200">
                        <td colSpan={4} className="py-2 text-right font-semibold text-sm">Total Geral:</td>
                        <td className="py-2 text-right font-bold text-sm text-emerald-600">
                          R$ {orcamento.reduce((sum, item) => sum + (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0), 0).toFixed(2)}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {orcamento.length > 0 && form.orcamento_total && Math.abs(orcamentoItensTotal - parseFloat(form.orcamento_total)) > 0.01 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>O total dos itens (R$ {orcamentoItensTotal.toFixed(2)}) difere do orcamento informado (R$ {parseFloat(form.orcamento_total).toFixed(2)})</span>
                </div>
              )}

              <OrcamentoAddForm onAdd={(item) => setOrcamento(prev => [...prev, item])} />
            </div>

            {/* === CRONOGRAMA (Fase 1.8) === */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wide">Cronograma de Execução</span>
              </div>

              {cronograma.length > 0 && (
                <div className="space-y-2">
                  {cronograma.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${cronogramaWarnings[i]?.length > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{item.atividade}</p>
                        <p className="text-xs text-slate-400">
                          {FASES_CRONOGRAMA.find(f => f.value === item.fase)?.label}
                          {item.data_inicio && ` · ${item.data_inicio}`}
                          {item.data_fim && ` a ${item.data_fim}`}
                        </p>
                        {cronogramaWarnings[i]?.length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 text-amber-600">
                            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                            <span className="text-[11px] font-medium">{cronogramaWarnings[i].join(' · ')}</span>
                          </div>
                        )}
                      </div>
                      <button type="button" onClick={() => setCronograma(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-300 hover:text-red-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {hasCronogramaWarnings && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                  <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Algumas atividades possuem datas fora do período de execução ({form.periodo_execucao_inicio || '?'} a {form.periodo_execucao_fim || '?'})</span>
                </div>
              )}

              <CronogramaAddForm onAdd={(item) => setCronograma(prev => [...prev, item])} />
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(4)} className="rounded-xl">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Documents */}
      {step === 4 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Documentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <DocumentUpload tipo="identidade" label="Documento de Identidade" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="proposta" label="Proposta do Projeto" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="orcamento" label="Planilha Orçamentária" tenantId={tenantId} onUpload={handleDocUpload} />
            <DocumentUpload tipo="complementar" label="Documentos Complementares" tenantId={tenantId} onUpload={handleDocUpload} />
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(3)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={() => setStep(5)} className="rounded-xl">
                Próximo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Review */}
      {step === 5 && (
        <Card className="border border-slate-200 rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Revisão e Envio</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
              <h4 className="font-medium text-sm">Dados do Projeto</h4>
              <p className="text-sm"><strong>Título:</strong> {form.titulo}</p>
              {categoriaId && (
                <p className="text-sm"><strong>Categoria:</strong> {categorias.find(c => c.id === categoriaId)?.nome}</p>
              )}
              {areasProjetoSelected.length > 0 && (
                <p className="text-sm"><strong>Áreas:</strong> {areasProjetoSelected.map(a => AREAS_PROJETO.find(ap => ap.value === a)?.label).join(', ')}</p>
              )}
              {form.resumo && <p className="text-sm"><strong>Resumo:</strong> {form.resumo}</p>}
              {form.objetivos && <p className="text-sm"><strong>Objetivos:</strong> {form.objetivos}</p>}
              {form.orcamento_total && <p className="text-sm"><strong>Orçamento:</strong> R$ {parseFloat(form.orcamento_total).toFixed(2)}</p>}
              {form.local_execucao && <p className="text-sm"><strong>Local:</strong> {form.local_execucao}</p>}
              {(form.periodo_execucao_inicio || form.periodo_execucao_fim) && (
                <p className="text-sm"><strong>Período:</strong> {form.periodo_execucao_inicio} a {form.periodo_execucao_fim}</p>
              )}
              {concorreCota && tipoCota && (
                <p className="text-sm"><strong>Cota:</strong> {tipoCota === 'negra' ? 'Pessoa Negra' : tipoCota === 'indigena' ? 'Pessoa Indígena' : 'PcD'}</p>
              )}
              {publicoPrioritarioSelected.length > 0 && (
                <p className="text-sm"><strong>Público prioritário:</strong> {publicoPrioritarioSelected.map(p => PUBLICO_PRIORITARIO.find(pp => pp.value === p)?.label).join(', ')}</p>
              )}
              {Object.keys(acessibilidade).filter(k => acessibilidade[k]).length > 0 && (
                <p className="text-sm"><strong>Acessibilidade:</strong> {
                  [...ACESSIBILIDADE_ARQUITETONICA, ...ACESSIBILIDADE_COMUNICACIONAL, ...ACESSIBILIDADE_ATITUDINAL]
                    .filter(item => acessibilidade[item.key])
                    .map(item => item.label)
                    .join(', ')
                }</p>
              )}
              {acessibilidadeDescricao && (
                <p className="text-sm"><strong>Implementação acessibilidade:</strong> {acessibilidadeDescricao}</p>
              )}
              {camposExtras.filter(c => camposValues[c.id]?.trim()).map(c => (
                <p key={c.id} className="text-sm"><strong>{c.label}:</strong> {camposValues[c.id]}</p>
              ))}
            </div>
            {equipe.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <h4 className="font-medium text-sm">Equipe ({equipe.length} membros)</h4>
                {equipe.map((m, i) => (
                  <p key={i} className="text-sm">{m.nome} — {m.funcao}</p>
                ))}
              </div>
            )}
            {orcamento.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <h4 className="font-medium text-sm">Orçamento ({orcamento.length} itens)</h4>
                <p className="text-sm font-medium">Total: R$ {orcamento.reduce((sum, item) => sum + (parseFloat(item.quantidade) || 0) * (parseFloat(item.valor_unitario) || 0), 0).toFixed(2)}</p>
              </div>
            )}
            {cronograma.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2">
                <h4 className="font-medium text-sm">Cronograma ({cronograma.length} atividades)</h4>
                {cronograma.map((item, i) => (
                  <p key={i} className="text-sm">{FASES_CRONOGRAMA.find(f => f.value === item.fase)?.label}: {item.atividade}</p>
                ))}
              </div>
            )}
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
                Declaro que as informações prestadas são verdadeiras e que estou ciente das regras do edital.
              </label>
            </div>
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(4)} className="rounded-xl">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || !aceitaTermos} className="rounded-xl">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Inscrição
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── Mini-form: Equipe ──
function EquipeAddForm({ onAdd }: { onAdd: (m: EquipeMembro) => void }) {
  const [nome, setNome] = useState('')
  const [funcao, setFuncao] = useState('')
  const [cpf, setCpf] = useState('')
  const [mini, setMini] = useState('')

  function add() {
    if (!nome.trim() || !funcao.trim()) return
    onAdd({ nome: nome.trim(), funcao: funcao.trim(), cpf_cnpj: cpf.trim(), minicurriculo: mini.trim() })
    setNome(''); setFuncao(''); setCpf(''); setMini('')
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-blue-100 bg-blue-50/30">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Nome *" value={nome} onChange={e => setNome(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input placeholder="Função *" value={funcao} onChange={e => setFuncao(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input placeholder="CPF/CNPJ (opcional)" value={cpf} onChange={e => setCpf(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input placeholder="Minicurrículo (opcional)" value={mini} onChange={e => setMini(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
      </div>
      <Button type="button" onClick={add} variant="outline" size="sm" className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50">
        <UserPlus className="h-3.5 w-3.5 mr-2" /> Adicionar Membro
      </Button>
    </div>
  )
}

// ── Mini-form: Orcamento ──
function OrcamentoAddForm({ onAdd }: { onAdd: (item: OrcamentoItem) => void }) {
  const [categoria, setCategoria] = useState('producao')
  const [item, setItem] = useState('')
  const [unidade, setUnidade] = useState('')
  const [qtd, setQtd] = useState('')
  const [valor, setValor] = useState('')

  function add() {
    if (!item.trim()) return
    onAdd({ categoria, item: item.trim(), unidade_medida: unidade.trim(), quantidade: qtd || '1', valor_unitario: valor || '0' })
    setItem(''); setUnidade(''); setQtd(''); setValor('')
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-emerald-100 bg-emerald-50/30">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIAS_ORCAMENTO.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Item *" value={item} onChange={e => setItem(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input placeholder="Unidade" value={unidade} onChange={e => setUnidade(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input type="number" placeholder="Qtd" value={qtd} onChange={e => setQtd(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input type="number" step="0.01" placeholder="Valor unit." value={valor} onChange={e => setValor(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
      </div>
      <Button type="button" onClick={add} variant="outline" size="sm" className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50">
        <DollarSign className="h-3.5 w-3.5 mr-2" /> Adicionar Item
      </Button>
    </div>
  )
}

// ── Mini-form: Cronograma ──
function CronogramaAddForm({ onAdd }: { onAdd: (item: CronogramaItem) => void }) {
  const [fase, setFase] = useState('producao')
  const [atividade, setAtividade] = useState('')
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')

  function add() {
    if (!atividade.trim()) return
    onAdd({ fase, atividade: atividade.trim(), data_inicio: inicio, data_fim: fim })
    setAtividade(''); setInicio(''); setFim('')
  }

  return (
    <div className="space-y-3 p-4 rounded-xl border border-amber-100 bg-amber-50/30">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Select value={fase} onValueChange={setFase}>
          <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FASES_CRONOGRAMA.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Atividade *" value={atividade} onChange={e => setAtividade(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input type="date" value={inicio} onChange={e => setInicio(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
        <Input type="date" value={fim} onChange={e => setFim(e.target.value)} className="h-10 rounded-xl border-slate-200 bg-white text-sm" />
      </div>
      <Button type="button" onClick={add} variant="outline" size="sm" className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50">
        <Clock className="h-3.5 w-3.5 mr-2" /> Adicionar Atividade
      </Button>
    </div>
  )
}
