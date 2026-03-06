'use server'

import { createClient } from '@/lib/supabase/server'
import { ADMIN_ROLES } from '@/lib/constants/roles'

// ── Types ──

interface PontuacaoExtraRule {
  grupo: string
  pontos: number
  campo_perfil: string
  valor: string
}

interface EditalCota {
  tipo_cota: string
  percentual: number
  vagas_fixas: number
  por_categoria: boolean
  campo_perfil: string
  valor_campo: string | null
  ordem: number
}

interface ReservaVagasRule {
  regiao: string
  vagas: number
}

interface ProjetoRanking {
  id: string
  proponente_id: string
  categoria_id: string | null
  nota_base: number
  nota_ajustada: number
  data_envio: string
  profile: {
    genero: string | null
    orientacao_sexual: string | null
    raca_etnia: string | null
    pcd: boolean
    renda: string | null
    municipio: string | null
  } | null
}

type ClassificacaoTipo =
  | 'ampla_concorrencia'
  | 'cota_pessoa_negra'
  | 'cota_pessoa_indigena'
  | 'cota_pessoa_pcd'
  | 'cota_areas_perifericas'
  | 'remanejamento'

// ── Desempate helpers ──

function matchesCriteria(p: ProjetoRanking, criterio: string): boolean {
  const prof = p.profile
  if (!prof) return false

  switch (criterio) {
    case 'mulher':
      return prof.genero?.toLowerCase() === 'feminino'
    case 'negro':
      return ['negro', 'pardo', 'negra', 'parda'].includes(prof.raca_etnia?.toLowerCase() || '')
    case 'indigena':
      return prof.raca_etnia?.toLowerCase() === 'indígena' || prof.raca_etnia?.toLowerCase() === 'indigena'
    case 'pcd':
      return prof.pcd === true
    case 'lgbtqiapn':
      return !!prof.orientacao_sexual && !['heterossexual'].includes(prof.orientacao_sexual.toLowerCase())
    case 'menor_renda':
      return true // handled in compare function
    case 'maior_nota_tecnica':
      return true // handled in compare function
    case 'inscricao_anterior':
      return true // handled in compare function
    default:
      return false
  }
}

function compareDesempate(a: ProjetoRanking, b: ProjetoRanking, criterios: string[]): number {
  for (const criterio of criterios) {
    switch (criterio) {
      case 'maior_nota_tecnica':
        if (a.nota_base !== b.nota_base) return b.nota_base - a.nota_base
        break
      case 'inscricao_anterior':
        if (a.data_envio !== b.data_envio) return a.data_envio < b.data_envio ? -1 : 1
        break
      case 'menor_renda': {
        const rendaOrder: Record<string, number> = {
          'ate_1_salario': 1, 'ate_2_salarios': 2, 'ate_3_salarios': 3,
          'ate_5_salarios': 4, 'acima_5_salarios': 5,
        }
        const ra = rendaOrder[a.profile?.renda || ''] || 99
        const rb = rendaOrder[b.profile?.renda || ''] || 99
        if (ra !== rb) return ra - rb
        break
      }
      case 'sorteio': {
        // Deterministic random tiebreak using hash of project IDs
        // Auditable: same input always produces same result
        const hashA = simpleHash(a.id)
        const hashB = simpleHash(b.id)
        if (hashA !== hashB) return hashA - hashB
        break
      }
      default: {
        const aMatch = matchesCriteria(a, criterio)
        const bMatch = matchesCriteria(b, criterio)
        if (aMatch && !bMatch) return -1
        if (!aMatch && bMatch) return 1
        break
      }
    }
  }
  return 0
}

/**
 * Simple deterministic hash for tiebreak sorteio.
 * Uses DJB2 algorithm — same input always produces same output.
 */
function simpleHash(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  return hash
}

// ── Profile field match for cotas ──

