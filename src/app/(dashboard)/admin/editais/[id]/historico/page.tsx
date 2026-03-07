import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, History, ChevronDown, ChevronRight } from 'lucide-react'
import type { LogAuditoria, EditalErrata, Profile } from '@/types/database.types'

export default async function HistoricoPage({
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

  // Load audit logs for this edital
  const { data: logs } = await supabase
    .from('logs_auditoria')
    .select('id, acao, dados_antigos, dados_novos, created_at, usuario_id, profiles:usuario_id(nome)')
    .eq('registro_id', id)
    .eq('tabela_afetada', 'editais')
    .order('created_at', { ascending: false })
    .limit(50)

  // Also load errata history
  const { data: erratas } = await supabase
    .from('edital_erratas')
    .select('id, numero_errata, descricao, campo_alterado, valor_anterior, valor_novo, publicado_em, created_at')
    .eq('edital_id', id)
    .order('numero_errata', { ascending: false })

  type LogEntry = LogAuditoria & { profiles: Pick<Profile, 'nome'> | null }
  type ErrataEntry = EditalErrata

  const logsList = (logs || []) as unknown as LogEntry[]
  const erratasList = (erratas || []) as unknown as ErrataEntry[]

  // Merge into timeline
  type TimelineItem =
    | { type: 'audit'; date: string; data: LogEntry }
    | { type: 'errata'; date: string; data: ErrataEntry }

  const timeline: TimelineItem[] = [
    ...logsList.map(l => ({ type: 'audit' as const, date: l.created_at, data: l })),
    ...erratasList.map(e => ({ type: 'errata' as const, date: e.created_at, data: e })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
              <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Histórico de Alterações</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <code className="text-[11px] font-semibold text-[var(--brand-primary)] bg-[var(--brand-primary)]/8 px-2.5 py-1 rounded-md uppercase tracking-wide">
                  {edital.numero_edital}
                </code>
                <span className="text-sm text-slate-500">{edital.titulo}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {timeline.length === 0 ? (
        <Card className="border border-slate-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <History className="h-12 w-12 text-slate-200 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma alteração registrada</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-slate-200" />

          <div className="space-y-4">
            {timeline.map((item, i) => (
              <div key={i} className="relative pl-14">
                {/* Timeline dot */}
                <div className={`absolute left-[18px] w-4 h-4 rounded-full border-2 ${
                  item.type === 'errata'
                    ? 'bg-amber-100 border-amber-400'
                    : 'bg-blue-100 border-blue-400'
                }`} />

                <Card className="border border-slate-200 shadow-sm bg-white rounded-xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        {item.type === 'errata' ? (
                          <>
                            <p className="text-sm font-semibold text-amber-700">
                              Errata nº {item.data.numero_errata}
                              {item.data.publicado_em && (
                                <span className="text-[11px] font-medium text-green-600 ml-2">Publicada</span>
                              )}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">{item.data.descricao}</p>
                            {item.data.campo_alterado && (
                              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs space-y-1">
                                <p className="font-medium text-slate-500">Campo: {item.data.campo_alterado}</p>
                                {item.data.valor_anterior && (
                                  <p className="text-red-600">
                                    <span className="text-slate-400">De:</span> {item.data.valor_anterior}
                                  </p>
                                )}
                                {item.data.valor_novo && (
                                  <p className="text-green-600">
                                    <span className="text-slate-400">Para:</span> {item.data.valor_novo}
                                  </p>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-slate-900">{item.data.acao}</p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              por {(item.data.profiles as unknown as { nome: string } | null)?.nome || 'Sistema'}
                            </p>
                            {item.data.dados_novos && Object.keys(item.data.dados_novos).length > 0 && (
                              <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs">
                                <p className="font-medium text-slate-500 mb-1">Alterações:</p>
                                <div className="space-y-1">
                                  {Object.entries(item.data.dados_novos).slice(0, 10).map(([key, val]) => {
                                    const oldVal = item.data.dados_antigos?.[key]
                                    return (
                                      <div key={key} className="flex gap-2">
                                        <span className="text-slate-400 font-mono">{key}:</span>
                                        {oldVal !== undefined && oldVal !== val && (
                                          <span className="text-red-500 line-through">{String(oldVal)}</span>
                                        )}
                                        <span className="text-green-600">{String(val)}</span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex-shrink-0">
                        {new Date(item.date).toLocaleDateString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
