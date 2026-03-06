import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Upload, Trash2, FileDown, Paperclip } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import type { EditalAnexo, TipoAnexoEdital } from '@/types/database.types'

const TIPO_LABELS: Record<string, string> = {
  carta_anuencia: 'Carta de Anuência',
  planilha_orcamentaria: 'Planilha Orçamentária',
  cronograma: 'Cronograma',
  termo_compromisso: 'Termo de Compromisso',
  declaracao_etnico_racial: 'Declaração Étnico-Racial',
  declaracao_pcd: 'Declaração PcD',
  declaracao_coletivo: 'Declaração de Coletivo',
  formulario_recurso: 'Formulário de Recurso',
  modelo_projeto: 'Modelo de Projeto',
  edital_completo: 'Edital Completo',
  outros: 'Outros',
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function AnexosPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital, tenant_id')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: anexos } = await supabase
    .from('edital_anexos')
    .select('*')
    .eq('edital_id', id)
    .order('ordem')
    .order('created_at')

  const anexosList = (anexos || []) as EditalAnexo[]

  async function handleUpload(formData: FormData) {
    'use server'
    const supabase2 = await createClient()
    const nome = formData.get('nome') as string
    const descricao = formData.get('descricao') as string
    const tipo_anexo = formData.get('tipo_anexo') as string
    const file = formData.get('arquivo') as File

    if (!nome?.trim() || !file || file.size === 0) return

    const { data: { user } } = await supabase2.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase2.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return

    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const storagePath = `edital-anexos/${id}/${Date.now()}-${file.name}`

    const { error: uploadErr } = await supabase2.storage
      .from('documentos')
      .upload(storagePath, file, { contentType: file.type })

    if (uploadErr) {
      console.error('Upload error:', uploadErr)
      return
    }

    await supabase2.from('edital_anexos').insert({
      edital_id: id,
      tenant_id: profile.tenant_id,
      nome: nome.trim(),
      descricao: descricao?.trim() || null,
      tipo_anexo: tipo_anexo || 'outros',
      nome_arquivo: file.name,
      storage_path: storagePath,
      tamanho_bytes: file.size,
      mime_type: file.type || null,
      criado_por: user.id,
    })

    revalidatePath(`/admin/editais/${id}/anexos`)
  }

  async function handleRemover(formData: FormData) {
    'use server'
    const anexoId = formData.get('anexoId') as string
    const storagePath = formData.get('storagePath') as string
    const supabase2 = await createClient()

    if (storagePath) {
      await supabase2.storage.from('documentos').remove([storagePath])
    }
    await supabase2.from('edital_anexos').delete().eq('id', anexoId)
    revalidatePath(`/admin/editais/${id}/anexos`)
  }

  return (
    <div className="space-y-6">
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-[var(--brand-primary)]" />
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-start gap-5">
              <Link href={`/admin/editais/${id}`}>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 hover:border-[var(--brand-primary)]/30 transition-all mt-0.5">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="space-y-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Anexos do Edital</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-slate-100 text-slate-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
              {anexosList.length} anexo{anexosList.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-[var(--brand-primary)]" />
            Upload de Anexo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleUpload} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nome do Anexo *</label>
                <input name="nome" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" placeholder="Ex: Modelo de Projeto Cultural" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tipo</label>
                <select name="tipo_anexo" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]">
                  {Object.entries(TIPO_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Descrição</label>
                <input name="descricao" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" placeholder="Breve descrição do anexo (opcional)" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Arquivo *</label>
                <input name="arquivo" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.rtf,.txt,.zip" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand-primary)]/10 file:px-3 file:py-1 file:text-xs file:font-medium file:text-[var(--brand-primary)]" />
              </div>
            </div>
            <Button type="submit" className="h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm">
              <Upload className="mr-2 h-4 w-4" />
              Enviar Anexo
            </Button>
          </form>
        </CardContent>
      </Card>

      {anexosList.length > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Paperclip className="h-4 w-4 text-slate-400" />
              Anexos Cadastrados ({anexosList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {anexosList.map(a => (
                <div key={a.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center text-[var(--brand-primary)] flex-shrink-0">
                      <FileDown className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] px-1.5 py-0 rounded-md">
                          {TIPO_LABELS[a.tipo_anexo] || a.tipo_anexo}
                        </Badge>
                        <span className="text-[11px] text-slate-400">{a.nome_arquivo}</span>
                        <span className="text-[11px] text-slate-300">{formatFileSize(a.tamanho_bytes)}</span>
                      </div>
                      {a.descricao && <p className="text-xs text-slate-400 mt-0.5">{a.descricao}</p>}
                    </div>
                  </div>
                  <form action={handleRemover} className="flex-shrink-0">
                    <input type="hidden" name="anexoId" value={a.id} />
                    <input type="hidden" name="storagePath" value={a.storage_path} />
                    <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {anexosList.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Paperclip className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">Nenhum anexo cadastrado</p>
          <p className="text-xs text-slate-300 mt-1">Faça upload de templates e documentos do edital acima.</p>
        </div>
      )}
    </div>
  )
}
