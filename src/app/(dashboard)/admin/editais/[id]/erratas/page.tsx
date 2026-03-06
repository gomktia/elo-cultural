import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FilePlus, Send, Trash2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { criarErrata, publicarErrata, excluirErrata } from '@/lib/actions/erratas-actions'
import { revalidatePath } from 'next/cache'
import type { EditalErrata } from '@/types/database.types'

export default async function ErratasPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  const { data: erratas } = await supabase
    .from('edital_erratas')
    .select('*, profiles:publicado_por(nome)')
    .eq('edital_id', id)
    .order('numero_errata', { ascending: false })

  const erratasList = (erratas || []) as (EditalErrata & { profiles: { nome: string } | null })[]

  async function handleCriar(formData: FormData) {
    'use server'
    const descricao = formData.get('descricao') as string
    const campo_alterado = formData.get('campo_alterado') as string
    const valor_anterior = formData.get('valor_anterior') as string
    const valor_novo = formData.get('valor_novo') as string
    if (!descricao?.trim()) return
    await criarErrata(id, { descricao, campo_alterado, valor_anterior, valor_novo })
  }

  async function handlePublicar(formData: FormData) {
    'use server'
    const errataId = formData.get('errataId') as string
    await publicarErrata(errataId, id)
  }

  async function handleExcluir(formData: FormData) {
    'use server'
    const errataId = formData.get('errataId') as string
    await excluirErrata(errataId, id)
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
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Erratas</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <Badge className="bg-slate-100 text-slate-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
              {erratasList.length} errata{erratasList.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Nova Errata Form */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FilePlus className="h-4 w-4 text-[var(--brand-primary)]" />
            Nova Errata
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleCriar} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Descrição da Errata *</label>
              <textarea
                name="descricao"
                required
                rows={3}
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                placeholder="Descreva a alteração realizada no edital..."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Campo Alterado</label>
                <input
                  name="campo_alterado"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  placeholder="Ex: Prazo de inscrição"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor Anterior</label>
                <input
                  name="valor_anterior"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  placeholder="Ex: 15/03/2026"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Valor Novo</label>
                <input
                  name="valor_novo"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  placeholder="Ex: 22/03/2026"
                />
              </div>
            </div>
            <Button type="submit" className="h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm">
              <FilePlus className="mr-2 h-4 w-4" />
              Criar Errata
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Erratas */}
      <div className="space-y-3">
        {erratasList.map(errata => (
          <Card key={errata.id} className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                      Errata #{errata.numero_errata}
                    </Badge>
                    {errata.publicado_em ? (
                      <Badge className="bg-green-50 text-green-600 border-none text-[11px] font-medium px-2 py-0.5 rounded-md">
                        Publicada em {format(new Date(errata.publicado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-600 border-none text-[11px] font-medium px-2 py-0.5 rounded-md">
                        Rascunho
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{errata.descricao}</p>
                  {errata.campo_alterado && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2.5">
                      <span className="font-semibold text-slate-600">{errata.campo_alterado}:</span>
                      {errata.valor_anterior && (
                        <span className="line-through text-red-400">{errata.valor_anterior}</span>
                      )}
                      {errata.valor_anterior && errata.valor_novo && (
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                      )}
                      {errata.valor_novo && (
                        <span className="font-semibold text-green-600">{errata.valor_novo}</span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400">
                    Criada em {format(new Date(errata.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    {errata.profiles?.nome && ` · Publicada por ${errata.profiles.nome}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {!errata.publicado_em && (
                    <>
                      <form action={handlePublicar}>
                        <input type="hidden" name="errataId" value={errata.id} />
                        <Button type="submit" size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold gap-1.5">
                          <Send className="h-3 w-3" />
                          Publicar
                        </Button>
                      </form>
                      <form action={handleExcluir}>
                        <input type="hidden" name="errataId" value={errata.id} />
                        <Button type="submit" size="sm" variant="outline" className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 text-xs font-semibold gap-1.5">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {erratasList.length === 0 && (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <FilePlus className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">Nenhuma errata registrada</p>
            <p className="text-xs text-slate-300 mt-1">Crie uma errata acima para registrar alterações no edital.</p>
          </div>
        )}
      </div>
    </div>
  )
}
