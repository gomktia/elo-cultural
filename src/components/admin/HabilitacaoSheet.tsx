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
import { FileIcon, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react'
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

    if (!projeto) return null

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl overflow-y-auto glass-modal border-l-0 p-0">
                <div className="px-8 pt-8 pb-6">
                    <SheetHeader className="mb-0">
                        <SheetTitle className="text-2xl font-bold tracking-[-0.02em] text-slate-900 dark:text-white">
                            Revisão Documental
                        </SheetTitle>
                        <SheetDescription className="mt-2">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{projeto.titulo}</span>
                            <br />
                            <code className="text-[11px] font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/5 px-2 py-0.5 rounded-md uppercase tracking-wide mt-1 inline-block">
                                {projeto.numero_protocolo}
                            </code>
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <div className="space-y-8 px-8 pb-4">
                    {/* Documentos */}
                    <section>
                        <h3 className="text-xs font-medium uppercase tracking-wide text-slate-400 mb-4 flex items-center gap-2">
                            <FileIcon className="h-3.5 w-3.5" /> Documentos Anexados
                        </h3>
                        {loading ? (
                            <div className="space-y-3">
                                {Array.from({ length: 3 }).map((_, i) => (
                                    <div key={i} className="h-16 rounded-xl bg-slate-100/50 dark:bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : documentos.length > 0 ? (
                            <div className="grid gap-2">
                                {documentos.map((doc) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-white/5 bg-white/60 dark:bg-white/3 hover:bg-white dark:hover:bg-white/5 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-[var(--brand-primary)]/5 text-[var(--brand-primary)]">
                                                <FileIcon className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{doc.nome_arquivo}</p>
                                                <p className="text-[11px] text-slate-400 uppercase tracking-wide mt-1 font-medium">{doc.tipo}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-[var(--brand-primary)]/10 hover:text-[var(--brand-primary)]">
                                            <a href={supabase.storage.from('documentos').getPublicUrl(doc.storage_path).data.publicUrl} target="_blank" rel="noopener noreferrer">
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center border-2 border-dashed border-slate-100 dark:border-white/10 rounded-2xl">
                                <FileIcon className="h-6 w-6 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                                <p className="text-xs text-slate-400 font-medium">Nenhum documento encontrado.</p>
                            </div>
                        )}
                    </section>

                    {/* Decisao */}
                    <section className="space-y-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="space-y-3">
                            <Label className="text-xs font-medium uppercase tracking-wide text-slate-400">Decisão da Habilitação</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant={status === 'habilitado' ? 'default' : 'outline'}
                                    className={[
                                        'h-14 gap-2.5 rounded-2xl font-bold text-sm transition-all',
                                        status === 'habilitado'
                                            ? 'bg-[var(--brand-success)] hover:bg-[var(--brand-success)]/90 text-white shadow-glow-success border-none'
                                            : 'border-slate-200 dark:border-white/10 hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-500/5 text-slate-600 dark:text-slate-400'
                                    ].join(' ')}
                                    onClick={() => setStatus('habilitado')}
                                >
                                    <CheckCircle className="h-5 w-5" />
                                    Habilitado
                                </Button>
                                <Button
                                    type="button"
                                    variant={status === 'inabilitado' ? 'destructive' : 'outline'}
                                    className={[
                                        'h-14 gap-2.5 rounded-2xl font-bold text-sm transition-all',
                                        status === 'inabilitado'
                                            ? 'bg-[var(--brand-secondary)] hover:bg-[var(--brand-secondary)]/90 text-white shadow-glow-secondary border-none'
                                            : 'border-slate-200 dark:border-white/10 hover:border-rose-300 hover:bg-rose-50/50 dark:hover:bg-rose-500/5 text-slate-600 dark:text-slate-400'
                                    ].join(' ')}
                                    onClick={() => setStatus('inabilitado')}
                                >
                                    <XCircle className="h-5 w-5" />
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
                                className="min-h-[120px] rounded-2xl border-slate-200 dark:border-white/10 bg-white/60 dark:bg-white/3 focus:ring-2 focus:ring-[var(--brand-primary)]/20 focus:border-[var(--brand-primary)]/30 transition-all resize-none"
                                value={justificativa}
                                onChange={(e) => setJustificativa(e.target.value)}
                            />
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
                                Esta justificativa será visível para o proponente no portal da transparência.
                            </p>
                        </div>
                    </section>
                </div>

                <SheetFooter className="px-8 py-6 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl border-slate-200 dark:border-white/10">
                        Cancelar
                    </Button>
                    <Button
                        disabled={!status || submitting}
                        onClick={handleSave}
                        className="rounded-xl bg-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/90 text-white shadow-glow-primary min-w-[140px] font-bold transition-all"
                    >
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Decisão
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
