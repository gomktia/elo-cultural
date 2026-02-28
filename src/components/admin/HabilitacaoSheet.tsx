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
import type { Projeto, ProjetoDocumento } from '@/types/database.types'
import { FileIcon, ExternalLink, CheckCircle, XCircle, Loader2, FileText, FileImage, File } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { atualizarHabilitacao } from '@/lib/actions/projeto-actions'
import { toast } from 'sonner'

interface HabilitacaoSheetProps {
    projeto: Projeto | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

export function HabilitacaoSheet({ projeto, open, onOpenChange, onSuccess }: HabilitacaoSheetProps) {
    const [documentos, setDocumentos] = useState<ProjetoDocumento[]>([])
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [status, setStatus] = useState<'habilitado' | 'inabilitado' | null>(null)
    const [justificativa, setJustificativa] = useState('')
    const supabase = createClient()

    useEffect(() => {
        if (projeto && open) {
            fetchDocumentos()
            setStatus(projeto.status_habilitacao === 'pendente' ? null : projeto.status_habilitacao)
            setJustificativa('')
        }
    }, [projeto, open])

    async function fetchDocumentos() {
        if (!projeto) return
        setLoading(true)
        const { data } = await supabase
            .from('projeto_documentos')
            .select('*')
            .eq('projeto_id', projeto.id)

        setDocumentos((data as ProjetoDocumento[]) || [])
        setLoading(false)
    }

    async function handleSave() {
        if (!projeto || !status) return
        if (status === 'inabilitado' && !justificativa.trim()) {
            toast.error('Justificativa é obrigatória para inabilitação')
            return
        }

        setSubmitting(true)
        const result = await atualizarHabilitacao(projeto.id, status, justificativa)

        if (result.success) {
            toast.success('Habilitação atualizada com sucesso')
            onOpenChange(false)
            onSuccess?.()
        } else {
            toast.error('Erro ao atualizar habilitação: ' + result.error)
        }
        setSubmitting(false)
    }

    function getDocIcon(nome: string) {
        const ext = nome.split('.').pop()?.toLowerCase()
        if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4" />
        if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) return <FileImage className="h-4 w-4" />
        return <File className="h-4 w-4" />
    }

    if (!projeto) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto border-l-0 p-0 bg-white">
                {/* Header azul brand */}
                <div className="bg-[var(--brand-primary)] px-8 pt-8 pb-6">
                    <SheetHeader className="mb-0">
                        <SheetTitle className="text-xl font-bold tracking-[-0.02em] text-white">
                            Revisão Documental
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
                                            : 'bg-red-400/20 text-red-100'
                                    }`}>
                                        {projeto.status_habilitacao}
                                    </span>
                                )}
                            </div>
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="space-y-6 px-8 py-6">
                    {/* Documentos */}
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

                    {/* Decisao */}
                    <section className="space-y-5 pt-5 border-t border-slate-100">
                        <div className="space-y-3">
                            <Label className="text-xs font-medium uppercase tracking-wide text-slate-400">Decisão da Habilitação</Label>
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
                            <Label htmlFor="justificativa" className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Justificativa {status === 'inabilitado' && <span className="text-[var(--brand-secondary)]">*</span>}
                            </Label>
                            <Textarea
                                id="justificativa"
                                placeholder="Informe os motivos da decisão..."
                                className="min-h-[100px] rounded-xl border-slate-200 bg-white focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all resize-none"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                            />
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Esta justificativa será visível para o proponente no portal da transparência.
                            </p>
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
