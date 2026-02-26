import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
}

function groupStatus(status: string): string {
  if (['criacao', 'publicacao'].includes(status)) return 'Publicados'
  if (['inscricao', 'inscricao_encerrada'].includes(status)) return 'Inscrições'
  if (['habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao', 'resultado_definitivo_habilitacao', 'divulgacao_inscritos', 'recurso_divulgacao_inscritos'].includes(status)) return 'Habilitação'
  if (['avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao'].includes(status)) return 'Avaliação'
  if (['resultado_final', 'homologacao'].includes(status)) return 'Finalizados'
  if (status === 'arquivamento') return 'Arquivados'
  return 'Outros'
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  const supabase = await createClient()

  const [
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalAprovados },
    { data: editaisData },
    { data: projetosComOrcamento },
    { data: proponentesAreas },
  ] = await Promise.all([
    supabase.from('editais').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase.from('projetos').select('id', { count: 'exact', head: true }),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('status_habilitacao', 'habilitado'),
    supabase.from('editais').select('status').eq('active', true),
    supabase.from('projetos').select('orcamento_total').eq('status_habilitacao', 'habilitado').not('orcamento_total', 'is', null),
    supabase.from('profiles').select('areas_atuacao').eq('role', 'proponente').eq('active', true).not('areas_atuacao', 'is', null),
  ])

  // Valor total investido
  const valorTotal = (projetosComOrcamento || []).reduce(
    (sum, p) => sum + (Number(p.orcamento_total) || 0),
    0
  )

  // Editais por fase
  const statusCounts: Record<string, number> = {}
  for (const e of (editaisData || [])) {
    const group = groupStatus(e.status)
    statusCounts[group] = (statusCounts[group] || 0) + 1
  }
  const editaisPorFase = Object.entries(statusCounts)
    .map(([fase, quantidade]) => ({ fase, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade)

  // Áreas culturais
  const areaCounts: Record<string, number> = {}
  for (const p of (proponentesAreas || [])) {
    const areas = p.areas_atuacao as string[] | null
    if (areas) {
      for (const area of areas) {
        const normalized = area.trim()
        if (normalized) {
          areaCounts[normalized] = (areaCounts[normalized] || 0) + 1
        }
      }
    }
  }
  const areasCulturais = Object.entries(areaCounts)
    .map(([area, proponentes]) => ({ area, proponentes }))
    .sort((a, b) => b.proponentes - a.proponentes)
    .slice(0, 15)

  return NextResponse.json(
    {
      dados: {
        resumo: {
          total_editais: totalEditais ?? 0,
          total_inscricoes: totalProjetos ?? 0,
          total_aprovados: totalAprovados ?? 0,
          investimento_cultural: valorTotal,
          investimento_formatado: valorTotal.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          }),
        },
        editais_por_fase: editaisPorFase,
        areas_culturais: areasCulturais,
      },
      meta: {
        total_registros: (totalEditais ?? 0) + (totalProjetos ?? 0),
        gerado_em: new Date().toISOString(),
        fonte: 'Elo Cultural - Portal da Transparência',
        lei_referencia: 'Lei nº 12.527/2011 - Lei de Acesso à Informação',
      },
    },
    { status: 200, headers: CORS_HEADERS }
  )
}
