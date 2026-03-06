import { createClient } from '@/lib/supabase/server'
import { notifyPrestacaoStatus } from '@/lib/email/notify'
import { notifyInAppPrestacaoAnalise } from '@/lib/notifications/notify'
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

  // In-app notification (need projeto_id from prestação)
  const { data: prestacao } = await supabase
    .from('prestacoes_contas')
    .select('projeto_id, julgamento')
    .eq('id', prestacaoId)
    .single()

  if (prestacao) {
    notifyInAppPrestacaoAnalise({
      projetoId: prestacao.projeto_id,
      julgamento: prestacao.julgamento || status,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
