'use client'

import { useState, useCallback, useRef, useEffect, Fragment } from 'react'
import {
    Brain,
    Sparkles,
    AlertTriangle,
    CheckCircle,
    XCircle,
    FileCheck,
    ChevronDown,
    ChevronUp,
    Loader2,
    FileWarning,
    Copy,
    DollarSign,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { TriagemExecucao } from '@/types/database.types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResultadoNota {
    criterio_id: string
    nota_sugerida: number
    justificativa: string
    confianca: number
    criterios: {
        descricao: string
        nota_minima: number
        nota_maxima: number
        peso: number
    } | null
}

interface IrregularidadeFlag {
    tipo: string
    projeto_similar_id?: string
    similaridade?: number
}

interface Resultado {
    id: string
    projeto_id: string
    habilitacao_sugerida: string | null
    habilitacao_motivo: string | null
    docs_completos: boolean
    docs_problemas: string[]
    irregularidades_flags: IrregularidadeFlag[] | string[]
    similaridade_max: number
    projeto_similar_id: string | null
    projetos: {
        titulo: string
        numero_protocolo: string
        resumo: string
        orcamento_total: number
    } | null
    projeto_similar: {
        titulo: string
        numero_protocolo: string
    } | null
    notas: ResultadoNota[]
}

interface TriagemPanelProps {
    editalId: string
    execucao: TriagemExecucao | null
    resultados: Resultado[]
}

type TabKey = 'habilitacao' | 'avaliacao' | 'irregularidades'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcNotaMedia(notas: ResultadoNota[]): number {
    let soma = 0
    let pesoTotal = 0
    for (const n of notas) {
        const peso = n.criterios?.peso ?? 1
        soma += n.nota_sugerida * peso
        pesoTotal += peso
    }
    if (pesoTotal === 0) return 0
    return Math.round((soma / pesoTotal) * 100) / 100
}

function notaColor(nota: number): string {
    if (nota >= 7) return 'text-emerald-600'
    if (nota >= 5) return 'text-amber-600'
    return 'text-red-600'
}

function notaBgColor(nota: number): string {
    if (nota >= 7) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    if (nota >= 5) return 'bg-amber-50 text-amber-700 border-amber-200'
    return 'bg-red-50 text-red-700 border-red-200'
}

