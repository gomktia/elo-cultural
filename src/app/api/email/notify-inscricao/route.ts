import { createClient } from '@/lib/supabase/server'
import { notifyInscricaoConfirmada } from '@/lib/email/notify'
import { notifyInAppInscricaoConfirmada } from '@/lib/notifications/notify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { protocolo, titulo, editalTitulo, projetoId } = await request.json()

  // Fire-and-forget: email + in-app notification
  notifyInscricaoConfirmada({
    proponenteId: user.id,
    protocolo,
    titulo,
    editalTitulo,
  }).catch(() => {})

  if (projetoId) {
    notifyInAppInscricaoConfirmada({
      projetoId,
      protocolo,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