function profileMatchesField(profile: ProjetoRanking['profile'], campo: string, valor?: string | null): boolean {
  if (!profile) return false
  const fieldValue = (profile as Record<string, unknown>)[campo]

  if (campo === 'pcd') return fieldValue === true

  if (valor) {
    return String(fieldValue || '').toLowerCase() === valor.toLowerCase()
  }

  // If no valor specified, check truthy
  return !!fieldValue
}

// ── Map tipo_cota → classificacao_tipo ──

function cotaToClassificacao(tipoCota: string): ClassificacaoTipo {
  const map: Record<string, ClassificacaoTipo> = {
    pessoa_negra: 'cota_pessoa_negra',
    pessoa_indigena: 'cota_pessoa_indigena',
    pessoa_pcd: 'cota_pessoa_pcd',
    areas_perifericas: 'cota_areas_perifericas',
  }
  return map[tipoCota] || 'ampla_concorrencia'
}

// ── Main function ──

export async function consolidarRanking(editalId: string) {
  const supabase = await createClient()

  // Auth + role check
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!userProfile || !ADMIN_ROLES.includes(userProfile.role as typeof ADMIN_ROLES[number])) {
    return { error: 'Sem permissão para consolidar ranking' }
  }

  // ── 1. Load edital config ──
  const { data: edital } = await supabase
    .from('editais')
    .select('config_cotas, config_desempate, config_pontuacao_extra, config_reserva_vagas, nota_minima_aprovacao, nota_zero_desclassifica, tipo_edital')
    .eq('id', editalId)
    .single()

  const isCulturaViva = edital?.tipo_edital === 'cultura_viva'

  const pontuacaoExtra: PontuacaoExtraRule[] = (edital?.config_pontuacao_extra as PontuacaoExtraRule[]) || []
  const desempate: string[] = (edital?.config_desempate as string[]) || []
  const reservaVagas: ReservaVagasRule[] = (edital?.config_reserva_vagas as ReservaVagasRule[]) || []

  // ── 1b. Load structured cotas from edital_cotas table ──
  const { data: editalCotas } = await supabase
    .from('edital_cotas')
    .select('tipo_cota, percentual, vagas_fixas, por_categoria, campo_perfil, valor_campo, ordem')
    .eq('edital_id', editalId)
    .order('ordem')

  const cotasEstruturadas: EditalCota[] = (editalCotas || []) as EditalCota[]

  // Fallback: if no structured cotas, use legacy config_cotas JSONB
  const legacyCotas = (edital?.config_cotas as Array<{ nome: string; percentual: number; campo_perfil: string; valor?: string }>) || []

  // ── 2. Load categorias ──
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome, vagas')
    .eq('edital_id', editalId)
    .order('created_at')

  // ── 2b. Load Cultura Viva data ──
  // Load MinC certifications to bypass bloco1 minimum (Fase 10.3)
  let certificadosMincSet = new Set<string>()
  if (isCulturaViva) {
    const { data: certificados } = await supabase
      .from('certificacoes_cultura_viva')
      .select('profile_id')
      .eq('certificado_minc', true)

    if (certificados) {
      certificadosMincSet = new Set(certificados.map(c => c.profile_id))
    }
  }

  // Load criterios bloco info for Cultura Viva
  let criteriosBlocoMap: Map<string, string> | null = null
  if (isCulturaViva) {
    const { data: criterios } = await supabase
      .from('criterios')
      .select('id, bloco')
      .eq('edital_id', editalId)
      .not('bloco', 'is', null)

    if (criterios && criterios.length > 0) {
      criteriosBlocoMap = new Map(criterios.map(c => [c.id, c.bloco as string]))
    }
  }

  // ── 3. Load projetos with avaliacoes ──
  const avaliacaoSelect = isCulturaViva && criteriosBlocoMap
    ? 'id, proponente_id, categoria_id, data_envio, avaliacoes(pontuacao_total, id)'
    : 'id, proponente_id, categoria_id, data_envio, avaliacoes(pontuacao_total)'

  const { data: projetos } = await supabase
    .from('projetos')
    .select(avaliacaoSelect)
    .eq('edital_id', editalId)
    .eq('status_habilitacao', 'habilitado')
    .eq('avaliacoes.status', 'finalizada')
    .not('avaliacoes.pontuacao_total', 'is', null)

  if (!projetos || projetos.length === 0) return { error: 'Nenhum projeto habilitado com avaliações' }

  // Filter only projects that actually have avaliacoes
  const projetosComAval = projetos.filter(
    p => Array.isArray(p.avaliacoes) && p.avaliacoes.length > 0
  )

  if (projetosComAval.length === 0) return { error: 'Nenhum projeto com avaliações finalizadas' }

  // ── 4. Load proponente profiles for pontuação extra & desempate ──
  const proponenteIds = [...new Set(projetosComAval.map(p => p.proponente_id).filter(Boolean))]
  const { data: profiles } = proponenteIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, genero, orientacao_sexual, raca_etnia, pcd, renda, municipio')
        .in('id', proponenteIds)
    : { data: [] }

  const profileMap = new Map((profiles || []).map(p => [p.id, p]))

  // ── 4b. For Cultura Viva, load avaliacao_criterios to compute block scores ──
  let avaliacaoCriteriosMap: Map<string, Array<{ criterio_id: string; nota: number }>> | null = null
  if (isCulturaViva && criteriosBlocoMap) {
    const avaliacaoIds = projetosComAval.flatMap(p =>
      ((p.avaliacoes as Array<{ id: string }>) || []).map(a => a.id)
    )
    if (avaliacaoIds.length > 0) {
      const { data: avalCriterios } = await supabase
        .from('avaliacao_criterios')
        .select('avaliacao_id, criterio_id, nota')
        .in('avaliacao_id', avaliacaoIds)

      if (avalCriterios) {
        avaliacaoCriteriosMap = new Map()
        for (const ac of avalCriterios) {
          const list = avaliacaoCriteriosMap.get(ac.avaliacao_id) || []
          list.push({ criterio_id: ac.criterio_id, nota: Number(ac.nota) })
          avaliacaoCriteriosMap.set(ac.avaliacao_id, list)
        }
      }
    }
  }

  // ── 5. Calculate nota_base + apply pontuação extra ──
  // For Cultura Viva: nota_final = (avg_bloco1 + avg_bloco2) / 2
  const culturaVivaBloco1Scores: Map<string, number> = new Map()

  const rankingList: ProjetoRanking[] = projetosComAval.map(p => {
    const avaliacoes = p.avaliacoes as Array<{ pontuacao_total: number; id?: string }>
    let notaBase: number

    if (isCulturaViva && criteriosBlocoMap && avaliacaoCriteriosMap) {
      // Compute per-block scores across all evaluations
      let bloco1Sum = 0, bloco1Count = 0
      let bloco2Sum = 0, bloco2Count = 0

      for (const aval of avaliacoes) {
        const criterios = aval.id ? avaliacaoCriteriosMap.get(aval.id) || [] : []
        let b1 = 0, b1n = 0, b2 = 0, b2n = 0

        for (const ac of criterios) {
          const bloco = criteriosBlocoMap.get(ac.criterio_id)
          if (bloco === 'bloco1_entidade') { b1 += ac.nota; b1n++ }
          else if (bloco === 'bloco2_projeto') { b2 += ac.nota; b2n++ }
        }

        if (b1n > 0) { bloco1Sum += b1; bloco1Count++ }
        if (b2n > 0) { bloco2Sum += b2; bloco2Count++ }
      }

      const avgBloco1 = bloco1Count > 0 ? bloco1Sum / bloco1Count : 0
      const avgBloco2 = bloco2Count > 0 ? bloco2Sum / bloco2Count : 0
      notaBase = (avgBloco1 + avgBloco2) / 2

      culturaVivaBloco1Scores.set(p.id, avgBloco1)
    } else {
      notaBase = avaliacoes.reduce((sum, a) => sum + Number(a.pontuacao_total), 0) / avaliacoes.length
    }

    const notaBaseRounded = Math.round(notaBase * 100) / 100

    const prof = profileMap.get(p.proponente_id) || null

    // Apply pontuação extra
    let bonus = 0
    for (const rule of pontuacaoExtra) {
      if (prof && profileMatchesField(prof, rule.campo_perfil, rule.valor)) {
        bonus += rule.pontos
      }
    }

    return {
      id: p.id,
      proponente_id: p.proponente_id,
      categoria_id: p.categoria_id,
      nota_base: notaBaseRounded,
      nota_ajustada: Math.round((notaBaseRounded + bonus) * 100) / 100,
      data_envio: p.data_envio,
      profile: prof,
    }
  })

  // ── 6. Sort with desempate ──
  rankingList.sort((a, b) => {
    // Primary: nota_ajustada DESC
    if (a.nota_ajustada !== b.nota_ajustada) return b.nota_ajustada - a.nota_ajustada

    // Tiebreaker
    if (desempate.length > 0) {
      return compareDesempate(a, b, desempate)
    }

    // Default: earlier inscription wins
    return a.data_envio < b.data_envio ? -1 : 1
  })

  // ── 6b. Desclassify projects with nota 0 or below nota mínima ──
  const notaMinima = edital?.nota_minima_aprovacao ? Number(edital.nota_minima_aprovacao) : 0
  const notaZeroDesclassifica = edital?.nota_zero_desclassifica !== false // default true

  const desclassificados: Array<{ id: string; nota_final: number }> = []
  const elegiveisRanking: ProjetoRanking[] = []

  for (const proj of rankingList) {
    // Check nota zero in any individual evaluation
    if (notaZeroDesclassifica) {
      const projetoOriginal = projetosComAval.find(p => p.id === proj.id)
      const hasZero = (projetoOriginal?.avaliacoes as Array<{ pontuacao_total: number }> || []).some(
        a => Number(a.pontuacao_total) === 0
      )
      if (hasZero) {
        desclassificados.push({ id: proj.id, nota_final: proj.nota_ajustada })
        continue
      }
    }

    // Check nota mínima
    if (notaMinima > 0 && proj.nota_base < notaMinima) {
      desclassificados.push({ id: proj.id, nota_final: proj.nota_ajustada })
      continue
    }

    // Cultura Viva: bloco1 < 50 = not eligible for pre-certification
    // Exception: entities already certified by MinC don't need minimum bloco1 score
    if (isCulturaViva && culturaVivaBloco1Scores.has(proj.id)) {
      const bloco1Score = culturaVivaBloco1Scores.get(proj.id)!
      const isCertificadoMinc = certificadosMincSet.has(proj.proponente_id)
      if (bloco1Score < 50 && !isCertificadoMinc) {
        desclassificados.push({ id: proj.id, nota_final: proj.nota_ajustada })
        continue
      }
    }

    elegiveisRanking.push(proj)
  }

  // ── 7. Allocate vagas per category with dual-track cotas ──
  type StatusResult = { id: string; nota_final: number; status_atual: string; classificacao_tipo: ClassificacaoTipo | null }
  const results: StatusResult[] = []

  // Add desclassified projects to results
  for (const d of desclassificados) {
    results.push({
      id: d.id,
      nota_final: d.nota_final,
      status_atual: 'desclassificado',
      classificacao_tipo: null,
    })
  }

  /**
   * Dual-track cota allocation:
   * 1. Rank all projects by nota_ajustada (already sorted)
   * 2. Walk the ranked list top-to-bottom, filling ampla concorrência slots
   * 3. A cotista who ranks high enough in ampla enters ampla → frees their cota slot
   * 4. Cotistas who don't make ampla fill cota slots in order
   * 5. Unfilled cota slots are redistributed: other cotas → ampla (remanejamento)
   */
  function allocateGroup(
    groupProjects: ProjetoRanking[],
    totalVagas: number,
    groupCotas: EditalCota[],
    groupReserva: ReservaVagasRule[]
  ): StatusResult[] {
    const output: StatusResult[] = []

    if (totalVagas <= 0) {
      // No vagas limit = all get ranked as classificado
      return groupProjects.map(p => ({
        id: p.id,
        nota_final: p.nota_ajustada,
        status_atual: 'classificado',
        classificacao_tipo: null,
      }))
    }

    // Calculate cota vagas
    const cotaSlots: Array<EditalCota & { vagas: number; filled: number; members: string[] }> = groupCotas.map(cota => ({
      ...cota,
      vagas: cota.vagas_fixas > 0 ? cota.vagas_fixas : Math.ceil(totalVagas * Number(cota.percentual) / 100),
      filled: 0,
      members: [],
    }))

    const totalCotaVagas = cotaSlots.reduce((sum, c) => sum + c.vagas, 0)
    let vagasAmpla = Math.max(0, totalVagas - totalCotaVagas)

    // Also handle reserva de vagas (reduce from ampla)
    const reservaSlots = groupReserva.map(r => ({ ...r, filled: 0, members: new Set<string>() }))
    const totalReserva = reservaSlots.reduce((sum, r) => sum + r.vagas, 0)
    vagasAmpla = Math.max(0, vagasAmpla - totalReserva)

    // Track which cota(s) each project is eligible for
    function getEligibleCotas(proj: ProjetoRanking): typeof cotaSlots {
      return cotaSlots.filter(cota =>
        profileMatchesField(proj.profile, cota.campo_perfil, cota.valor_campo)
      )
    }

    const assigned = new Map<string, { status: string; classificacao: ClassificacaoTipo }>()
    let amplaFilled = 0

    // ── Pass 1: Walk ranked list, fill ampla concorrência ──
    // A cotista who ranks high enough enters ampla, freeing their cota slot
    for (const proj of groupProjects) {
      if (amplaFilled >= vagasAmpla) break

      const eligible = getEligibleCotas(proj)
      const isCotista = eligible.length > 0

      if (!isCotista) {
        // Non-cotista → must enter via ampla
        assigned.set(proj.id, { status: 'selecionado', classificacao: 'ampla_concorrencia' })
        amplaFilled++
      } else {
        // Cotista ranked high enough for ampla → enters ampla (dual track)
        assigned.set(proj.id, { status: 'selecionado', classificacao: 'ampla_concorrencia' })
        amplaFilled++
      }
    }

    // ── Pass 2: Fill reserva de vagas ──
    for (const reserva of reservaSlots) {
      for (const proj of groupProjects) {
        if (assigned.has(proj.id)) continue
        if (reserva.filled >= reserva.vagas) break

        if (proj.profile?.municipio?.toLowerCase().includes(reserva.regiao.toLowerCase())) {
          assigned.set(proj.id, { status: 'selecionado', classificacao: 'ampla_concorrencia' })
          reserva.filled++
          reserva.members.add(proj.id)
        }
      }
    }

    // ── Pass 3: Fill cota slots with remaining cotistas (not yet selected via ampla) ──
    for (const cota of cotaSlots) {
      for (const proj of groupProjects) {
        if (assigned.has(proj.id)) continue
        if (cota.filled >= cota.vagas) break

        if (profileMatchesField(proj.profile, cota.campo_perfil, cota.valor_campo)) {
          assigned.set(proj.id, { status: 'selecionado', classificacao: cotaToClassificacao(cota.tipo_cota) })
          cota.filled++
          cota.members.push(proj.id)
        }
      }
    }

    // ── Pass 4: Remanejamento — unfilled cota slots ──
    // First try to redistribute to other cotas that have eligible candidates
    let unfilledTotal = cotaSlots.reduce((sum, c) => sum + (c.vagas - c.filled), 0)

    if (unfilledTotal > 0) {
      // Try filling other cotas first
      for (const cota of cotaSlots) {
        if (cota.filled >= cota.vagas) continue // this cota is full

        // Remaining unfilled slots for this cota → try other cotas
        let extraSlots = cota.vagas - cota.filled

        for (const otherCota of cotaSlots) {
          if (otherCota === cota) continue
          if (extraSlots <= 0) break

          for (const proj of groupProjects) {
            if (assigned.has(proj.id)) continue
            if (extraSlots <= 0) break

            if (profileMatchesField(proj.profile, otherCota.campo_perfil, otherCota.valor_campo)) {
              assigned.set(proj.id, { status: 'selecionado', classificacao: 'remanejamento' })
              extraSlots--
            }
          }
        }

        // Remaining unfilled → ampla concorrência (remanejamento)
        if (extraSlots > 0) {
          for (const proj of groupProjects) {
            if (assigned.has(proj.id)) continue
            if (extraSlots <= 0) break

            assigned.set(proj.id, { status: 'selecionado', classificacao: 'remanejamento' })
            extraSlots--
          }
        }
      }
    }

    // ── Assign statuses ──
    for (const proj of groupProjects) {
      const assignment = assigned.get(proj.id)
      output.push({
        id: proj.id,
        nota_final: proj.nota_ajustada,
        status_atual: assignment ? assignment.status : 'suplente',
        classificacao_tipo: assignment ? assignment.classificacao : null,
      })
    }

    return output
  }

  // Build cotas to pass — prefer structured, fallback to legacy
  const cotasToUse: EditalCota[] = cotasEstruturadas.length > 0
    ? cotasEstruturadas
    : legacyCotas.map((c, i) => ({
        tipo_cota: c.campo_perfil === 'pcd' ? 'pessoa_pcd' :
          c.campo_perfil === 'raca_etnia' ? 'pessoa_negra' : 'areas_perifericas',
        percentual: c.percentual,
        vagas_fixas: 0,
        por_categoria: true,
        campo_perfil: c.campo_perfil,
        valor_campo: c.valor || null,
        ordem: i,
      }))

  if (categorias && categorias.length > 0) {
    // Group by category
    for (const cat of categorias) {
      const catProjects = elegiveisRanking.filter(p => p.categoria_id === cat.id)
      if (catProjects.length === 0) continue
      const catCotas = cotasToUse.filter(c => c.por_categoria)
      const catResults = allocateGroup(catProjects, cat.vagas, catCotas, reservaVagas)
      results.push(...catResults)
    }

    // Projects without category
    const uncategorized = elegiveisRanking.filter(p => !p.categoria_id)
    if (uncategorized.length > 0) {
      results.push(...allocateGroup(uncategorized, 0, cotasToUse, reservaVagas))
    }
  } else {
    // No categories — treat all as one group, no vagas limit
    results.push(...elegiveisRanking.map(p => ({
      id: p.id,
      nota_final: p.nota_ajustada,
      status_atual: 'classificado' as string,
      classificacao_tipo: null as ClassificacaoTipo | null,
    })))
  }

  // ── 8. Persist results ──
  if (results.length > 0) {
    const updateResults = await Promise.all(
      results.map(({ id, nota_final, status_atual, classificacao_tipo }) =>
        supabase.from('projetos').update({
          nota_final,
          status_atual,
          classificacao_tipo,
        }).eq('id', id)
      )
    )

    const errors = updateResults.filter(r => r.error)
    if (errors.length > 0) {
      return { error: `Falha ao atualizar ${errors.length} projeto(s)` }
    }
  }

  return {
    success: true,
    total: results.length,
    selecionados: results.filter(r => r.status_atual === 'selecionado').length,
    suplentes: results.filter(r => r.status_atual === 'suplente').length,
    desclassificados: desclassificados.length,
    remanejados: results.filter(r => r.classificacao_tipo === 'remanejamento').length,
  }
}