function confiancaBar(confianca: number) {
    const pct = Math.round(confianca * 100)
    let color = 'bg-emerald-500'
    if (pct < 50) color = 'bg-red-400'
    else if (pct < 70) color = 'bg-amber-400'

    return (
        <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${pct}%` }}
                />
            </div>
            <span className="text-xs text-slate-500 font-medium tabular-nums">{pct}%</span>
        </div>
    )
}

function habBadge(sugestao: string | null) {
    if (sugestao === 'habilitado') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full">
                <CheckCircle className="h-3 w-3" />
                Habilitado
            </span>
        )
    }
    if (sugestao === 'inabilitado') {
        return (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide bg-red-50 text-red-700 border border-red-200 px-2.5 py-1 rounded-full">
                <XCircle className="h-3 w-3" />
                Inabilitado
            </span>
        )
    }
    return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Pendência
        </span>
    )
}

function parseFlags(flags: IrregularidadeFlag[] | string[]): IrregularidadeFlag[] {
    if (!flags || flags.length === 0) return []
    // If they are already objects
    if (typeof flags[0] === 'object') return flags as IrregularidadeFlag[]
    // If they are strings, try to parse each
    return (flags as string[]).map((f) => {
        try {
            return JSON.parse(f) as IrregularidadeFlag
        } catch {
            return { tipo: f }
        }
    })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TriagemPanel({ editalId, execucao, resultados }: TriagemPanelProps) {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabKey>('habilitacao')
    const [isRunning, setIsRunning] = useState(false)
    const [progress, setProgress] = useState({ current: 0, total: 0 })
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Cleanup polling interval on unmount
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
            }
        }
    }, [])

    // Toggle expanded row for avaliação detail
    const toggleRow = useCallback((id: string) => {
        setExpandedRows((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }, [])

    // ------- Run triagem -------
    const handleRunTriagem = useCallback(async () => {
        setIsRunning(true)
        setProgress({ current: 0, total: 0 })

        try {
            // 1. Kick off the triagem
            const res = await fetch('/api/ia/triagem', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ edital_id: editalId }),
            })

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Erro ao iniciar triagem')
            }

            // 2. Poll status
            const poll = async () => {
                const statusRes = await fetch(`/api/ia/triagem/${editalId}/status`)
                if (!statusRes.ok) return null
                return statusRes.json()
            }

            let attempts = 0
            const maxAttempts = 200 // ~10min at 3s intervals

            const pollLoop = () =>
                new Promise<void>((resolve, reject) => {
                    const interval = setInterval(async () => {
                        attempts++
                        if (attempts > maxAttempts) {
                            clearInterval(interval)
                            pollIntervalRef.current = null
                            reject(new Error('Timeout: triagem demorou demais'))
                            return
                        }

                        try {
                            const status = await poll()
                            if (!status) return

                            if (status.total_projetos > 0) {
                                setProgress({
                                    current: status.projetos_analisados || 0,
                                    total: status.total_projetos,
                                })
                            }

                            if (status.status === 'concluida') {
                                clearInterval(interval)
                                pollIntervalRef.current = null
                                resolve()
                            } else if (status.status === 'erro') {
                                clearInterval(interval)
                                pollIntervalRef.current = null
                                reject(new Error(status.erro_mensagem || 'Erro na triagem'))
                            }
                        } catch {
                            // Keep polling on network errors
                        }
                    }, 3000)
                    pollIntervalRef.current = interval
                })

            await pollLoop()

            toast.success('Triagem concluída com sucesso!')
            router.refresh()
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro desconhecido'
            toast.error(message)
        } finally {
            setIsRunning(false)
        }
    }, [editalId, router])

    // ------- Collect irregularities across all resultados -------
    const allIrregularidades: Array<{
        resultado: Resultado
        flag: IrregularidadeFlag
    }> = []

    for (const r of resultados) {
        const flags = parseFlags(r.irregularidades_flags)
        for (const f of flags) {
            allIrregularidades.push({ resultado: r, flag: f })
        }
    }

    // ------- Tabs config -------
    const tabs: { key: TabKey; label: string; count?: number }[] = [
        { key: 'habilitacao', label: 'Habilitação', count: resultados.length },
        { key: 'avaliacao', label: 'Avaliação', count: resultados.length },
        { key: 'irregularidades', label: 'Irregularidades', count: allIrregularidades.length },
    ]

    // =========================================================================
    // Render
    // =========================================================================

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ---- Action bar ---- */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {execucao && (
                        <p className="text-sm text-slate-500 font-medium">
                            Última execução:{' '}
                            <span className="text-slate-700">
                                {new Date(execucao.concluida_em || execucao.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                            {' — '}
                            <span className="text-slate-700">{execucao.total_projetos} projetos analisados</span>
                        </p>
                    )}
                </div>
                <Button
                    onClick={handleRunTriagem}
                    disabled={isRunning}
                    className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white font-semibold text-sm rounded-xl px-5 h-10 shadow-sm"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analisando...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Executar Triagem Completa
                        </>
                    )}
                </Button>
            </div>

            {/* ---- Progress bar ---- */}
            {isRunning && progress.total > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">
                            Analisando projeto {progress.current} de {progress.total}...
                        </span>
                        <span className="text-xs font-medium text-slate-400 tabular-nums">
                            {progress.total > 0
                                ? Math.round((progress.current / progress.total) * 100)
                                : 0}
                            %
                        </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[var(--brand-primary)] transition-all duration-700 ease-out"
                            style={{
                                width: `${
                                    progress.total > 0
                                        ? (progress.current / progress.total) * 100
                                        : 0
                                }%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ---- Empty state ---- */}
            {!execucao && !isRunning && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center">
                        <Brain className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">
                        Nenhuma triagem realizada ainda
                    </h3>
                    <p className="text-sm font-medium text-slate-500 max-w-md">
                        Clique em &quot;Executar Triagem Completa&quot; para iniciar a análise automatizada
                        dos projetos inscritos neste edital.
                    </p>
                </div>
            )}

            {/* ---- Main content with tabs ---- */}
            {execucao && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {/* Tab bar */}
                    <div className="border-b border-slate-100 px-6">
                        <div className="flex gap-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`
                                        relative py-4 text-sm font-medium transition-colors duration-200
                                        ${
                                            activeTab === tab.key
                                                ? 'text-[var(--brand-primary)]'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        {tab.label}
                                        {typeof tab.count === 'number' && (
                                            <span
                                                className={`
                                                    text-[11px] font-medium tabular-nums px-1.5 py-0.5 rounded-md
                                                    ${
                                                        activeTab === tab.key
                                                            ? 'bg-blue-50 text-[var(--brand-primary)]'
                                                            : 'bg-slate-50 text-slate-400'
                                                    }
                                                `}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </span>
                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-primary)] rounded-full" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab content */}
                    <div className="p-6">
                        {activeTab === 'habilitacao' && (
                            <HabilitacaoTab resultados={resultados} />
                        )}
                        {activeTab === 'avaliacao' && (
                            <AvaliacaoTab
                                resultados={resultados}
                                expandedRows={expandedRows}
                                toggleRow={toggleRow}
                            />
                        )}
                        {activeTab === 'irregularidades' && (
                            <IrregularidadesTab
                                irregularidades={allIrregularidades}
                                resultados={resultados}
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Tab 1 — Habilitação
// ---------------------------------------------------------------------------

function HabilitacaoTab({ resultados }: { resultados: Resultado[] }) {
    if (resultados.length === 0) {
        return <EmptyTabState message="Nenhum resultado de habilitação encontrado." />
    }

    return (
        <Table>
            <TableHeader className="bg-[var(--brand-primary)]">
                <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Protocolo
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Titulo
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Sugestao IA
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Motivo
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-center">
                        Documentos
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {resultados.map((r) => (
                    <TableRow
                        key={r.id}
                        className="even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100"
                    >
                        <TableCell className="py-4 px-4">
                            <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
                                {r.projetos?.numero_protocolo || '—'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            <span className="text-sm font-semibold text-slate-900">
                                {r.projetos?.titulo || 'Sem título'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4">
                            {habBadge(r.habilitacao_sugerida)}
                        </TableCell>
                        <TableCell className="py-4 px-4 max-w-[260px]">
                            <span
                                className="text-sm text-slate-500 truncate block"
                                title={r.habilitacao_motivo || ''}
                            >
                                {r.habilitacao_motivo || '—'}
                            </span>
                        </TableCell>
                        <TableCell className="py-4 px-4 text-center">
                            {r.docs_completos ? (
                                <FileCheck className="h-4 w-4 text-emerald-500 mx-auto" />
                            ) : (
                                <XCircle className="h-4 w-4 text-red-400 mx-auto" />
                            )}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}

// ---------------------------------------------------------------------------
// Tab 2 — Avaliação
// ---------------------------------------------------------------------------

function AvaliacaoTab({
    resultados,
    expandedRows,
    toggleRow,
}: {
    resultados: Resultado[]
    expandedRows: Set<string>
    toggleRow: (id: string) => void
}) {
    if (resultados.length === 0) {
        return <EmptyTabState message="Nenhum resultado de avaliação encontrado." />
    }

    return (
        <Table>
            <TableHeader className="bg-[var(--brand-primary)]">
                <TableRow className="hover:bg-transparent border-[var(--brand-primary)]">
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white w-8" />
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Protocolo
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white">
                        Titulo
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-center">
                        Nota Media
                    </TableHead>
                    <TableHead className="py-4 px-4 font-semibold text-xs uppercase tracking-wide text-white text-center">
                        Confianca Media
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {resultados.map((r) => {
                    const notaMedia = calcNotaMedia(r.notas)
                    const confiancaMedia =
                        r.notas.length > 0
                            ? r.notas.reduce((sum, n) => sum + n.confianca, 0) / r.notas.length
                            : 0
                    const isExpanded = expandedRows.has(r.id)

                    return (
                        <Fragment key={r.id}>
                            <TableRow
                                className="even:bg-slate-50/40 hover:bg-slate-100/60 transition-all duration-300 border-slate-100 cursor-pointer"
                                onClick={() => toggleRow(r.id)}
                            >
                                <TableCell className="py-4 px-4">
                                    {isExpanded ? (
                                        <ChevronUp className="h-4 w-4 text-slate-400" />
                                    ) : (
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    )}
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                    <span className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md font-mono">
                                        {r.projetos?.numero_protocolo || '—'}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                    <span className="text-sm font-semibold text-slate-900">
                                        {r.projetos?.titulo || 'Sem título'}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 px-4 text-center">
                                    <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-bold tabular-nums border ${notaBgColor(
                                            notaMedia
                                        )}`}
                                    >
                                        {notaMedia.toFixed(1)}
                                    </span>
                                </TableCell>
                                <TableCell className="py-4 px-4">
                                    <div className="flex justify-center">
                                        {confiancaBar(confiancaMedia)}
                                    </div>
                                </TableCell>
                            </TableRow>

                            {/* Expanded: per-criterion breakdown */}
                            {isExpanded && r.notas.length > 0 && (
                                <TableRow className="border-slate-50">
                                    <TableCell colSpan={5} className="p-0">
                                        <div className="bg-slate-50/70 px-8 py-5 space-y-3">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-3">
                                                Detalhamento por Critério
                                            </p>
                                            <div className="space-y-2">
                                                {r.notas.map((nota) => (
                                                    <div
                                                        key={nota.criterio_id}
                                                        className="bg-white rounded-xl border border-slate-100 p-4 flex items-start gap-4"
                                                    >
                                                        {/* Nota */}
                                                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                                                            <span
                                                                className={`text-lg font-bold tabular-nums ${notaColor(
                                                                    nota.nota_sugerida
                                                                )}`}
                                                            >
                                                                {nota.nota_sugerida.toFixed(1)}
                                                            </span>
                                                            {nota.criterios && (
                                                                <span className="text-[11px] text-slate-400 font-medium">
                                                                    {nota.criterios.nota_minima}–{nota.criterios.nota_maxima}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Criterio info */}
                                                        <div className="flex-1 min-w-0 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-slate-900">
                                                                    {nota.criterios?.descricao || 'Critério'}
                                                                </span>
                                                                {nota.criterios?.peso && (
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="text-[11px] font-medium uppercase tracking-wide"
                                                                    >
                                                                        Peso {nota.criterios.peso}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-slate-500 leading-relaxed">
                                                                {nota.justificativa}
                                                            </p>
                                                        </div>

                                                        {/* Confiança */}
                                                        <div className="flex-shrink-0">
                                                            {confiancaBar(nota.confianca)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </Fragment>
                    )
                })}
            </TableBody>
        </Table>
    )
}

// ---------------------------------------------------------------------------
// Tab 3 — Irregularidades
// ---------------------------------------------------------------------------

function IrregularidadesTab({
    irregularidades,
    resultados,
}: {
    irregularidades: Array<{ resultado: Resultado; flag: IrregularidadeFlag }>
    resultados: Resultado[]
}) {
    if (irregularidades.length === 0) {
        return (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">
                    Nenhuma irregularidade detectada
                </h3>
                <p className="text-sm text-slate-500 font-medium max-w-sm">
                    A análise de IA não identificou cópias de texto ou orçamentos duplicados entre os projetos.
                </p>
            </div>
        )
    }

    // Helper: find projeto info by id
    const findProjeto = (projetoId: string | undefined) => {
        if (!projetoId) return null
        const r = resultados.find((res) => res.projeto_id === projetoId)
        return r?.projetos || null
    }

    return (
        <div className="space-y-4">
            {irregularidades.map((item, idx) => {
                const isSimilaridade = item.flag.tipo === 'texto_similar'
                const isOrcamento = item.flag.tipo === 'orcamento_duplicado'
                const projetoSimilar = findProjeto(item.flag.projeto_similar_id)
                    || item.resultado.projeto_similar

                return (
                    <div
                        key={idx}
                        className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 space-y-3"
                    >
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                {isSimilaridade ? (
                                    <Copy className="h-4 w-4 text-amber-600" />
                                ) : isOrcamento ? (
                                    <DollarSign className="h-4 w-4 text-amber-600" />
                                ) : (
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                                <h4 className="text-sm font-semibold text-amber-900">
                                    {isSimilaridade
                                        ? 'Possível cópia detectada'
                                        : isOrcamento
                                        ? 'Orçamento idêntico'
                                        : 'Irregularidade detectada'}
                                </h4>

                                <div className="flex flex-wrap items-center gap-2 text-sm text-amber-800">
                                    <span className="font-medium">
                                        {item.resultado.projetos?.titulo || 'Projeto'}
                                    </span>
                                    <span className="text-amber-400">&harr;</span>
                                    <span className="font-medium">
                                        {projetoSimilar?.titulo || 'Projeto similar'}
                                    </span>
                                </div>

                                {isSimilaridade && item.flag.similaridade != null && (
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-24 rounded-full bg-amber-200 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                                                style={{
                                                    width: `${Math.round(
                                                        item.flag.similaridade * 100
                                                    )}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-xs font-medium text-amber-700 tabular-nums">
                                            {Math.round(item.flag.similaridade * 100)}% de similaridade
                                        </span>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-mono">
                                        {item.resultado.projetos?.numero_protocolo || '—'}
                                    </span>
                                    {projetoSimilar?.numero_protocolo && (
                                        <span className="text-[11px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-mono">
                                            {projetoSimilar.numero_protocolo}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

// ---------------------------------------------------------------------------
// Empty state for tabs
// ---------------------------------------------------------------------------

function EmptyTabState({ message }: { message: string }) {
    return (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center">
                <FileWarning className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-medium text-slate-500">{message}</p>
        </div>
    )
}
