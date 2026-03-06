import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, Trash2, Shield, FileText } from 'lucide-react'
import { revalidatePath } from 'next/cache'
import type { EditalComissao } from '@/types/database.types'

const TIPO_LABELS: Record<string, { label: string; color: string }> = {
  sociedade_civil: { label: 'Sociedade Civil', color: 'bg-blue-50 text-blue-600' },
  poder_executivo: { label: 'Poder Executivo', color: 'bg-purple-50 text-purple-600' },
  suplente: { label: 'Suplente', color: 'bg-slate-50 text-slate-500' },
}

export default async function ComissaoPage({
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

  const { data: membros } = await supabase
    .from('edital_comissao')
    .select('*')
    .eq('edital_id', id)
    .order('tipo')
    .order('nome')

  const membrosList = (membros || []) as EditalComissao[]
  const porTipo = {
    sociedade_civil: membrosList.filter(m => m.tipo === 'sociedade_civil'),
    poder_executivo: membrosList.filter(m => m.tipo === 'poder_executivo'),
    suplente: membrosList.filter(m => m.tipo === 'suplente'),
  }

  async function handleAdicionar(formData: FormData) {
    'use server'
    const supabase2 = await createClient()
    const nome = formData.get('nome') as string
    const cpf = formData.get('cpf') as string
    const qualificacao = formData.get('qualificacao') as string
    const tipo = formData.get('tipo') as string
    const portaria_numero = formData.get('portaria_numero') as string

    if (!nome?.trim()) return

    const { data: { user } } = await supabase2.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase2.from('profiles').select('tenant_id').eq('id', user.id).single()
    if (!profile) return

    await supabase2.from('edital_comissao').insert({
      edital_id: id,
      tenant_id: profile.tenant_id,
      nome,
      cpf: cpf || null,
      qualificacao: qualificacao || null,
      tipo: tipo || 'sociedade_civil',
      portaria_numero: portaria_numero || null,
    })

    revalidatePath(`/admin/editais/${id}/comissao`)
  }

  async function handleRemover(formData: FormData) {
    'use server'
    const membroId = formData.get('membroId') as string
    const supabase2 = await createClient()
    await supabase2.from('edital_comissao').delete().eq('id', membroId)
    revalidatePath(`/admin/editais/${id}/comissao`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Comissão de Avaliação</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-slate-100 text-slate-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
                {membrosList.length} membro{membrosList.length !== 1 ? 's' : ''}
              </Badge>
              {membrosList.length > 0 && (
                <a href={`/api/pdf/portaria-comissao/${id}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="h-9 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 font-semibold text-sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Gerar Portaria PDF
                  </Button>
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Adicionar Membro */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
            Adicionar Membro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleAdicionar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nome Completo *</label>
                <input name="nome" required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">CPF</label>
                <input name="cpf" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Qualificação / Cargo</label>
                <input name="qualificacao" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" placeholder="Ex: Produtor cultural, Técnico de cultura" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tipo *</label>
                <select name="tipo" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]">
                  <option value="sociedade_civil">Sociedade Civil</option>
                  <option value="poder_executivo">Poder Executivo</option>
                  <option value="suplente">Suplente</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Nº da Portaria</label>
                <input name="portaria_numero" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]" placeholder="Ex: Portaria nº 123/2026" />
              </div>
            </div>
            <Button type="submit" className="h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Membros por Tipo */}
      {Object.entries(porTipo).map(([tipo, membros]) => {
        if (membros.length === 0) return null
        const config = TIPO_LABELS[tipo] || TIPO_LABELS.sociedade_civil
        return (
          <Card key={tipo} className="border border-slate-200 shadow-sm bg-white rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-slate-400" />
                {config.label} ({membros.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {membros.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">{m.nome}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        {m.cpf && <span className="text-[11px] text-slate-400">{m.cpf}</span>}
                        {m.qualificacao && <span className="text-[11px] text-slate-400">{m.qualificacao}</span>}
                        {m.portaria_numero && (
                          <Badge className="bg-slate-100 text-slate-500 border-none text-[10px] px-1.5 py-0 rounded-md">
                            {m.portaria_numero}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <form action={handleRemover}>
                      <input type="hidden" name="membroId" value={m.id} />
                      <Button type="submit" size="sm" variant="ghost" className="h-7 w-7 p-0 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {membrosList.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Shield className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">Nenhum membro cadastrado</p>
          <p className="text-xs text-slate-300 mt-1">Adicione os membros da comissão de avaliação acima.</p>
        </div>
      )}
    </div>
  )
}
