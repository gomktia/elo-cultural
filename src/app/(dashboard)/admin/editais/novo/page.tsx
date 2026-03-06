'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  Settings2, Scale, DollarSign, Hash, Type, AlignLeft, Users,
} from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  tipo: string
}

const sectionHeader = 'flex items-center gap-2.5 mb-5'
const sectionIcon = 'h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0'
const sectionTitle = 'text-sm font-bold text-slate-900 leading-tight'
const sectionDesc = 'text-xs text-slate-400 font-medium'
const fieldLabel = 'text-xs font-medium text-slate-500 uppercase tracking-wide'
const fieldInput = 'h-10 rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all placeholder:text-slate-300'

export default function NovoEditalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from('profiles').select('tenant_id').eq('id', user.id).single()
          .then(({ data }) => { if (data) setTenantId(data.tenant_id) })
      }
    })
  }, [])

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

    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { toast.error('Sessao expirada'); setLoading(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) { toast.error('Perfil nao encontrado'); setLoading(false); return }

    const { data: editalData, error } = await supabase.from('editais').insert({
      tenant_id: profile.tenant_id,
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
      created_by: user.id,
    }).select('id').single()

    if (error) {
      toast.error('Erro ao criar edital: ' + error.message)
      setLoading(false)
      return
    }

    if (editalConfig.categorias.length > 0 && editalData?.id) {
      const cats = editalConfig.categorias.filter(c => c.nome.trim()).map(c => ({
        edital_id: editalData.id,
        tenant_id: profile.tenant_id,
        nome: c.nome,
        vagas: c.vagas,
      }))
      if (cats.length > 0) await supabase.from('edital_categorias').insert(cats)
    }

    const allFiles = [...editalFiles, ...anexoFiles]
    if (allFiles.length > 0 && editalData?.id) {
      const docs = allFiles.map(f => ({
        edital_id: editalData.id,
        tenant_id: profile!.tenant_id,
        tipo: f.tipo,
        nome_arquivo: f.nome_arquivo,
        storage_path: f.storage_path,
        tamanho_bytes: f.tamanho_bytes,
      }))
      await supabase.from('edital_documentos').insert(docs)
    }

    logAudit({
      supabase,
      acao: 'CRIACAO_EDITAL',
      tabela_afetada: 'editais',
      registro_id: editalData!.id,
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      dados_novos: {
        numero_edital: form.numero_edital,
        titulo: form.titulo,
        tipo_edital: editalConfig.tipo_edital,
        categorias: editalConfig.categorias.length,
        documentos: allFiles.length,
      },
    }).catch(() => {})

    toast.success('Edital criado com sucesso')
    router.push('/admin/editais')
  }

  return (
    <div className="space-y-5 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Link href="/admin/editais">
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 shadow-none text-slate-400 hover:text-[var(--brand-primary)] hover:border-[var(--brand-primary)]/30 hover:bg-[var(--brand-primary)]/5 transition-all">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-0.5">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Novo Edital</h1>
              <p className="text-sm text-slate-500">Configure os detalhes do novo processo seletivo.</p>
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

            {/* Inscricoes */}
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Periodo de Inscricoes</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Inicio</Label>
                  <Input
                    type="datetime-local"
                    value={form.inicio_inscricao}
                    onChange={e => updateForm('inicio_inscricao', e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={form.fim_inscricao}
                    onChange={e => updateForm('fim_inscricao', e.target.value)}
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>

            {/* Recursos Gerais */}
            <div className="mb-5 pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Recursos Gerais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Inicio</Label>
                  <Input
                    type="datetime-local"
                    value={form.inicio_recurso}
                    onChange={e => updateForm('inicio_recurso', e.target.value)}
                    className={fieldInput}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className={fieldLabel}>Fim</Label>
                  <Input
                    type="datetime-local"
                    value={form.fim_recurso}
                    onChange={e => updateForm('fim_recurso', e.target.value)}
                    className={fieldInput}
                  />
                </div>
              </div>
            </div>

            {/* Recursos Especificos */}
            <div className="pt-5 border-t border-slate-100">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-3 pl-0.5">Recursos por Fase</p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Lista Inscritos</Label>
                    <Input
                      type="datetime-local"
                      value={form.inicio_recurso_inscricao}
                      onChange={e => updateForm('inicio_recurso_inscricao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Lista Inscritos</Label>
                    <Input
                      type="datetime-local"
                      value={form.fim_recurso_inscricao}
                      onChange={e => updateForm('fim_recurso_inscricao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Selecao</Label>
                    <Input
                      type="datetime-local"
                      value={form.inicio_recurso_selecao}
                      onChange={e => updateForm('inicio_recurso_selecao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Selecao</Label>
                    <Input
                      type="datetime-local"
                      value={form.fim_recurso_selecao}
                      onChange={e => updateForm('fim_recurso_selecao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Inicio Recurso Habilitacao</Label>
                    <Input
                      type="datetime-local"
                      value={form.inicio_recurso_habilitacao}
                      onChange={e => updateForm('inicio_recurso_habilitacao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className={fieldLabel}>Fim Recurso Habilitacao</Label>
                    <Input
                      type="datetime-local"
                      value={form.fim_recurso_habilitacao}
                      onChange={e => updateForm('fim_recurso_habilitacao', e.target.value)}
                      className={fieldInput}
                    />
                  </div>
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
                <EditalFileUpload
                  tenantId={tenantId}
                  label="PDF do Edital"
                  tipo="edital_pdf"
                  files={editalFiles}
                  onFilesChange={setEditalFiles}
                  multiple={false}
                />
                <EditalFileUpload
                  tenantId={tenantId}
                  label="Anexos"
                  tipo="anexo"
                  files={anexoFiles}
                  onFilesChange={setAnexoFiles}
                  multiple={true}
                />
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
              <Link href="/admin/editais">
                <Button variant="ghost" type="button" className="h-10 px-5 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-700 transition-all">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm shadow-lg shadow-[var(--brand-primary)]/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {loading ? 'Criando...' : 'Criar Edital'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
