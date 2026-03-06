'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
import { editalFormSchema } from '@/lib/schemas/edital'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { EditalFileUpload } from '@/components/edital/EditalFileUpload'
import { EditalConfigManager, type EditalConfig } from '@/components/edital/EditalConfigManager'
import { toast } from 'sonner'
import {
  Loader2, ArrowLeft, FileText, CalendarDays, Upload,
  Settings2, DollarSign, Hash, Type, AlignLeft, Users,
} from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  tipo: string
}

function toLocalDatetime(isoString: string | null | undefined): string {
  if (!isoString) return ''
  try {
    const d = new Date(isoString)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

const sectionHeader = 'flex items-center gap-2.5 mb-5'
const sectionIcon = 'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0'
const sectionTitle = 'text-sm font-bold text-slate-900 leading-tight'
const sectionDesc = 'text-xs text-slate-400 font-medium'
const fieldLabel = 'text-xs font-medium text-slate-500 uppercase tracking-wide'
const fieldInput = 'h-10 rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all placeholder:text-slate-300'

export default function EditarEditalPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tenantId, setTenantId] = useState('')

  const [form, setForm] = useState({
    numero_edital: '',
    titulo: '',
    valor_total: '',
    descricao: '',
    inicio_inscricao: '',
    fim_inscricao: '',
    inicio_recurso: '',
    fim_recurso: '',
    inicio_recurso_inscricao: '',
    fim_recurso_inscricao: '',
    inicio_recurso_selecao: '',
    fim_recurso_selecao: '',
    inicio_recurso_habilitacao: '',
    fim_recurso_habilitacao: '',
    inicio_impugnacao_inscritos: '',
    fim_impugnacao_inscritos: '',
    numero_pareceristas: '3',
    nota_minima_aprovacao: '0',
    nota_zero_desclassifica: true,
    limiar_discrepancia: '20',
  })
  const [editalFiles, setEditalFiles] = useState<UploadedFile[]>([])
  const [anexoFiles, setAnexoFiles] = useState<UploadedFile[]>([])
  const [editalConfig, setEditalConfig] = useState<EditalConfig>({
    tipo_edital: 'fomento',
    categorias: [],
    config_cotas: [],
    config_desempate: [],
    config_pontuacao_extra: [],
    config_reserva_vagas: [],
  })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: profile } = await supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
      if (profile) setTenantId(profile.tenant_id)

      const { data: edital } = await supabase.from('editais').select('*').eq('id', id).single()
      if (!edital) {
        toast.error('Edital nao encontrado')
        router.push('/admin/editais')
        return
      }

      setForm({
        numero_edital: edital.numero_edital || '',
        titulo: edital.titulo || '',
        valor_total: edital.valor_total?.toString() || '',
        descricao: edital.descricao || '',
        inicio_inscricao: toLocalDatetime(edital.inicio_inscricao),
        fim_inscricao: toLocalDatetime(edital.fim_inscricao),
        inicio_recurso: toLocalDatetime(edital.inicio_recurso),
        fim_recurso: toLocalDatetime(edital.fim_recurso),
        inicio_recurso_inscricao: toLocalDatetime(edital.inicio_recurso_inscricao),
        fim_recurso_inscricao: toLocalDatetime(edital.fim_recurso_inscricao),
        inicio_recurso_selecao: toLocalDatetime(edital.inicio_recurso_selecao),
        fim_recurso_selecao: toLocalDatetime(edital.fim_recurso_selecao),
        inicio_recurso_habilitacao: toLocalDatetime(edital.inicio_recurso_habilitacao),
        fim_recurso_habilitacao: toLocalDatetime(edital.fim_recurso_habilitacao),
        inicio_impugnacao_inscritos: toLocalDatetime(edital.inicio_impugnacao_inscritos),
        fim_impugnacao_inscritos: toLocalDatetime(edital.fim_impugnacao_inscritos),
        numero_pareceristas: edital.numero_pareceristas?.toString() || '3',
        nota_minima_aprovacao: edital.nota_minima_aprovacao?.toString() || '0',
        nota_zero_desclassifica: edital.nota_zero_desclassifica ?? true,
        limiar_discrepancia: edital.limiar_discrepancia?.toString() || '20',
      })

      const { data: docs } = await supabase
        .from('edital_documentos')
        .select('nome_arquivo, storage_path, tamanho_bytes, tipo')
        .eq('edital_id', id)

      if (docs) {
        setEditalFiles(docs.filter(d => d.tipo === 'edital_pdf'))
        setAnexoFiles(docs.filter(d => d.tipo !== 'edital_pdf'))
      }

      const { data: cats } = await supabase
        .from('edital_categorias')
        .select('id, nome, vagas')
        .eq('edital_id', id)
        .order('created_at')

      setEditalConfig({
        tipo_edital: edital.tipo_edital || 'fomento',
        categorias: (cats || []).map((c: any) => ({ id: c.id, nome: c.nome, vagas: c.vagas || 0 })),
        config_cotas: edital.config_cotas || [],
        config_desempate: edital.config_desempate || [],
        config_pontuacao_extra: edital.config_pontuacao_extra || [],
        config_reserva_vagas: edital.config_reserva_vagas || [],
      })

      setLoading(false)
    }
    load()
  }, [id, router])

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const validation = editalFormSchema.safeParse(form)
    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setSaving(true)

    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    const { data: editalAntigo } = await supabase
      .from('editais')
      .select('numero_edital, titulo, descricao, tipo_edital, inicio_inscricao, fim_inscricao')
      .eq('id', id)
      .single()

    const { error } = await supabase
      .from('editais')
      .update({
        numero_edital: form.numero_edital,
        titulo: form.titulo,
        descricao: form.descricao || null,
        inicio_inscricao: form.inicio_inscricao || null,
        fim_inscricao: form.fim_inscricao || null,
        inicio_recurso: form.inicio_recurso || null,
        fim_recurso: form.fim_recurso || null,
        inicio_recurso_inscricao: form.inicio_recurso_inscricao || null,
        fim_recurso_inscricao: form.fim_recurso_inscricao || null,
        inicio_recurso_selecao: form.inicio_recurso_selecao || null,
        fim_recurso_selecao: form.fim_recurso_selecao || null,
        inicio_recurso_habilitacao: form.inicio_recurso_habilitacao || null,
        fim_recurso_habilitacao: form.fim_recurso_habilitacao || null,
        inicio_impugnacao_inscritos: form.inicio_impugnacao_inscritos || null,
        fim_impugnacao_inscritos: form.fim_impugnacao_inscritos || null,
        valor_total: form.valor_total ? parseFloat(form.valor_total) : null,
        numero_pareceristas: parseInt(form.numero_pareceristas) || 3,
        nota_minima_aprovacao: parseFloat(form.nota_minima_aprovacao) || 0,
        nota_zero_desclassifica: form.nota_zero_desclassifica,
        limiar_discrepancia: parseFloat(form.limiar_discrepancia) || 20,
        tipo_edital: editalConfig.tipo_edital,
        config_cotas: editalConfig.config_cotas,
        config_desempate: editalConfig.config_desempate,
        config_pontuacao_extra: editalConfig.config_pontuacao_extra,
        config_reserva_vagas: editalConfig.config_reserva_vagas,
      })
      .eq('id', id)

    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      setSaving(false)
      return
    }

    await supabase.from('edital_categorias').delete().eq('edital_id', id)
    const catsToInsert = editalConfig.categorias.filter(c => c.nome.trim()).map(c => ({
      edital_id: id,
      tenant_id: tenantId,
      nome: c.nome,
      vagas: c.vagas,
    }))
    if (catsToInsert.length > 0) {
      await supabase.from('edital_categorias').insert(catsToInsert)
    }

    await supabase.from('edital_documentos').delete().eq('edital_id', id)
    const allFiles = [...editalFiles, ...anexoFiles]
    if (allFiles.length > 0 && tenantId) {
      const docs = allFiles.map(f => ({
        edital_id: id,
        tenant_id: tenantId,
        tipo: f.tipo,
        nome_arquivo: f.nome_arquivo,
        storage_path: f.storage_path,
        tamanho_bytes: f.tamanho_bytes,
      }))
      await supabase.from('edital_documentos').insert(docs)
    }

    if (user && tenantId) {
      logAudit({
        supabase,
        acao: 'EDICAO_EDITAL',
        tabela_afetada: 'editais',
        registro_id: id,
        tenant_id: tenantId,
        usuario_id: user.id,
        dados_antigos: editalAntigo ? {
          numero_edital: editalAntigo.numero_edital,
          titulo: editalAntigo.titulo,
          tipo_edital: editalAntigo.tipo_edital,
        } : null,
        dados_novos: {
          numero_edital: form.numero_edital,
          titulo: form.titulo,
          tipo_edital: editalConfig.tipo_edital,
        },
      }).catch(() => {})
    }

    toast.success('Edital atualizado com sucesso')
    router.push(`/admin/editais/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-primary)]" />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Link href={`/admin/editais/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 shadow-none text-slate-400 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 transition-all">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Editar Edital</h1>
              <p className="text-sm text-slate-500">Atualize os dados e prazos do edital.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 1. Dados Basicos */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className={sectionHeader}>
              <div className={`${sectionIcon} bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]`}>
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h2 className={sectionTitle}>Dados do Edital</h2>
                <p className={sectionDesc}>Informacoes basicas de identificacao</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label htmlFor="numero" className={fieldLabel}>
                  <span className="inline-flex items-center gap-1.5"><Hash className="h-3 w-3" /> Numero do Edital *</span>
                </Label>
                <Input
                  id="numero"
                  placeholder="Ex: 001/2026"
                  value={form.numero_edital}
                  onChange={e => updateForm('numero_edital', e.target.value)}
                  className={fieldInput}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valor_total" className={fieldLabel}>
                  <span className="inline-flex items-center gap-1.5"><DollarSign className="h-3 w-3" /> Dotacao Orcamentaria (R$)</span>
                </Label>
                <Input
                  id="valor_total"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 500000.00"
                  value={form.valor_total}
                  onChange={e => updateForm('valor_total', e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="titulo" className={fieldLabel}>
                  <span className="inline-flex items-center gap-1.5"><Type className="h-3 w-3" /> Titulo do Edital *</span>
                </Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Premio Cultura Viva 2026"
                  value={form.titulo}
                  onChange={e => updateForm('titulo', e.target.value)}
                  className={fieldInput}
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="descricao" className={fieldLabel}>
                  <span className="inline-flex items-center gap-1.5"><AlignLeft className="h-3 w-3" /> Descricao</span>
                </Label>
                <Textarea
                  id="descricao"
                  placeholder="Detalhe o objetivo e as regras gerais do edital..."
                  value={form.descricao}
                  onChange={e => updateForm('descricao', e.target.value)}
                  rows={4}
                  className="rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all placeholder:text-slate-300 resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Cronograma */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className={sectionHeader}>
              <div className={`${sectionIcon} bg-amber-50 text-amber-500`}>
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <h2 className={sectionTitle}>Cronograma</h2>
                <p className={sectionDesc}>Datas de inscricao e prazos de recurso</p>
              </div>
            </div>

            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Periodo de Inscricoes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Inicio</Label>
                  <Input type="datetime-local" value={form.inicio_inscricao} onChange={e => updateForm('inicio_inscricao', e.target.value)} className={fieldInput} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Fim</Label>
                  <Input type="datetime-local" value={form.fim_inscricao} onChange={e => updateForm('fim_inscricao', e.target.value)} className={fieldInput} />
                </div>
              </div>
            </div>

            <div className="mb-5 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Recursos Gerais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Inicio</Label>
                  <Input type="datetime-local" value={form.inicio_recurso} onChange={e => updateForm('inicio_recurso', e.target.value)} className={fieldInput} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Fim</Label>
                  <Input type="datetime-local" value={form.fim_recurso} onChange={e => updateForm('fim_recurso', e.target.value)} className={fieldInput} />
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Recursos por Fase</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Lista Inscritos</Label>
                    <Input type="datetime-local" value={form.inicio_recurso_inscricao} onChange={e => updateForm('inicio_recurso_inscricao', e.target.value)} className={fieldInput} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Lista Inscritos</Label>
                    <Input type="datetime-local" value={form.fim_recurso_inscricao} onChange={e => updateForm('fim_recurso_inscricao', e.target.value)} className={fieldInput} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Selecao</Label>
                    <Input type="datetime-local" value={form.inicio_recurso_selecao} onChange={e => updateForm('inicio_recurso_selecao', e.target.value)} className={fieldInput} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Selecao</Label>
                    <Input type="datetime-local" value={form.fim_recurso_selecao} onChange={e => updateForm('fim_recurso_selecao', e.target.value)} className={fieldInput} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Habilitacao</Label>
                    <Input type="datetime-local" value={form.inicio_recurso_habilitacao} onChange={e => updateForm('inicio_recurso_habilitacao', e.target.value)} className={fieldInput} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Habilitacao</Label>
                    <Input type="datetime-local" value={form.fim_recurso_habilitacao} onChange={e => updateForm('fim_recurso_habilitacao', e.target.value)} className={fieldInput} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Impugnacao da Lista de Inscritos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Inicio Impugnacao</Label>
                  <Input type="datetime-local" value={form.inicio_impugnacao_inscritos} onChange={e => updateForm('inicio_impugnacao_inscritos', e.target.value)} className={fieldInput} />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Fim Impugnacao</Label>
                  <Input type="datetime-local" value={form.fim_impugnacao_inscritos} onChange={e => updateForm('fim_impugnacao_inscritos', e.target.value)} className={fieldInput} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Documentos */}
        {tenantId && (
          <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
            <CardContent className="p-6">
              <div className={sectionHeader}>
                <div className={`${sectionIcon} bg-blue-50 text-blue-500`}>
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h2 className={sectionTitle}>Documentos</h2>
                  <p className={sectionDesc}>PDF do edital e anexos complementares</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditalFileUpload tenantId={tenantId} label="PDF do Edital" tipo="edital_pdf" files={editalFiles} onFilesChange={setEditalFiles} multiple={false} />
                <EditalFileUpload tenantId={tenantId} label="Anexos" tipo="anexo" files={anexoFiles} onFilesChange={setAnexoFiles} multiple={true} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. Configuracao */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className={sectionHeader}>
              <div className={`${sectionIcon} bg-purple-50 text-purple-500`}>
                <Settings2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className={sectionTitle}>Configuracao do Edital</h2>
                <p className={sectionDesc}>Tipo, categorias, cotas e acoes afirmativas</p>
              </div>
            </div>

            <EditalConfigManager config={editalConfig} onChange={setEditalConfig} />
          </CardContent>
        </Card>

        {/* 5. Avaliacao */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className={sectionHeader}>
              <div className={`${sectionIcon} bg-indigo-50 text-indigo-500`}>
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h2 className={sectionTitle}>Configuracao da Avaliacao</h2>
                <p className={sectionDesc}>Pareceristas, notas minimas e discrepancia</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Pareceristas por Projeto</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={form.numero_pareceristas}
                  onChange={e => updateForm('numero_pareceristas', e.target.value)}
                  className={fieldInput}
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Nota Minima Aprovacao</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.nota_minima_aprovacao}
                  onChange={e => updateForm('nota_minima_aprovacao', e.target.value)}
                  className={fieldInput}
                  placeholder="0 = sem minimo"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Limiar Discrepancia (pts)</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.limiar_discrepancia}
                  onChange={e => updateForm('limiar_discrepancia', e.target.value)}
                  className={fieldInput}
                  placeholder="20"
                />
              </div>
              <div className="space-y-1.5">
                <Label className={fieldLabel}>Nota 0 desclassifica?</Label>
                <div
                  onClick={() => setForm(prev => ({ ...prev, nota_zero_desclassifica: !prev.nota_zero_desclassifica }))}
                  className={`h-10 rounded-xl border border-slate-200 flex items-center px-3 gap-2 cursor-pointer transition-all ${
                    form.nota_zero_desclassifica
                      ? 'bg-green-50 border-green-200'
                      : 'bg-slate-50'
                  }`}
                >
                  <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    form.nota_zero_desclassifica
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-slate-300'
                  }`}>
                    {form.nota_zero_desclassifica && <span className="text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {form.nota_zero_desclassifica ? 'Sim' : 'Nao'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <Card className="border border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Link href={`/admin/editais/${id}`}>
                <Button variant="ghost" type="button" className="h-10 px-5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 transition-all">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="h-11 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm shadow-lg shadow-[var(--brand-primary)]/20 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? 'Salvando...' : 'Salvar Alteracoes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
