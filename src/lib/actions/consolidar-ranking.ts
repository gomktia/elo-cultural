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

interface CotaRule {
  nome: string
  percentual: number
  campo_perfil: string
  valor?: string
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

// ── Profile field match for cotas ──

function profileMatchesField(profile: ProjetoRanking['profile'], campo: string, valor?: string): boolean {
  if (!profile) return false
  const fieldValue = (profile as Record<string, unknown>)[campo]

  if (campo === 'pcd') return fieldValue === true

  if (valor) {
    return String(fieldValue || '').toLowerCase() === valor.toLowerCase()
  }

  // If no valor specified, check truthy
  return !!fieldValue
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
    .select('config_cotas, config_desempate, config_pontuacao_extra, config_reserva_vagas')
    .eq('id', editalId)
    .single()

  const pontuacaoExtra: PontuacaoExtraRule[] = (edital?.config_pontuacao_extra as PontuacaoExtraRule[]) || []
  const cotas: CotaRule[] = (edital?.config_cotas as CotaRule[]) || []
  const desempate: string[] = (edital?.config_desempate as string[]) || []
  const reservaVagas: ReservaVagasRule[] = (edital?.config_reserva_vagas as ReservaVagasRule[]) || []

  // ── 2. Load categorias ──
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome, vagas')
    .eq('edital_id', editalId)
    .order('created_at')

  // ── 3. Load projetos with avaliacoes ──
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, proponente_id, categoria_id, data_envio, avaliacoes(pontuacao_total)')
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

  // ── 5. Calculate nota_base + apply pontuação extra ──
  const rankingList: ProjetoRanking[] = projetosComAval.map(p => {
    const avaliacoes = p.avaliacoes as Array<{ pontuacao_total: number }>
    const notaBase = avaliacoes.reduce((sum, a) => sum + Number(a.pontuacao_total), 0) / avaliacoes.length
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

  // ── 7. Allocate vagas per category ──
  type StatusResult = { id: string; nota_final: number; status_atual: string }
  const results: StatusResult[] = []

  function allocateGroup(
    groupProjects: ProjetoRanking[],
    totalVagas: number,
    groupCotas: CotaRule[],
    groupReserva: ReservaVagasRule[]
  ): StatusResult[] {
    const output: StatusResult[] = []
    const selected = new Set<string>()

    if (totalVagas <= 0) {
      // No vagas limit = all get ranked but no status assignment
      return groupProjects.map(p => ({
        id: p.id,
        nota_final: p.nota_ajustada,
        status_atual: 'classificado',
      }))
    }

    let vagasRestantes = totalVagas

    // Step A: Fill cota spots first
    for (const cota of groupCotas) {
      const vagasCota = Math.ceil(totalVagas * cota.percentual / 100)
      let filled = 0

      for (const proj of groupProjects) {
        if (selected.has(proj.id)) continue
        if (filled >= vagasCota) break

        if (proj.profile && profileMatchesField(proj.profile, cota.campo_perfil, cota.valor)) {
          selected.add(proj.id)
          filled++
          vagasRestantes--
        }
      }
    }

    // Step B: Fill reserva de vagas spots
    for (const reserva of groupReserva) {
      let filled = 0
      for (const proj of groupProjects) {
        if (selected.has(proj.id)) continue
        if (filled >= reserva.vagas) break

        if (proj.profile?.municipio?.toLowerCase().includes(reserva.regiao.toLowerCase())) {
          selected.add(proj.id)
          filled++
          vagasRestantes--
        }
      }
    }

    // Step C: Fill remaining spots from ranked list
    for (const proj of groupProjects) {
      if (selected.has(proj.id)) continue
      if (vagasRestantes <= 0) break
      selected.add(proj.id)
      vagasRestantes--
    }

    // Step D: Assign statuses
    for (const proj of groupProjects) {
      output.push({
        id: proj.id,
        nota_final: proj.nota_ajustada,
        status_atual: selected.has(proj.id) ? 'selecionado' : 'suplente',
      })
    }

    return output
  }

  if (categorias && categorias.length > 0) {
    // Group by category
    for (const cat of categorias) {
      const catProjects = rankingList.filter(p => p.categoria_id === cat.id)
      if (catProjects.length === 0) continue
      const catResults = allocateGroup(catProjects, cat.vagas, cotas, reservaVagas)
      results.push(...catResults)
    }

    // Projects without category
    const uncategorized = rankingList.filter(p => !p.categoria_id)
    if (uncategorized.length > 0) {
      const totalVagasCategorizadas = categorias.reduce((sum, c) => sum + (c.vagas || 0), 0)
      results.push(...allocateGroup(uncategorized, 0, cotas, reservaVagas))
    }
  } else {
    // No categories — treat all as one group, no vagas limit
    // Projects are just ranked without selecionado/suplente
    // (unless we had a total vagas field on the edital, which we don't)
    results.push(...rankingList.map((p, idx) => ({
      id: p.id,
      nota_final: p.nota_ajustada,
      status_atual: 'classificado',
    })))
  }

  // ── 8. Persist results ──
  if (results.length > 0) {
    const updateResults = await Promise.all(
      results.map(({ id, nota_final, status_atual }) =>
        supabase.from('projetos').update({ nota_final, status_atual }).eq('id', id)
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
  }
}
