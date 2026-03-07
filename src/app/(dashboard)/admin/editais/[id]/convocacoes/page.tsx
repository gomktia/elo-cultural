import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, UserPlus, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { convocarSuplente, atualizarConvocacao } from '@/lib/actions/convocacao-actions'
import type { Convocacao, Profile, Projeto } from '@/types/database.types'

interface ConvocacaoJoined extends Convocacao {
  projetos: (Pick<Projeto, 'titulo' | 'numero_protocolo' | 'nota_final'> & {
    proponente_id: string
    profiles: Pick<Profile, 'nome'> | null
  }) | null
  projeto_substituido: Pick<Projeto, 'titulo' | 'numero_protocolo'> | null
}

interface SelecionadoProjeto {
  id: string
  titulo: string
  numero_protocolo: string
  nota_final: number | null
  status_atual: string
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  convocado: { label: 'Convocado', color: 'bg-blue-50 text-blue-600', icon: Clock },
  habilitado: { label: 'Habilitado', color: 'bg-green-50 text-green-600', icon: CheckCircle },
  inabilitado: { label: 'Inabilitado', color: 'bg-red-50 text-red-600', icon: XCircle },
  desistente: { label: 'Desistente', color: 'bg-slate-50 text-slate-500', icon: XCircle },
  prazo_expirado: { label: 'Prazo Expirado', color: 'bg-amber-50 text-amber-600', icon: AlertTriangle },
}

