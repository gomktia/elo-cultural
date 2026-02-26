import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ editalId: string }> }
) {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // 2. Get editalId from params
  const { editalId } = await params

  if (!editalId) {
    return NextResponse.json({ error: 'editalId e obrigatorio' }, { status: 400 })
  }

  try {
    // 3. Fetch latest completed execution
    const { data: execucao } = await supabase
      .from('triagem_ia_execucoes')
      .select('*')
      .eq('edital_id', editalId)
      .eq('status', 'concluida')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 4. If no execution found
    if (!execucao) {
      return NextResponse.json({ execucao: null, resultados: [] })
    }

    // 5. Fetch triagem_ia_resultados for that execution
    const { data: resultados, error: resultadosError } = await supabase
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

    if (resultadosError) {
      return NextResponse.json(
        { error: 'Erro ao buscar resultados da triagem' },
        { status: 500 }
      )
    }

    const resultadosList = resultados || []

    // Fetch projeto_similar info for results that have it
    const resultadosWithSimilar = await Promise.all(
      resultadosList.map(async (resultado) => {
        let projetoSimilar = null
        if (resultado.projeto_similar_id) {
          const { data: similar } = await supabase
            .from('projetos')
            .select('id, titulo, numero_protocolo')
            .eq('id', resultado.projeto_similar_id)
            .single()
          projetoSimilar = similar
        }
        return { ...resultado, projeto_similar: projetoSimilar }
      })
    )

    // 6. For each resultado, fetch triagem_ia_notas with criterios
    const resultadosWithNotas = await Promise.all(
      resultadosWithSimilar.map(async (resultado) => {
        const { data: notas } = await supabase
          .from('triagem_ia_notas')
          .select(`
            *,
            criterios (
              descricao,
              nota_minima,
              nota_maxima,
              peso
            )
          `)
          .eq('resultado_id', resultado.id)

        return { ...resultado, notas: notas || [] }
      })
    )

    // 7. Return results
    return NextResponse.json({
      execucao,
      resultados: resultadosWithNotas,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
