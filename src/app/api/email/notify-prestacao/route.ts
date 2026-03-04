import { createClient } from '@/lib/supabase/server'
import { notifyPrestacaoStatus } from '@/lib/email/notify'
import { NextRequest, NextResponse } from 'next/server'
import { GESTAO_ROLES } from '@/lib/constants/roles'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Verify admin/gestor role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !GESTAO_ROLES.includes(profile.role as typeof GESTAO_ROLES[number])) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const { prestacaoId, status, parecer } = await request.json()

  notifyPrestacaoStatus({
    prestacaoId,
    status,
    parecer: parecer || '',
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
