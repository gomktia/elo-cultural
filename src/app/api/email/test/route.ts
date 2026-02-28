import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/resend'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nome')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 403 })
  }

  const success = await sendEmail({
    to: user.email,
    subject: 'Teste de Email — Elo Cultura Digital',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Roboto,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
  <tr><td style="background:#0047AB;padding:24px 32px;text-align:center">
    <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700">Elo<span style="color:#eeb513">Cultural</span></h1>
  </td></tr>
  <tr><td style="padding:32px">
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:600">Email de Teste</h2>
    <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.6">
      Ola, <strong>${profile?.nome || user.email}</strong>!
    </p>
    <p style="margin:0 0 12px;color:#475569;font-size:14px;line-height:1.6">
      Se voce esta lendo esta mensagem, a integracao com o Resend esta funcionando corretamente.
    </p>
    <div style="background:#dcfce7;border-radius:8px;padding:12px 16px;margin:16px 0">
      <strong style="color:#166534;font-size:14px">Configuracao OK</strong>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;color:#94a3b8;font-size:11px">Elo Cultura Digital — Plataforma de Processos Seletivos Culturais</p>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`,
  })

  if (success) {
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Falha ao enviar. Verifique a API key e o email remetente.' }, { status: 500 })
}
