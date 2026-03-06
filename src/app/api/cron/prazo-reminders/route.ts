import { NextRequest, NextResponse } from 'next/server'
import { enviarLembretesPrazos } from '@/lib/actions/prazo-reminders'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
  }

  try {
    const result = await enviarLembretesPrazos()
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[cron/prazo-reminders] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
