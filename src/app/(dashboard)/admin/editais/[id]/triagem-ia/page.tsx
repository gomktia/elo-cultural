import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft, Brain } from 'lucide-react'
import { TriagemPanel } from '@/components/ia/TriagemPanel'
import { TriagemExecucao } from '@/types/database.types'

export default async function TriagemIAPage({
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

    // 2. Busca última execução concluída
    const { data: execucao } = await supabase
        .from('triagem_ia_execucoes')
        .select('*')
        .eq('edital_id', id)
        .eq('status', 'concluida')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // 3. Se há execução, busca resultados com dados do projeto
    let resultados: TriagemPanelResultado[] = []

    if (execucao) {
        const { data: rawResultados } = await supabase
            .from('triagem_ia_resultados')
            .select(`
                *,
                projetos (
                    titulo,
                    numero_protocolo,
                    resumo,
                    orcamento_total
                )
            `)
            .eq('execucao_id', execucao.id)

        const resultadosList = rawResultados || []

        // Para cada resultado, busca notas com critérios e projeto similar
        resultados = await Promise.all(
            resultadosList.map(async (resultado) => {
                // Busca notas com critérios
                const { data: notas } = await supabase
                    .from('triagem_ia_notas')
                    .select(`
                        criterio_id,
                        nota_sugerida,
                        justificativa,
                        confianca,
                        criterios (
                            descricao,
                            nota_minima,
                            nota_maxima,
                            peso
                        )
                    `)
                    .eq('resultado_id', resultado.id)

                // Busca projeto similar se existir
                let projetoSimilar = null
                if (resultado.projeto_similar_id) {
                    const { data: similar } = await supabase
                        .from('projetos')
                        .select('titulo, numero_protocolo')
                        .eq('id', resultado.projeto_similar_id)
                        .single()
                    projetoSimilar = similar
                }

                return {
                    id: resultado.id,
                    projeto_id: resultado.projeto_id,
                    habilitacao_sugerida: resultado.habilitacao_sugerida,
                    habilitacao_motivo: resultado.habilitacao_motivo,
                    docs_completos: resultado.docs_completos,
                    docs_problemas: resultado.docs_problemas || [],
                    irregularidades_flags: (resultado.irregularidades_flags || []) as TriagemPanelResultado['irregularidades_flags'],
                    similaridade_max: resultado.similaridade_max || 0,
                    projeto_similar_id: resultado.projeto_similar_id,
                    projetos: resultado.projetos,
                    projeto_similar: projetoSimilar,
                    notas: (notas || []).map((n) => ({
                        criterio_id: n.criterio_id,
                        nota_sugerida: n.nota_sugerida,
                        justificativa: n.justificativa,
                        confianca: n.confianca,
                        criterios: n.criterios as unknown as { descricao: string; nota_minima: number; nota_maxima: number; peso: number } | null,
                    })),
                }
            })
        )
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
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-tight">Triagem por IA</h1>
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

            {/* Painel principal */}
            <TriagemPanel
                editalId={id}
                execucao={execucao as TriagemExecucao | null}
                resultados={resultados}
            />
        </div>
    )
}

// Tipo local para o resultado completo com joins
type TriagemPanelResultado = {
    id: string
    projeto_id: string
    habilitacao_sugerida: string | null
    habilitacao_motivo: string | null
    docs_completos: boolean
    docs_problemas: string[]
    irregularidades_flags: Array<{ tipo: string; projeto_similar_id?: string; similaridade?: number }> | string[]
    similaridade_max: number
    projeto_similar_id: string | null
    projetos: { titulo: string; numero_protocolo: string; resumo: string; orcamento_total: number } | null
    projeto_similar: { titulo: string; numero_protocolo: string } | null
    notas: Array<{
        criterio_id: string
        nota_sugerida: number
        justificativa: string
        confianca: number
        criterios: { descricao: string; nota_minima: number; nota_maxima: number; peso: number } | null
    }>
}
