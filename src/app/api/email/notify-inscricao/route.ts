import { createClient } from '@/lib/supabase/server'
import { notifyInscricaoConfirmada } from '@/lib/email/notify'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const { protocolo, titulo, editalTitulo } = await request.json()

  // Fire-and-forget
  notifyInscricaoConfirmada({
    proponenteId: user.id,
    protocolo,
    titulo,
    editalTitulo,
  }).catch(() => {})

  return NextResponse.json({ ok: true })
}
