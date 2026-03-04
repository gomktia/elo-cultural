'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalFileUpload } from '@/components/edital/EditalFileUpload'
import { EditalConfigManager, type EditalConfig, type CategoriaItem } from '@/components/edital/EditalConfigManager'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
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
    // Format as YYYY-MM-DDTHH:MM for datetime-local input
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

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
        toast.error('Edital não encontrado')
        router.push('/admin/editais')
        return
      }

      setForm({
        numero_edital: edital.numero_edital || '',
        titulo: edital.titulo || '',
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
      })

      // Load existing documents
      const { data: docs } = await supabase
        .from('edital_documentos')
        .select('nome_arquivo, storage_path, tamanho_bytes, tipo')
        .eq('edital_id', id)

      if (docs) {
        setEditalFiles(docs.filter(d => d.tipo === 'edital_pdf'))
        setAnexoFiles(docs.filter(d => d.tipo !== 'edital_pdf'))
      }

      // Load categorias
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
    setSaving(true)

    const supabase = createClient()

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

    // Sync categorias: delete old, insert current
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

    // Sync documents: delete old ones, insert current ones
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
    <div className="space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${id}`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Editar Edital</h1>
              <p className="text-sm text-slate-500">Atualize os dados e prazos do edital.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-[var(--brand-primary)] p-4">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-white">Dados Estruturais</CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="numero" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Número do Edital *</Label>
                <Input
                  id="numero"
                  placeholder="Ex: 001/2026"
                  value={form.numero_edital}
                  onChange={e => updateForm('numero_edital', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="titulo" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Título do Edital *</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Prêmio Cultura Viva 2026"
                  value={form.titulo}
                  onChange={e => updateForm('titulo', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="descricao" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Detalhe o objetivo e as regras gerais..."
                value={form.descricao}
                onChange={e => updateForm('descricao', e.target.value)}
                rows={4}
                className="rounded-2xl border-slate-200 bg-slate-50/50 font-medium text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início das Inscrições</Label>
                <Input type="datetime-local" value={form.inicio_inscricao} onChange={e => updateForm('inicio_inscricao', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim das Inscrições</Label>
                <Input type="datetime-local" value={form.fim_inscricao} onChange={e => updateForm('fim_inscricao', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início dos Recursos</Label>
                <Input type="datetime-local" value={form.inicio_recurso} onChange={e => updateForm('inicio_recurso', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim dos Recursos</Label>
                <Input type="datetime-local" value={form.fim_recurso} onChange={e => updateForm('fim_recurso', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
              </div>
            </div>

            {/* Documentos do Edital */}
            {tenantId && (
              <div className="pt-4 border-t border-slate-200 mt-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Documentos do Edital</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EditalFileUpload tenantId={tenantId} label="PDF do Edital" tipo="edital_pdf" files={editalFiles} onFilesChange={setEditalFiles} multiple={false} />
                  <EditalFileUpload tenantId={tenantId} label="Anexos" tipo="anexo" files={anexoFiles} onFilesChange={setAnexoFiles} multiple={true} />
                </div>
              </div>
            )}

            {/* Configuração do Edital */}
            <div className="pt-4 border-t border-slate-200 mt-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Configuração do Edital</h3>
              <EditalConfigManager config={editalConfig} onChange={setEditalConfig} />
            </div>

            {/* Prazos de Recurso */}
            <div className="pt-4 border-t border-slate-200 mt-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Prazos de Recurso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início Recurso da Lista de Inscritos</Label>
                  <Input type="datetime-local" value={form.inicio_recurso_inscricao} onChange={e => updateForm('inicio_recurso_inscricao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Lista de Inscritos</Label>
                  <Input type="datetime-local" value={form.fim_recurso_inscricao} onChange={e => updateForm('fim_recurso_inscricao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início Recurso da Seleção</Label>
                  <Input type="datetime-local" value={form.inicio_recurso_selecao} onChange={e => updateForm('inicio_recurso_selecao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Seleção</Label>
                  <Input type="datetime-local" value={form.fim_recurso_selecao} onChange={e => updateForm('fim_recurso_selecao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início Recurso da Habilitação</Label>
                  <Input type="datetime-local" value={form.inicio_recurso_habilitacao} onChange={e => updateForm('inicio_recurso_habilitacao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Habilitação</Label>
                  <Input type="datetime-local" value={form.fim_recurso_habilitacao} onChange={e => updateForm('fim_recurso_habilitacao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
              <Link href={`/admin/editais/${id}`}>
                <Button variant="ghost" type="button" className="h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wide text-slate-400 hover:text-slate-900 transition-all">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={saving}
                className="h-10 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-bold text-xs uppercase tracking-wide shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
