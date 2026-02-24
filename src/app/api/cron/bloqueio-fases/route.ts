import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FASE_ORDER = [
    'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
    'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
    'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
    'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
    'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
]

export async function GET() {
    const supabase = await createClient()

    // 1. Bloqueia fases expiradas na tabela edital_fases
    const { data: updatedFases, error: faseError } = await supabase
        .from('edital_fases')
        .update({ bloqueada: true })
        .match({ bloqueada: false })
        .lt('data_fim', new Date().toISOString())
        .select('edital_id, fase')

    if (faseError) {
        console.error('Erro ao bloquear fases:', faseError)
        return NextResponse.json({ error: faseError.message }, { status: 500 })
    }

    // 2. Auto-advance editais whose current phase matches a just-blocked phase
    let avancados = 0
    if (updatedFases && updatedFases.length > 0) {
        // Get unique edital IDs
        const editalIds = [...new Set(updatedFases.map(f => f.edital_id))]

        for (const editalId of editalIds) {
            const { data: edital } = await supabase
                .from('editais')
                .select('id, status')
                .eq('id', editalId)
                .single()

            if (!edital) continue

            // Check if the blocked phase matches the edital's current status
            const blockedPhases = updatedFases
                .filter(f => f.edital_id === editalId)
                .map(f => f.fase)

            if (blockedPhases.includes(edital.status)) {
                const currentIndex = FASE_ORDER.indexOf(edital.status)
                if (currentIndex >= 0 && currentIndex < FASE_ORDER.length - 1) {
                    const nextPhase = FASE_ORDER[currentIndex + 1]
                    const { error: advanceError } = await supabase
                        .from('editais')
                        .update({ status: nextPhase })
                        .eq('id', editalId)

                    if (!advanceError) {
                        avancados++
                        console.log(`Edital ${editalId} avancado de ${edital.status} para ${nextPhase}`)
                    }
                }
            }
        }
    }

    return NextResponse.json({
        success: true,
        bloqueadas: updatedFases?.length || 0,
        avancados,
    })
}

// Para permitir execucao via cron externa (ex: Vercel Cron)
export const dynamic = 'force-dynamic'
