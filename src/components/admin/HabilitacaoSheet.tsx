'use client'

import { useState, useEffect } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Projeto, ProjetoDocumento } from '@/types/database.types'
import { FileIcon, ExternalLink, CheckCircle, XCircle, Loader2, FileText, FileImage, File, AlertTriangle, Clock, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { atualizarHabilitacao } from '@/lib/actions/projeto-actions'
import { toast } from 'sonner'

interface DocExigido {
    id: string
    tipo_documento: string
    nome: string
    descricao: string | null
    obrigatorio: boolean
    ordem: number
}

interface DocConferencia {
    id: string
    doc_exigido_id: string
    documento_id: string | null
    status: string
    observacao: string | null
}

interface HabilitacaoSheetProps {
    projeto: Projeto | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function HabilitacaoSheet({ projeto, open, onOpenChange, onSuccess }: HabilitacaoSheetProps) {
    const [documentos, setDocumentos] = useState<ProjetoDocumento[]>([])
    const [docsExigidos, setDocsExigidos] = useState<DocExigido[]>([])
    const [conferencias, setConferencias] = useState<Record<string, DocConferencia>>({})
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<'habilitado' | 'inabilitado' | null>(null)
    const [justificativa, setJustificativa] = useState('')
    const [showDiligencia, setShowDiligencia] = useState(false)
    const [diligenciaTexto, setDiligenciaTexto] = useState('')
    const [enviandoDiligencia, setEnviandoDiligencia] = useState(false)
    const supabase = createClient()

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (projeto && open) {
            fetchData()
            const sh = projeto.status_habilitacao
            setStatus(sh === 'habilitado' || sh === 'inabilitado' ? sh : null)
            setJustificativa('')
            setShowDiligencia(false)
            setDiligenciaTexto('')
        }
    }, [projeto, open])

    async function fetchData() {
        if (!projeto) return
        setLoading(true)

        // Fetch uploaded documents
        const { data: docs } = await supabase
            .from('projeto_documentos')
            .select('*')
            .eq('projeto_id', projeto.id)
        setDocumentos((docs as ProjetoDocumento[]) || [])

        // Fetch required docs for this edital
        const { data: exigidos } = await supabase
            .from('edital_docs_habilitacao')
            .select('*')
            .eq('edital_id', projeto.edital_id)
            .order('ordem')
        setDocsExigidos((exigidos as DocExigido[]) || [])

        // Fetch existing conferencias
        const { data: conf } = await supabase
            .from('habilitacao_doc_conferencia')
            .select('*')
            .eq('projeto_id', projeto.id)

        const confMap: Record<string, DocConferencia> = {}
        ;((conf || []) as unknown as DocConferencia[]).forEach((c) => { confMap[c.doc_exigido_id] = c })
        setConferencias(confMap)

        setLoading(false)
    }

    async function updateDocStatus(docExigidoId: string, newStatus: string, obs?: string) {
        if (!projeto) return

        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
            .single()

        if (!profile) return

        const existing = conferencias[docExigidoId]

        if (existing) {
            await supabase
                .from('habilitacao_doc_conferencia')
                .update({
                    status: newStatus,
                    observacao: obs || null,
                    conferido_por: (await supabase.auth.getUser()).data.user?.id,
                    conferido_em: new Date().toISOString(),
                })
                .eq('id', existing.id)
        } else {
            await supabase
                .from('habilitacao_doc_conferencia')
                .insert({
                    projeto_id: projeto.id,
                    doc_exigido_id: docExigidoId,
                    tenant_id: profile.tenant_id,
                    status: newStatus,
                    observacao: obs || null,
                    conferido_por: (await supabase.auth.getUser()).data.user?.id,
                    conferido_em: new Date().toISOString(),
                })
        }

        setConferencias(prev => ({
            ...prev,
            [docExigidoId]: {
                ...prev[docExigidoId],
                id: existing?.id || '',
                doc_exigido_id: docExigidoId,
                documento_id: null,
                status: newStatus,
                observacao: obs || null,
            }
        }))
    }

    async function handleSave() {
        if (!projeto || !status) return
        if (status === 'inabilitado' && !justificativa.trim()) {
            toast.error('Justificativa e obrigatoria para inabilitacao')
            return
        }

        setSubmitting(true)
        const result = await atualizarHabilitacao(projeto.id, status, justificativa)

        if (result.success) {
            toast.success('Habilitacao atualizada com sucesso')
            onOpenChange(false)
            onSuccess?.()
        } else {
            toast.error('Erro ao atualizar habilitacao: ' + result.error)
        }
        setSubmitting(false)
    }

    async function enviarDiligencia() {
        if (!projeto || !diligenciaTexto.trim()) {
            toast.error('Descreva a pendencia')
            return
        }

        setEnviandoDiligencia(true)
        const { data: profile } = await supabase
            .from('profiles')
            .select('tenant_id')
            .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
            .single()

        if (!profile) { setEnviandoDiligencia(false); return }

        // Count existing diligencias
        const { count } = await supabase
            .from('habilitacao_diligencias')
            .select('id', { count: 'exact', head: true })
            .eq('projeto_id', projeto.id)

        if ((count || 0) >= 2) {
            toast.error('Limite de 2 diligencias atingido para este projeto')
            setEnviandoDiligencia(false)
            return
        }

        await supabase.from('habilitacao_diligencias').insert({
            projeto_id: projeto.id,
            tenant_id: profile.tenant_id,
            numero: (count || 0) + 1,
            descricao: diligenciaTexto,
            prazo_dias: 5,
            criado_por: (await supabase.auth.getUser()).data.user?.id,
        })

        toast.success(`Diligencia ${(count || 0) + 1}/2 enviada ao proponente`)
        setShowDiligencia(false)
        setDiligenciaTexto('')
        setEnviandoDiligencia(false)
    }

    function getDocIcon(nome: string) {
        const ext = nome.split('.').pop()?.toLowerCase()
        if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4" />
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <FileImage className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    const statusIcon = (s: string) => {
        if (s === 'aprovado') return <CheckCircle className="h-4 w-4 text-green-500" />
        if (s === 'reprovado') return <XCircle className="h-4 w-4 text-red-500" />
        if (s === 'pendencia') return <AlertTriangle className="h-4 w-4 text-amber-500" />
        return <Clock className="h-4 w-4 text-slate-300" />
    }

    if (!projeto) return null

    const aprovados = Object.values(conferencias).filter(c => c.status === 'aprovado').length
    const totalExigidos = docsExigidos.length

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto border-l-0 p-0 bg-white">
                {/* Header */}
                <div className="bg-[var(--brand-primary)] px-8 pt-8 pb-6">
                    <SheetHeader className="mb-0">
                        <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-white">
                            Revisao Documental
                        </SheetTitle>
                        <SheetDescription className="mt-3 space-y-2">
                            <span className="text-sm font-medium text-white/80 block">{projeto.titulo}</span>
                            <div className="flex items-center gap-2">
                                <code className="text-[11px] font-medium text-white bg-white/15 px-2.5 py-1 rounded-md uppercase tracking-wide">
                                    {projeto.numero_protocolo}
                                </code>
                                {projeto.status_habilitacao && projeto.status_habilitacao !== 'pendente' && (
                                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-md uppercase tracking-wide ${
                                        projeto.status_habilitacao === 'habilitado'
                                            ? 'bg-green-400/20 text-green-100'
                                            : projeto.status_habilitacao === 'em_analise'
                                            ? 'bg-yellow-400/20 text-yellow-100'
                                            : 'bg-red-400/20 text-red-100'
                                    }`}>
                                        {projeto.status_habilitacao === 'em_analise' ? 'Em Analise' : projeto.status_habilitacao}
                                    </span>
                                )}
                                {totalExigidos > 0 && (
                                    <span className="text-[11px] font-medium text-white/60 bg-white/10 px-2 py-1 rounded-md">
                                        {aprovados}/{totalExigidos} docs
                                    </span>
                                )}
                            </div>
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="space-y-6 px-8 py-6">
                    {/* Checklist de documentos exigidos */}
                    {docsExigidos.length > 0 && (
                        <section>
                            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 flex items-center gap-2 mb-4">
                                <CheckCircle className="h-3.5 w-3.5" /> Checklist de Habilitacao
                            </h3>
                            <div className="space-y-2">
                                {docsExigidos.map(doc => {
                                    const conf = conferencias[doc.id]
                                    return (
                                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3 min-w-0">
                                                {statusIcon(conf?.status || 'pendente')}
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-slate-800 leading-none truncate">
                                                        {doc.nome}
                                                        {doc.obrigatorio && <span className="text-red-400 ml-1">*</span>}
                                                    </p>
                                                    {doc.descricao && (
                                                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">{doc.descricao}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <Select
                                                value={conf?.status || 'pendente'}
                                                onValueChange={v => updateDocStatus(doc.id, v)}
                                            >
                                                <SelectTrigger className="w-[130px] h-8 rounded-lg border-slate-200 text-xs">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pendente">Pendente</SelectItem>
                                                    <SelectItem value="aprovado">Aprovado</SelectItem>
                                                    <SelectItem value="reprovado">Reprovado</SelectItem>
                                                    <SelectItem value="pendencia">Pendencia</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    )}

                    {/* Documentos Anexados */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 flex items-center gap-2">
                                <FileIcon className="h-3.5 w-3.5" /> Documentos Anexados
                            </h3>
                            {!loading && documentos.length > 0 && (
                                <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                                    {documentos.length} {documentos.length === 1 ? 'arquivo' : 'arquivos'}
                                </span>
                            )}
                        </div>
                        {loading ? (
                            <div className="space-y-2">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-14 rounded-xl bg-slate-100/50 animate-pulse" />
                                ))}
                            </div>
                        ) : documentos.length > 0 ? (
                            <div className="rounded-xl border border-slate-100 overflow-hidden">
                                {documentos.map((doc, idx) => (
                                    <div
                                        key={doc.id}
                                        className={`flex items-center justify-between px-4 py-3 group transition-colors ${
                                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'
                                        } ${idx !== documentos.length - 1 ? 'border-b border-slate-100' : ''}`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-[var(--brand-primary)]/8 text-[var(--brand-primary)]">
                                                {getDocIcon(doc.nome_arquivo)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-800 leading-none truncate">{doc.nome_arquivo}</p>
                                                <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1 font-medium">{doc.tipo}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg flex-shrink-0 text-slate-400 hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)] transition-all">
                                            <a href={supabase.storage.from('documentos').getPublicUrl(doc.storage_path).data.publicUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                                <FileIcon className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 font-medium">Nenhum documento encontrado.</p>
                            </div>
                        )}
                    </section>

                    {/* Diligencia */}
                    <section className="border-t border-slate-100 pt-5">
                        {!showDiligencia ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDiligencia(true)}
                                className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50 text-xs font-medium gap-1.5"
                            >
                                <Send className="h-3.5 w-3.5" />
                                Enviar Diligencia
                            </Button>
                        ) : (
                            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
                                <Label className="text-xs font-medium text-amber-700 uppercase tracking-wide">
                                    Diligencia - Solicitar Regularizacao (max 2)
                                </Label>
                                <Textarea
                                    placeholder="Descreva os documentos ou informacoes que o proponente precisa regularizar..."
                                    value={diligenciaTexto}
                                    onChange={e => setDiligenciaTexto(e.target.value)}
                                    className="rounded-xl border-amber-200 bg-white text-sm min-h-[80px]"
                                />
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        onClick={enviarDiligencia}
                                        disabled={enviandoDiligencia}
                                        className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium gap-1.5"
                                    >
                                        {enviandoDiligencia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                                        Enviar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setShowDiligencia(false)} className="rounded-xl text-xs">
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>

                    {/* Decisao */}
                    <section className="space-y-5 pt-5 border-t border-slate-100">
                        <div className="space-y-3">
                            <Label className="text-xs font-medium uppercase tracking-wide text-slate-400">Decisao da Habilitacao</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={status === 'habilitado' ? 'default' : 'outline'}
                                    className={[
                                        'h-12 gap-2 rounded-xl font-semibold text-sm transition-all',
                                        status === 'habilitado'
                                            ? 'bg-[var(--brand-success)] hover:bg-[var(--brand-success)]/90 text-white border-none shadow-sm'
                                            : 'border-slate-200 hover:border-green-300 hover:bg-green-50/50 text-slate-600'
                                    ].join(' ')}
                                    onClick={() => setStatus('habilitado')}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Habilitado
                                </Button>
                                <Button
                                    type="button"
                                    variant={status === 'inabilitado' ? 'destructive' : 'outline'}
                                    className={[
                                        'h-12 gap-2 rounded-xl font-semibold text-sm transition-all',
                                        status === 'inabilitado'
                                            ? 'bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/90 text-white border-none shadow-sm'
                                            : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-slate-600'
                                    ].join(' ')}
                                    onClick={() => setStatus('inabilitado')}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Inabilitado
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Justificativa {status === 'inabilitado' && <span className="text-[var(--brand-secondary)]">*</span>}
                            </Label>
                            <Textarea
                                placeholder="Informe os motivos da decisao..."
                                className="min-h-[100px] rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all resize-none"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                            />
                        </div>
                    </section>
                </div>

                <SheetFooter className="px-8 py-5 border-t border-slate-100 bg-slate-50/80">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200">
                        Cancelar
                    </Button>
                    <Button
                        disabled={!status || submitting}
                        onClick={handleSave}
                        className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white min-w-[140px] font-semibold transition-all"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Decisao
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