export default async function ConvocacoesPage({
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

  // Load convocações with project and profile info
  const { data: convocacoes } = await supabase
    .from('convocacoes')
    .select('*, projetos:projeto_id(titulo, numero_protocolo, nota_final, proponente_id, profiles:proponente_id(nome)), projeto_substituido:projeto_substituido_id(titulo, numero_protocolo)')
    .eq('edital_id', id)
    .order('created_at', { ascending: false })

  const convocacoesList = (convocacoes || []) as unknown as ConvocacaoJoined[]

  // Load selecionados (for convocation source)
  const { data: selecionados } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, nota_final, status_atual')
    .eq('edital_id', id)
    .in('status_atual', ['selecionado'])
    .order('nota_final', { ascending: false })

  // Load suplentes count
  const { count: suplentesCount } = await supabase
    .from('projetos')
    .select('id', { count: 'exact', head: true })
    .eq('edital_id', id)
    .eq('status_atual', 'suplente')

  async function handleConvocar(formData: FormData) {
    'use server'
    const projetoSubstituidoId = formData.get('projetoSubstituidoId') as string
    const motivo = formData.get('motivo') as string
    if (!projetoSubstituidoId || !motivo) return
    await convocarSuplente(id, { projetoSubstituidoId, motivo })
  }

  async function handleAtualizar(formData: FormData) {
    'use server'
    const convocacaoId = formData.get('convocacaoId') as string
    const status = formData.get('status') as 'habilitado' | 'inabilitado' | 'desistente' | 'prazo_expirado'
    const observacao = formData.get('observacao') as string
    await atualizarConvocacao(convocacaoId, id, { status, observacao })
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
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Convocações de Suplentes</h1>
                <div className="flex items-center gap-3 flex-wrap">
                  <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                    {edital.numero_edital}
                  </code>
                  <span className="text-sm text-slate-500">{edital.titulo}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className="bg-blue-50 text-blue-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
                {convocacoesList.length} convocação(ões)
              </Badge>
              <Badge className="bg-slate-100 text-slate-600 border-none text-xs font-medium px-2.5 py-1 rounded-lg">
                {suplentesCount || 0} suplente(s) disponível(is)
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nova Convocação */}
      {(selecionados || []).length > 0 && (suplentesCount || 0) > 0 && (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[var(--brand-primary)]" />
              Nova Convocação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleConvocar} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Projeto a Substituir (selecionado que será inabilitado) *</label>
                <select
                  name="projetoSubstituidoId"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                >
                  <option value="">Selecione o projeto...</option>
                  {(selecionados || []).map((p: SelecionadoProjeto) => (
                    <option key={p.id} value={p.id}>
                      {p.numero_protocolo} — {p.titulo} (nota: {Number(p.nota_final).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Motivo da Substituição *</label>
                <textarea
                  name="motivo"
                  required
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]"
                  placeholder="Ex: Proponente inabilitado por documentação irregular..."
                />
              </div>
              <Button type="submit" className="h-10 rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm">
                <UserPlus className="mr-2 h-4 w-4" />
                Convocar Próximo Suplente
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {(suplentesCount || 0) === 0 && convocacoesList.length === 0 && (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <UserPlus className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-400">Nenhum suplente disponível</p>
          <p className="text-xs text-slate-300 mt-1">Consolide o ranking primeiro para gerar a lista de suplentes.</p>
        </div>
      )}

      {/* Histórico de Convocações */}
      {convocacoesList.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-medium uppercase tracking-wide text-slate-400 px-1">Histórico de Convocações</h2>
          {convocacoesList.map((conv: ConvocacaoJoined) => {
            const config = STATUS_CONFIG[conv.status] || STATUS_CONFIG.convocado
            const prazoExpirado = conv.prazo_habilitacao && new Date(conv.prazo_habilitacao) < new Date() && conv.status === 'convocado'
            const projeto = conv.projetos || {} as Partial<NonNullable<ConvocacaoJoined['projetos']>>
            const substituido = conv.projeto_substituido || {} as Partial<NonNullable<ConvocacaoJoined['projeto_substituido']>>
            const proponente = (projeto.profiles as unknown as Pick<Profile, 'nome'> | null)?.nome || 'Proponente'

            return (
              <Card key={conv.id} className="border border-slate-200 shadow-sm bg-white rounded-2xl">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className="bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-none text-[11px] font-semibold px-2.5 py-0.5 rounded-md">
                          {conv.numero_chamada}ª Chamada
                        </Badge>
                        <Badge className={`border-none text-[11px] font-medium px-2 py-0.5 rounded-md ${config.color}`}>
                          {config.label}
                        </Badge>
                        {prazoExpirado && (
                          <Badge className="bg-red-50 text-red-600 border-none text-[11px] font-medium px-2 py-0.5 rounded-md">
                            Prazo Expirado
                          </Badge>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{projeto.titulo || '—'}</p>
                        <p className="text-xs text-slate-500">
                          {projeto.numero_protocolo} · Proponente: {proponente} · Nota: {Number(projeto.nota_final || 0).toFixed(2)}
                        </p>
                      </div>
                      {substituido.titulo && (
                        <p className="text-xs text-slate-400">
                          Substituindo: <span className="font-medium text-slate-500">{substituido.titulo}</span> ({substituido.numero_protocolo})
                        </p>
                      )}
                      <p className="text-xs text-slate-400">Motivo: {conv.motivo}</p>
                      <div className="flex gap-4 text-[11px] text-slate-400">
                        <span>Convocado em {format(new Date(conv.data_convocacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        {conv.prazo_habilitacao && (
                          <span>Prazo: {format(new Date(conv.prazo_habilitacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                        )}
                      </div>
                      {conv.observacao && <p className="text-xs text-slate-500 italic">{conv.observacao}</p>}
                    </div>

                    {conv.status === 'convocado' && (
                      <div className="flex flex-col gap-1.5 flex-shrink-0">
                        <form action={handleAtualizar}>
                          <input type="hidden" name="convocacaoId" value={conv.id} />
                          <input type="hidden" name="status" value="habilitado" />
                          <Button type="submit" size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-semibold gap-1 w-full">
                            <CheckCircle className="h-3 w-3" /> Habilitar
                          </Button>
                        </form>
                        <form action={handleAtualizar}>
                          <input type="hidden" name="convocacaoId" value={conv.id} />
                          <input type="hidden" name="status" value="inabilitado" />
                          <Button type="submit" size="sm" variant="outline" className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 text-xs font-semibold gap-1 w-full">
                            <XCircle className="h-3 w-3" /> Inabilitar
                          </Button>
                        </form>
                        <form action={handleAtualizar}>
                          <input type="hidden" name="convocacaoId" value={conv.id} />
                          <input type="hidden" name="status" value="desistente" />
                          <Button type="submit" size="sm" variant="outline" className="rounded-xl text-slate-500 border-slate-200 hover:bg-slate-50 text-xs font-semibold w-full">
                            Desistência
                          </Button>
                        </form>
                        {prazoExpirado && (
                          <form action={handleAtualizar}>
                            <input type="hidden" name="convocacaoId" value={conv.id} />
                            <input type="hidden" name="status" value="prazo_expirado" />
                            <Button type="submit" size="sm" variant="outline" className="rounded-xl text-amber-600 border-amber-200 hover:bg-amber-50 text-xs font-semibold gap-1 w-full">
                              <AlertTriangle className="h-3 w-3" /> Prazo Expirado
                            </Button>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
