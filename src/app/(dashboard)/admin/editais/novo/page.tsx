'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalFileUpload } from '@/components/edital/EditalFileUpload'
import { toast } from 'sonner'
import { Loader2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface UploadedFile {
  nome_arquivo: string
  storage_path: string
  tamanho_bytes: number
  tipo: string
}

export default function NovoEditalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [tenantId, setTenantId] = useState('')

  // Load tenantId on mount for file uploads
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

  function updateForm(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user!.id)
      .single()

    const { data: editalData, error } = await supabase.from('editais').insert({
      tenant_id: profile!.tenant_id,
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
      created_by: user!.id,
    }).select('id').single()

    if (error) {
      toast.error('Erro ao criar edital: ' + error.message)
      setLoading(false)
      return
    }

    // Save uploaded documents linked to the new edital
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

    toast.success('Edital criado com sucesso')
    router.push('/admin/editais')
  }

  return (
    <div className="space-y-6 max-w-2xl pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-6">
        <Link href="/admin/editais">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-200 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            <ArrowLeft className="h-4 w-4 text-slate-500" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-none mb-2">Novo Edital</h1>
          <p className="text-sm text-slate-500 font-normal">Configure os detalhes e prazos para o novo processo seletivo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 p-4 border-b border-slate-200">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-slate-400">Dados Estruturais</CardTitle>
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
                <Label htmlFor="inicio_inscricao" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início das Inscrições</Label>
                <Input
                  id="inicio_inscricao"
                  type="datetime-local"
                  value={form.inicio_inscricao}
                  onChange={e => updateForm('inicio_inscricao', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fim_inscricao" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim das Inscrições</Label>
                <Input
                  id="fim_inscricao"
                  type="datetime-local"
                  value={form.fim_inscricao}
                  onChange={e => updateForm('fim_inscricao', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inicio_recurso" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Início dos Recursos</Label>
                <Input
                  id="inicio_recurso"
                  type="datetime-local"
                  value={form.inicio_recurso}
                  onChange={e => updateForm('inicio_recurso', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fim_recurso" className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim dos Recursos</Label>
                <Input
                  id="fim_recurso"
                  type="datetime-local"
                  value={form.fim_recurso}
                  onChange={e => updateForm('fim_recurso', e.target.value)}
                  className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                />
              </div>
            </div>

            {/* Documentos do Edital */}
            {tenantId && (
              <div className="pt-4 border-t border-slate-200 mt-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Documentos do Edital</h3>
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
              </div>
            )}

            {/* Prazos de Recurso */}
            <div className="pt-4 border-t border-slate-200 mt-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4">Prazos de Recurso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Inicio Recurso da Lista de Inscritos</Label>
                  <Input
                    type="datetime-local"
                    value={form.inicio_recurso_inscricao}
                    onChange={e => updateForm('inicio_recurso_inscricao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Lista de Inscritos</Label>
                  <Input
                    type="datetime-local"
                    value={form.fim_recurso_inscricao}
                    onChange={e => updateForm('fim_recurso_inscricao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Inicio Recurso da Selecao</Label>
                  <Input
                    type="datetime-local"
                    value={form.inicio_recurso_selecao}
                    onChange={e => updateForm('inicio_recurso_selecao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Selecao</Label>
                  <Input
                    type="datetime-local"
                    value={form.fim_recurso_selecao}
                    onChange={e => updateForm('fim_recurso_selecao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Inicio Recurso da Habilitacao</Label>
                  <Input
                    type="datetime-local"
                    value={form.inicio_recurso_habilitacao}
                    onChange={e => updateForm('inicio_recurso_habilitacao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-400 uppercase tracking-wide ml-1">Fim Recurso da Habilitacao</Label>
                  <Input
                    type="datetime-local"
                    value={form.fim_recurso_habilitacao}
                    onChange={e => updateForm('fim_recurso_habilitacao', e.target.value)}
                    className="h-10 rounded-xl border-slate-200 bg-slate-50/50 font-bold text-sm focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-slate-50 mt-4">
              <Link href="/admin/editais">
                <Button variant="ghost" type="button" className="h-10 px-6 rounded-xl font-bold text-xs uppercase tracking-wide text-slate-400 hover:text-slate-900 transition-all">
                  Cancelar
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="h-10 px-8 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-bold text-xs uppercase tracking-wide shadow-xl shadow-[#0047AB]/20 transition-all active:scale-95"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Criar Edital'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
