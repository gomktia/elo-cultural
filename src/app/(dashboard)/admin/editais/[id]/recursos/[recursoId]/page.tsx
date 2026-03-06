import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RecursoDecisaoWrapper } from '@/components/admin/RecursoDecisaoWrapper'
import { AssinaturaDecisaoButton } from '@/components/admin/AssinaturaDecisaoButton'
import { buscarAssinaturaDecisao } from '@/lib/actions/assinar-decisao'
import { ArrowLeft, FileText, User, Calendar, Scale, AlertTriangle, Download } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function RecursoDetalhePage({
  params,
}: {
  params: Promise<{ id: string; recursoId: string }>
}) {
  const { id: editalId, recursoId } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital')
    .eq('id', editalId)
    .single()

  if (!edital) notFound()

  const { data: recurso } = await supabase
    .from('recursos')
    .select('*, profiles!recursos_proponente_id_fkey(nome, cpf_cnpj), projetos(id, titulo, numero_protocolo, resumo, orcamento_total, status_habilitacao, nota_final, categoria_id, edital_id)')
    .eq('id', recursoId)
    .single()

  if (!recurso) notFound()

  // Get avaliacoes for the project (for side-by-side view)
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('id, pontuacao_total, justificativa, status, avaliador_id, profiles!avaliacoes_avaliador_id_fkey(nome)')
    .eq('projeto_id', recurso.projeto_id)
    .order('created_at')

  // Get criterio scores for each avaliacao
  const avaliacaoIds = (avaliacoes || []).map((a: any) => a.id)
  const { data: criterioNotas } = avaliacaoIds.length > 0
    ? await supabase
      .from('avaliacao_criterios')
      .select('avaliacao_id, criterio_id, nota, comentario, criterios(id, descricao, peso, nota_minima, nota_maxima)')
      .in('avaliacao_id', avaliacaoIds)
      .order('created_at')
    : { data: [] }

  // Get anexos do recurso
  const { data: anexos } = await supabase
    .from('recurso_anexos')
    .select('id, storage_path, nome_arquivo, created_at')
    .eq('recurso_id', recursoId)

  // Get decisor name if decided
  let decisorNome = null
  if (recurso.decidido_por) {
    const { data: decisor } = await supabase
      .from('profiles')
      .select('nome')
      .eq('id', recurso.decidido_por)
      .single()
    decisorNome = decisor?.nome
  }

  // Fetch digital signature for this decision
  const assinatura = (recurso.status === 'deferido' || recurso.status === 'indeferido' || recurso.status === 'deferido_parcial')
    ? await buscarAssinaturaDecisao(recursoId)
    : null

  // Fetch revisoes for this recurso (for deferimento parcial)
  const { data: revisoes } = await supabase
    .from('recurso_revisoes')
    .select('id, avaliador_id, status, criterios_revisar')
    .eq('recurso_id', recursoId)

  // Fetch avaliador names for revisoes
  const revisaoAvaliadorIds = [...new Set((revisoes || []).map((r: any) => r.avaliador_id))]
  const { data: revisaoProfiles } = revisaoAvaliadorIds.length > 0
    ? await supabase.from('profiles').select('id, nome').in('id', revisaoAvaliadorIds)
    : { data: [] }
  const revisaoProfileMap = new Map((revisaoProfiles || []).map((p: any) => [p.id, p.nome]))

  // Build avaliacoes data for partial deferment panel
  const avaliacoesForPanel = (avaliacoes || []).map((av: any, idx: number) => {
    const notasAv = (criterioNotas || []).filter((cn: any) => cn.avaliacao_id === av.id)
    return {
      id: av.id,
      avaliador_id: av.avaliador_id,
      avaliador_nome: (av.profiles as any)?.nome || `Parecerista ${idx + 1}`,
      pontuacao_total: av.pontuacao_total,
      criterios: notasAv.map((nc: any) => ({
        criterio_id: nc.criterio_id || (nc.criterios as any)?.id,
        descricao: (nc.criterios as any)?.descricao || '',
        nota: Number(nc.nota),
        nota_maxima: Number((nc.criterios as any)?.nota_maxima || 10),
        peso: Number((nc.criterios as any)?.peso || 1),
      })),
    }
  })

  // Build revisoes data for finalization panel
  const revisoesPendentes = (revisoes || []).map((rev: any) => ({
    id: rev.id,
    avaliador_id: rev.avaliador_id,
    avaliador_nome: revisaoProfileMap.get(rev.avaliador_id) || 'Parecerista',
    status: rev.status,
    criterios_revisar: rev.criterios_revisar || [],
  }))

  const statusColor = recurso.status === 'deferido' ? 'bg-green-50 text-green-700' :
    recurso.status === 'indeferido' ? 'bg-red-50 text-red-700' :
    recurso.status === 'em_analise' ? 'bg-blue-50 text-blue-700' :
    recurso.status === 'deferido_parcial' ? 'bg-purple-50 text-purple-700' :
    'bg-amber-50 text-amber-700'

  const statusLabel = recurso.status === 'deferido' ? 'Deferido' :
    recurso.status === 'indeferido' ? 'Indeferido' :
    recurso.status === 'em_analise' ? 'Em Analise' :
    recurso.status === 'deferido_parcial' ? 'Deferido Parcial' : 'Pendente'

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <div className="h-1 w-full bg-amber-500" />
        <CardContent className="p-4">
          <div className="flex items-start gap-5">
            <Link href={`/admin/editais/${editalId}/recursos`}>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 transition-all mt-0.5">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">Analise de Recurso</h1>
                <Badge className={`border-none rounded-lg px-2 text-xs font-medium uppercase tracking-wide py-1 ${statusColor}`}>
                  {statusLabel}
                </Badge>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {recurso.numero_protocolo}
                </code>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-sm text-slate-500">{edital.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Left = Recurso, Right = Pareceres */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recurso Details */}
        <div className="space-y-4">
          {/* Proponente + Projeto */}
          <Card className="border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" /> Proponente e Projeto
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Proponente</p>
                  <p className="text-sm font-medium text-slate-900">{(recurso.profiles as any)?.nome}</p>
                  {(recurso.profiles as any)?.cpf_cnpj && (
                    <p className="text-xs text-slate-500">{(recurso.profiles as any).cpf_cnpj}</p>
                  )}
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Protocolo Projeto</p>
                  <p className="text-sm font-medium text-slate-900">{(recurso.projetos as any)?.numero_protocolo}</p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Projeto</p>
                <p className="text-sm font-semibold text-slate-900">{(recurso.projetos as any)?.titulo}</p>
                {(recurso.projetos as any)?.resumo && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">{(recurso.projetos as any).resumo}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Tipo Recurso</p>
                  <p className="text-sm font-medium text-slate-900">{recurso.tipo === 'habilitacao' ? 'Habilitacao' : 'Avaliacao'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Habilitacao</p>
                  <Badge variant="outline" className="text-[11px] mt-0.5">
                    {(recurso.projetos as any)?.status_habilitacao}
                  </Badge>
                </div>
                <div>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">Nota Final</p>
                  <p className="text-sm font-semibold text-slate-900">
                    {(recurso.projetos as any)?.nota_final != null ? (recurso.projetos as any).nota_final.toFixed(1) : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fundamentacao */}
          <Card className="border border-amber-200 rounded-2xl shadow-sm bg-amber-50/30">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-500" /> Fundamentacao do Recurso
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{recurso.fundamentacao}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(recurso.created_at), "dd 'de' MMMM 'de' yyyy 'as' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          {anexos && anexos.length > 0 && (
            <Card className="border border-slate-200 rounded-2xl shadow-sm">
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" /> Anexos ({anexos.length})
                </h3>
                <div className="space-y-2">
                  {anexos.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-xs font-medium text-slate-700 truncate">{a.nome_arquivo}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Decisao (if already decided) */}
          {recurso.decisao && (
            <Card className={`border rounded-2xl shadow-sm ${
              recurso.status === 'deferido' ? 'border-green-200 bg-green-50/30' :
              recurso.status === 'deferido_parcial' ? 'border-purple-200 bg-purple-50/30' :
              'border-red-200 bg-red-50/30'
            }`}>
              <CardContent className="p-5 space-y-3">
                <h3 className={`text-sm font-semibold flex items-center gap-2 ${
                  recurso.status === 'deferido' ? 'text-green-900' :
                  recurso.status === 'deferido_parcial' ? 'text-purple-900' :
                  'text-red-900'
                }`}>
                  {recurso.status === 'deferido' ? '✓' : recurso.status === 'deferido_parcial' ? '↻' : '✕'} Decisao
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{recurso.decisao}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  {decisorNome && <span>Decidido por: {decisorNome}</span>}
                  {recurso.data_decisao && (
                    <span>{format(new Date(recurso.data_decisao), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR })}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* PDF Decisao Button */}
          {(recurso.status === 'deferido' || recurso.status === 'indeferido' || recurso.status === 'deferido_parcial') && recurso.decisao && (
            <a href={`/api/pdf/decisao/${recursoId}`} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="w-full h-10 rounded-xl border-[var(--brand-primary)]/20 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/5 font-semibold text-sm">
                <Download className="mr-2 h-4 w-4" />
                Gerar PDF Decisao Administrativa
              </Button>
            </a>
          )}

          {/* Assinatura Digital da Decisao */}
          {(recurso.status === 'deferido' || recurso.status === 'indeferido' || recurso.status === 'deferido_parcial') && recurso.decisao && (
            <AssinaturaDecisaoButton
              recursoId={recursoId}
              editalId={editalId}
              assinatura={assinatura ? {
                hash_documento: assinatura.hash_documento,
                nome_signatario: assinatura.nome_signatario,
                assinado_em: assinatura.assinado_em,
                ip_address: assinatura.ip_address,
              } : null}
            />
          )}

          {/* Decision Panel (if pending or deferido_parcial) */}
          {(recurso.status === 'pendente' || recurso.status === 'em_analise' || recurso.status === 'deferido_parcial') && (
            <RecursoDecisaoWrapper
              recursoId={recursoId}
              editalId={editalId}
              fundamentacao={recurso.fundamentacao}
              recursoStatus={recurso.status}
              avaliacoes={avaliacoesForPanel}
              revisoesPendentes={revisoesPendentes}
            />
          )}
        </div>

        {/* Right: Pareceres (Avaliacoes) */}
        <div className="space-y-4">
          <Card className="border border-slate-200 rounded-2xl shadow-sm">
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-500" /> Pareceres dos Avaliadores
              </h3>

              {(!avaliacoes || avaliacoes.length === 0) ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Nenhuma avaliacao registrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {avaliacoes.map((av: any, idx: number) => {
                    const notasAv = (criterioNotas || []).filter((cn: any) => cn.avaliacao_id === av.id)
                    return (
                      <div key={av.id} className="bg-slate-50 rounded-xl border border-slate-100 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-xs">
                              P{idx + 1}
                            </div>
                            <span className="text-sm font-semibold text-slate-900">
                              {(av.profiles as any)?.nome || `Parecerista ${idx + 1}`}
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-slate-900">
                              {av.pontuacao_total != null ? av.pontuacao_total.toFixed(1) : '—'}
                            </p>
                            <p className="text-[11px] text-slate-400 uppercase tracking-wide">pontos</p>
                          </div>
                        </div>

                        {/* Notas por criterio */}
                        {notasAv.length > 0 && (
                          <div className="space-y-1.5">
                            {notasAv.map((nc: any, i: number) => (
                              <div key={i} className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 truncate max-w-[60%]">
                                  {(nc.criterios as any)?.descricao}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-slate-900">{nc.nota}</span>
                                  <span className="text-slate-400">
                                    / {(nc.criterios as any)?.nota_maxima}
                                  </span>
                                  {(nc.criterios as any)?.peso > 1 && (
                                    <span className="text-[10px] text-purple-500 font-medium">x{(nc.criterios as any).peso}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Parecer do avaliador */}
                        {av.justificativa && (
                          <div className="border-t border-slate-200 pt-2">
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide mb-1">Parecer</p>
                            <p className="text-xs text-slate-600 leading-relaxed">{av.justificativa}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Discrepancia alert */}
                  {avaliacoes.length >= 2 && (() => {
                    const notas = avaliacoes.filter((a: any) => a.pontuacao_total != null).map((a: any) => a.pontuacao_total)
                    if (notas.length >= 2) {
                      const max = Math.max(...notas)
                      const min = Math.min(...notas)
                      const diff = max - min
                      if (diff > 20) {
                        return (
                          <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl border border-red-100">
                            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="text-xs font-medium text-red-700">
                              Discrepancia de {diff.toFixed(1)} pontos entre pareceristas
                            </span>
                          </div>
                        )
                      }
                    }
                    return null
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
