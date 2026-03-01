import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { id, all } = body as { id?: string; all?: boolean }

  if (all) {
    const { error } = await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('usuario_id', user.id)
      .eq('lida', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (!id) {
    return NextResponse.json({ error: 'ID da notificacao obrigatorio' }, { status: 400 })
  }

  const { error } = await supabase
    .from('notificacoes')
    .update({ lida: true })
    .eq('id', id)
    .eq('usuario_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
