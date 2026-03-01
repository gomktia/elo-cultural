import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || '5'), 50)
  const offset = Number(searchParams.get('offset') || '0')

  const [notificacoesResult, countResult] = await Promise.all([
    supabase
      .from('notificacoes')
      .select('*')
      .eq('usuario_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1),
    supabase
      .from('notificacoes')
      .select('id', { count: 'exact', head: true })
      .eq('usuario_id', user.id)
      .eq('lida', false),
  ])

  return NextResponse.json({
    notificacoes: notificacoesResult.data || [],
    unread_count: countResult.count || 0,
  })
}
