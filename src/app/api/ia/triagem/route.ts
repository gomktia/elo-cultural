import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { buildHabilitacaoPrompt, buildAvaliacaoPrompt } from '@/lib/ia/prompts'
import { detectarIrregularidades } from '@/lib/ia/similaridade'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
  }

  const rolesPermitidas = ['gestor', 'admin', 'super_admin']
  if (!rolesPermitidas.includes(profile.role)) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const tenant_id = profile.tenant_id

  // 2. Parse body
  let edital_id: string
  try {
    const body = await request.json()
    edital_id = body.edital_id
    if (!edital_id) {
      return NextResponse.json({ error: 'edital_id e obrigatorio' }, { status: 400 })
    }
  } catch {
    return NextResponse.json({ error: 'Body invalido' }, { status: 400 })
  }

  // 3. Validate edital exists and belongs to tenant
  const { data: editalCheck } = await supabase
    .from('editais')
    .select('id')
    .eq('id', edital_id)
    .eq('tenant_id', tenant_id)
    .single()

  if (!editalCheck) {
    return NextResponse.json({ error: 'Edital nao encontrado' }, { status: 404 })
  }

  // 4. Create execution record
  const { data: execucao, error: execError } = await supabase
    .from('triagem_ia_execucoes')
    .insert({
      tenant_id,
      edital_id,
      executado_por: user.id,
      tipo: 'completa',
      status: 'em_andamento',
    })
    .select('id')
    .single()

  if (execError || !execucao) {
    return NextResponse.json(
      { error: 'Erro ao criar execucao de triagem' },
      { status: 500 }
    )
  }

  try {
    const openai = getOpenAIClient()

    // 5. Fetch all projetos for this edital
    const { data: projetos, error: projetosError } = await supabase
      .from('projetos')
      .select('id, titulo, resumo, descricao_tecnica, orcamento_total, cronograma_execucao')
      .eq('edital_id', edital_id)

    if (projetosError) {
      throw new Error(`Erro ao buscar projetos: ${projetosError.message}`)
    }

    const projetosList = projetos || []

    // 6. Fetch edital info
    const { data: edital, error: editalError } = await supabase
      .from('editais')
      .select('titulo, numero_edital, objeto')
      .eq('id', edital_id)
      .single()

    if (editalError || !edital) {
      throw new Error('Erro ao buscar dados do edital')
    }

    // 7. Fetch criterios
    const { data: criterios, error: criteriosError } = await supabase
      .from('criterios')
      .select('id, descricao, nota_minima, nota_maxima, peso')
      .eq('edital_id', edital_id)
      .order('ordem')

    if (criteriosError) {
      throw new Error(`Erro ao buscar criterios: ${criteriosError.message}`)
    }

    const criteriosList = criterios || []

    // 8. Update execution total_projetos count
    await supabase
      .from('triagem_ia_execucoes')
      .update({ total_projetos: projetosList.length })
      .eq('id', execucao.id)

    // 9. For each projeto, run AI analysis
    for (let i = 0; i < projetosList.length; i++) {
      const projeto = projetosList[i]

      // 9a. Fetch documents
      const { data: documentos } = await supabase
        .from('projeto_documentos')
        .select('tipo, nome_arquivo')
        .eq('projeto_id', projeto.id)

      const docsList = documentos || []

      // 9b. Call GPT-4 for habilitacao
      const habPrompt = buildHabilitacaoPrompt(projeto, edital, docsList)

      let habResult: {
        sugestao: string
        motivo: string
        docs_completos: boolean
        problemas: string[]
      }

      try {
        const habResponse = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: habPrompt.system },
            { role: 'user', content: habPrompt.user },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        })

        // 9c. Parse JSON response for habilitacao
        const habContent = habResponse.choices[0]?.message?.content || '{}'
        try {
          habResult = JSON.parse(habContent)
        } catch {
          habResult = {
            sugestao: 'pendencia',
            motivo: 'Nao foi possivel interpretar a resposta da IA para habilitacao.',
            docs_completos: false,
            problemas: ['Erro no parse da resposta da IA'],
          }
        }
      } catch {
        habResult = {
          sugestao: 'pendencia',
          motivo: 'Erro ao chamar a IA para analise de habilitacao.',
          docs_completos: false,
          problemas: ['Erro na chamada da API de IA'],
        }
      }

      // 9d. For each criterio, call GPT-4 for avaliacao
      const notasResults: Array<{
        criterio_id: string
        nota: number
        justificativa: string
        confianca: number
      }> = []

      for (const criterio of criteriosList) {
        const avalPrompt = buildAvaliacaoPrompt(projeto, criterio, edital)

        let avalResult: { nota: number; justificativa: string; confianca: number }

        try {
          const avalResponse = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
              { role: 'system', content: avalPrompt.system },
              { role: 'user', content: avalPrompt.user },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          })

          const avalContent = avalResponse.choices[0]?.message?.content || '{}'
          try {
            avalResult = JSON.parse(avalContent)
            // Clamp nota within range
            if (avalResult.nota < criterio.nota_minima) avalResult.nota = criterio.nota_minima
            if (avalResult.nota > criterio.nota_maxima) avalResult.nota = criterio.nota_maxima
          } catch {
            // Fallback: middle of range
            const notaMedia = (criterio.nota_minima + criterio.nota_maxima) / 2
            avalResult = {
              nota: notaMedia,
              justificativa: 'Nao foi possivel interpretar a resposta da IA para este criterio.',
              confianca: 0.3,
            }
          }
        } catch {
          const notaMedia = (criterio.nota_minima + criterio.nota_maxima) / 2
          avalResult = {
            nota: notaMedia,
            justificativa: 'Erro ao chamar a IA para avaliacao deste criterio.',
            confianca: 0.3,
          }
        }

        notasResults.push({
          criterio_id: criterio.id,
          nota: avalResult.nota,
          justificativa: avalResult.justificativa,
          confianca: avalResult.confianca,
        })
      }

      // Calculate nota_final_ia (weighted average)
      let notaFinal = 0
      let pesoTotal = 0
      for (const nr of notasResults) {
        const criterio = criteriosList.find((c) => c.id === nr.criterio_id)
        if (criterio) {
          notaFinal += nr.nota * criterio.peso
          pesoTotal += criterio.peso
        }
      }
      if (pesoTotal > 0) {
        notaFinal = Math.round((notaFinal / pesoTotal) * 100) / 100
      }

      // 9e. Insert triagem_ia_resultados record
      const { data: resultado, error: resultadoError } = await supabase
        .from('triagem_ia_resultados')
        .insert({
          execucao_id: execucao.id,
          projeto_id: projeto.id,
          tenant_id,
          habilitacao_sugerida: habResult.sugestao,
          habilitacao_motivo: habResult.motivo,
          docs_completos: habResult.docs_completos,
          docs_problemas: habResult.problemas || [],
          irregularidades_flags: [],
        })
        .select('id')
        .single()

      if (resultadoError) {
        throw new Error(`Erro ao inserir resultado para projeto ${projeto.id}: ${resultadoError.message}`)
      }

      // 9f. Insert triagem_ia_notas records (one per criterio)
      if (notasResults.length > 0 && resultado) {
        const notasInsert = notasResults.map((nr) => ({
          resultado_id: resultado.id,
          criterio_id: nr.criterio_id,
          nota_sugerida: nr.nota,
          justificativa: nr.justificativa,
          confianca: nr.confianca,
        }))

        const { error: notasError } = await supabase
          .from('triagem_ia_notas')
          .insert(notasInsert)

        if (notasError) {
          throw new Error(`Erro ao inserir notas para projeto ${projeto.id}: ${notasError.message}`)
        }
      }

      // 9g. Update projetos_analisados counter
      await supabase
        .from('triagem_ia_execucoes')
        .update({ projetos_analisados: i + 1 })
        .eq('id', execucao.id)
    }

    // 10. Run similarity detection
    const projetosTexto = projetosList.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      texto: `${p.resumo || ''} ${p.descricao_tecnica || ''}`,
      orcamento_total: p.orcamento_total,
    }))

    const irregularidades = await detectarIrregularidades(projetosTexto)

    // 11. For each irregularity, update corresponding resultado
    for (const flag of irregularidades) {
      // Fetch the resultado for this projeto
      const { data: resultadoExistente } = await supabase
        .from('triagem_ia_resultados')
        .select('id, irregularidades_flags, similaridade_max')
        .eq('execucao_id', execucao.id)
        .eq('projeto_id', flag.projetoId)
        .single()

      if (resultadoExistente) {
        const currentFlags = (resultadoExistente.irregularidades_flags as Array<Record<string, unknown>>) || []
        const newFlag = {
          tipo: flag.tipo,
          projeto_similar_id: flag.projetoSimilarId,
          similaridade: flag.similaridade,
        }
        const updatedFlags = [...currentFlags, newFlag]

        const newMaxSim = Math.max(
          resultadoExistente.similaridade_max || 0,
          flag.similaridade
        )

        await supabase
          .from('triagem_ia_resultados')
          .update({
            similaridade_max: newMaxSim,
            projeto_similar_id: flag.projetoSimilarId,
            irregularidades_flags: updatedFlags,
          })
          .eq('id', resultadoExistente.id)
      }
    }

    // 12. Update execution: concluida
    await supabase
      .from('triagem_ia_execucoes')
      .update({
        status: 'concluida',
        concluida_em: new Date().toISOString(),
      })
      .eq('id', execucao.id)

    // 13. Return execution id
    return NextResponse.json({ execucao_id: execucao.id })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na triagem'

    // Update execution to error status
    await supabase
      .from('triagem_ia_execucoes')
      .update({
        status: 'erro',
        erro_mensagem: message,
      })
      .eq('id', execucao.id)

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
