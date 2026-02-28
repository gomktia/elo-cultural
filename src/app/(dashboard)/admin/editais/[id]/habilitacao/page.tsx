import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Scale } from 'lucide-react'
import { HabilitacaoTable } from '@/components/admin/HabilitacaoTable'
import { Projeto } from '@/types/database.types'

export default async function HabilitacaoPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Busca edital
    const { data: edital } = await supabase
        .from('editais')
        .select('titulo, numero_edital')
        .eq('id', id)
        .single()

    if (!edital) notFound()

    // 2. Busca projetos inscritos
    const { data: projetos } = await supabase
        .from('projetos')
        .select('*')
        .eq('edital_id', id)
        .order('data_envio', { ascending: false })

    // 3. Fetch latest AI triagem results
    const { data: latestExec } = await supabase
        .from('triagem_ia_execucoes')
        .select('id')
        .eq('edital_id', id)
        .eq('status', 'concluida')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    let aiSugestoes: Record<string, { sugestao: string; motivo: string }> = {}
    if (latestExec) {
        const { data: resultados } = await supabase
            .from('triagem_ia_resultados')
            .select('projeto_id, habilitacao_sugerida, habilitacao_motivo')
            .eq('execucao_id', latestExec.id)

        if (resultados) {
            for (const r of resultados) {
                aiSugestoes[r.projeto_id] = {
                    sugestao: r.habilitacao_sugerida || 'pendencia',
                    motivo: r.habilitacao_motivo || '',
                }
            }
        }
    }

    return (
        <div className="space-y-8">
            {/* Header Card */}
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
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Habilitação Documental</h1>
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

            {/* Grid decorativo ou estatísticas rápidas podem vir aqui */}

            {/* Tabela de Projetos */}
            <section>
                <HabilitacaoTable projetos={(projetos as Projeto[]) || []} aiSugestoes={aiSugestoes} />
            </section>
        </div>
    )
}
