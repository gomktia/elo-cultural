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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 20))
  const status = searchParams.get('status')
  const offset = (page - 1) * limit

  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('editais')
    .select('id, numero_edital, titulo, descricao, status, inicio_inscricao, fim_inscricao, created_at', { count: 'exact' })
    .eq('active', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Erro ao consultar editais (transparência):', error)
    return NextResponse.json(
      { erro: 'Erro interno ao consultar editais' },
      { status: 500, headers: CORS_HEADERS }
    )
  }

  const total = count ?? 0
  const totalPages = Math.ceil(total / limit)

  return NextResponse.json(
    {
      dados: (data || []).map(edital => ({
        id: edital.id,
        numero_edital: edital.numero_edital,
        titulo: edital.titulo,
        descricao: edital.descricao,
        status: edital.status,
        inicio_inscricao: edital.inicio_inscricao,
        fim_inscricao: edital.fim_inscricao,
        criado_em: edital.created_at,
      })),
      meta: {
        total,
        pagina: page,
        limite: limit,
        total_paginas: totalPages,
        gerado_em: new Date().toISOString(),
        fonte: 'Elo Cultural - Portal da Transparência',
      },
    },
    { status: 200, headers: CORS_HEADERS }
  )
}
