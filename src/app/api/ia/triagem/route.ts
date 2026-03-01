import { createClient } from '@/lib/supabase/server'
import { getOpenAIClient } from '@/lib/openai'
import { getIAConfig } from '@/lib/ia/config'
import { buildHabilitacaoPrompt, buildAvaliacaoBatchPrompt } from '@/lib/ia/prompts'
import { detectarIrregularidades } from '@/lib/ia/similaridade'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { ADMIN_ROLES } from '@/lib/constants/roles'

export const maxDuration = 300 // 5 minutes max

export async function POST(request: NextRequest) {
  // Rate limit: 3 triagem executions per hour per IP (expensive OpenAI calls)
  const ip = getClientIp(request.headers)
  const rl = checkRateLimit(`triagem-ia:${ip}`, { limit: 3, windowSeconds: 3600 })
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Muitas solicitações. Tente novamente mais tarde.' }, { status: 429 })
  }

  const supabase = await createClient()

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
  }

  if (!ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const tenant_id = profile.tenant_id

  // 2. Parse body
  let edital_id: string
  try {
    const body = await request.json()
    edital_id = body.edital_id
    if (!edital_id) {
      return NextResponse.json({ error: 'edital_id é obrigatório' }, { status: 400 })
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
    return NextResponse.json({ error: 'Edital não encontrado' }, { status: 404 })
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
    console.error('Erro ao criar execucao de triagem:', execError)
    return NextResponse.json(
      { error: 'Erro interno ao iniciar triagem' },
      { status: 500 }
    )
  }

  try {
    // Check IA config
    const iaConfig = await getIAConfig()
    if (!iaConfig.enabled) {
      await supabase
        .from('triagem_ia_execucoes')
        .update({ status: 'erro', erro_mensagem: 'IA desabilitada na plataforma' })
        .eq('id', execucao.id)
      return NextResponse.json({ error: 'IA esta desabilitada na plataforma. Ative em Configuracoes.' }, { status: 400 })
    }

    const openai = await getOpenAIClient()
    const iaModel = iaConfig.model

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
          model: iaModel,
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
            motivo: 'Não foi possível interpretar a resposta da IA para habilitação.',
            docs_completos: false,
            problemas: ['Erro no parse da resposta da IA'],
          }
        }
      } catch {
        habResult = {
          sugestao: 'pendencia',
          motivo: 'Erro ao chamar a IA para análise de habilitação.',
          docs_completos: false,
          problemas: ['Erro na chamada da API de IA'],
        }
      }

      // 9d. Batch: evaluate ALL criterios in a single API call (eliminates N+1)
      const notasResults: Array<{
        criterio_id: string
        nota: number
        justificativa: string
        confianca: number
      }> = []

      if (criteriosList.length > 0) {
        const batchPrompt = buildAvaliacaoBatchPrompt(projeto, criteriosList, edital)

        try {
          const batchResponse = await openai.chat.completions.create({
            model: iaModel,
            messages: [
              { role: 'system', content: batchPrompt.system },
              { role: 'user', content: batchPrompt.user },
            ],
            temperature: 0.3,
            response_format: { type: 'json_object' },
          })

          const batchContent = batchResponse.choices[0]?.message?.content || '{}'
          try {
            const parsed = JSON.parse(batchContent)
            const avaliacoes = parsed.avaliacoes || []

            for (const criterio of criteriosList) {
              const found = avaliacoes.find((a: { criterio_id: string; nota: number; justificativa: string; confianca: number }) => a.criterio_id === criterio.id)
              if (found) {
                // Clamp nota within range
                let nota = Number(found.nota)
                if (nota < criterio.nota_minima) nota = criterio.nota_minima
                if (nota > criterio.nota_maxima) nota = criterio.nota_maxima
                notasResults.push({
                  criterio_id: criterio.id,
                  nota,
                  justificativa: found.justificativa || 'Sem justificativa',
                  confianca: Math.min(1, Math.max(0, Number(found.confianca) || 0.5)),
                })
              } else {
                // Criterio not returned by AI - use middle of range
                const notaMedia = (criterio.nota_minima + criterio.nota_maxima) / 2
                notasResults.push({
                  criterio_id: criterio.id,
                  nota: notaMedia,
                  justificativa: 'Criterio nao avaliado pela IA nesta execucao.',
                  confianca: 0.3,
                })
              }
            }
          } catch {
            // Parse error - fallback all criteria to middle
            for (const criterio of criteriosList) {
              const notaMedia = (criterio.nota_minima + criterio.nota_maxima) / 2
              notasResults.push({
                criterio_id: criterio.id,
                nota: notaMedia,
                justificativa: 'Não foi possível interpretar a resposta da IA.',
                confianca: 0.3,
              })
            }
          }
        } catch {
          // API error - fallback all criteria
          for (const criterio of criteriosList) {
            const notaMedia = (criterio.nota_minima + criterio.nota_maxima) / 2
            notasResults.push({
              criterio_id: criterio.id,
              nota: notaMedia,
              justificativa: 'Erro ao chamar a IA para avaliacao.',
              confianca: 0.3,
            })
          }
        }
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
    console.error('Triagem IA error:', message)

    // Update execution to error status
    await supabase
      .from('triagem_ia_execucoes')
      .update({
        status: 'erro',
        erro_mensagem: message,
      })
      .eq('id', execucao.id)

    return NextResponse.json({ error: 'Erro interno ao processar triagem' }, { status: 500 })
  }
}
