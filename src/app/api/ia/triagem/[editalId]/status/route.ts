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
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Get editalId from params
  const { editalId } = await params

  if (!editalId) {
    return NextResponse.json({ error: 'editalId é obrigatório' }, { status: 400 })
  }

  try {
    // 3. Fetch latest execution for this edital (any status)
    const { data: execucao } = await supabase
      .from('triagem_ia_execucoes')
      .select('status, total_projetos, projetos_analisados, erro_mensagem')
      .eq('edital_id', editalId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 4. If no execution found
    if (!execucao) {
      return NextResponse.json({ status: null })
    }

    return NextResponse.json({
      status: execucao.status,
      total_projetos: execucao.total_projetos,
      projetos_analisados: execucao.projetos_analisados,
      erro_mensagem: execucao.erro_mensagem,
    })
  } catch (error: unknown) {
    console.error('Erro ao buscar status da triagem:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: 'Erro interno ao buscar status' }, { status: 500 })
  }
}
