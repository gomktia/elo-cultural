import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Buscar edital
  const { data: edital, error: editalError } = await supabase
    .from('editais')
    .select('id, numero_edital, titulo, descricao, status, inicio_inscricao, fim_inscricao, inicio_recurso, fim_recurso, inicio_recurso_inscricao, fim_recurso_inscricao, inicio_recurso_selecao, fim_recurso_selecao, inicio_recurso_habilitacao, fim_recurso_habilitacao, versao, created_at')
    .eq('id', id)
    .eq('active', true)
    .single()

  if (editalError || !edital) {
    return NextResponse.json(
      { erro: 'Edital não encontrado' },
      { status: 404, headers: CORS_HEADERS }
    )
  }

  // Queries em paralelo
  const [
    { data: fases },
    { data: criterios },
    { data: publicacoes },
    { count: totalInscritos },
    { count: totalHabilitados },
    { count: totalAprovados },
  ] = await Promise.all([
    supabase
      .from('edital_fases')
      .select('fase, data_inicio, data_fim, bloqueada, observacao')
      .eq('edital_id', id)
      .order('created_at', { ascending: true }),
    supabase
      .from('criterios')
      .select('descricao, nota_minima, nota_maxima, peso, ordem')
      .eq('edital_id', id)
      .order('ordem', { ascending: true }),
    supabase
      .from('publicacoes')
      .select('tipo, numero_publicacao, titulo, data_publicacao')
      .eq('edital_id', id)
      .order('data_publicacao', { ascending: false }),
    supabase
      .from('projetos')
      .select('id', { count: 'exact', head: true })
      .eq('edital_id', id),
    supabase
      .from('projetos')
      .select('id', { count: 'exact', head: true })
      .eq('edital_id', id)
      .eq('status_habilitacao', 'habilitado'),
    supabase
      .from('projetos')
      .select('id', { count: 'exact', head: true })
      .eq('edital_id', id)
      .eq('status_habilitacao', 'habilitado')
      .not('nota_final', 'is', null),
  ])

  // Ranking público (apenas projetos com nota final, sem dados pessoais)
  const { data: ranking } = await supabase
    .from('projetos')
    .select('numero_protocolo, titulo, nota_final, status_habilitacao')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
    .not('nota_final', 'is', null)
    .order('nota_final', { ascending: false })
    .limit(50)

  return NextResponse.json(
    {
      dados: {
        id: edital.id,
        numero_edital: edital.numero_edital,
        titulo: edital.titulo,
        descricao: edital.descricao,
        status: edital.status,
        versao: edital.versao,
        datas: {
          inicio_inscricao: edital.inicio_inscricao,
          fim_inscricao: edital.fim_inscricao,
          inicio_recurso: edital.inicio_recurso,
          fim_recurso: edital.fim_recurso,
          inicio_recurso_inscricao: edital.inicio_recurso_inscricao,
          fim_recurso_inscricao: edital.fim_recurso_inscricao,
          inicio_recurso_selecao: edital.inicio_recurso_selecao,
          fim_recurso_selecao: edital.fim_recurso_selecao,
          inicio_recurso_habilitacao: edital.inicio_recurso_habilitacao,
          fim_recurso_habilitacao: edital.fim_recurso_habilitacao,
          criado_em: edital.created_at,
        },
        fases: fases || [],
        criterios: (criterios || []).map(c => ({
          descricao: c.descricao,
          nota_minima: c.nota_minima,
          nota_maxima: c.nota_maxima,
          peso: c.peso,
          ordem: c.ordem,
        })),
        estatisticas: {
          total_inscritos: totalInscritos ?? 0,
          total_habilitados: totalHabilitados ?? 0,
          total_avaliados: totalAprovados ?? 0,
        },
        publicacoes: (publicacoes || []).map(p => ({
          tipo: p.tipo,
          numero: p.numero_publicacao,
          titulo: p.titulo,
          data_publicacao: p.data_publicacao,
        })),
        ranking: (ranking || []).map((r, i) => ({
          posicao: i + 1,
          protocolo: r.numero_protocolo,
          titulo: r.titulo,
          nota_final: r.nota_final,
        })),
      },
      meta: {
        gerado_em: new Date().toISOString(),
        fonte: 'Elo Cultural - Portal da Transparência',
      },
    },
    { status: 200, headers: CORS_HEADERS }
  )
}
