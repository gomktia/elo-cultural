import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  const body = await request.json()
  const { motivo } = body

  if (!motivo || motivo.trim().length < 10) {
    return NextResponse.json(
      { error: 'Motivo deve ter pelo menos 10 caracteres.' },
      { status: 400 }
    )
  }

  // Buscar perfil para dados do log
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, nome, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Perfil nao encontrado' }, { status: 404 })
  }

  // Verificar se ja existe solicitacao pendente
  const { data: existente } = await supabase
    .from('logs_auditoria')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('acao', 'SOLICITACAO_EXCLUSAO_LGPD')
    .order('created_at', { ascending: false })
    .limit(1)

  if (existente && existente.length > 0) {
    // Verificar se a ultima solicitacao foi ha menos de 24h
    return NextResponse.json(
      { error: 'Voce ja possui uma solicitacao de exclusao registrada. A administracao entrara em contato.' },
      { status: 409 }
    )
  }

  // Registrar solicitacao como log de auditoria imutavel
  const { error: logError } = await supabase
    .from('logs_auditoria')
    .insert({
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      acao: 'SOLICITACAO_EXCLUSAO_LGPD',
      tabela_afetada: 'profiles',
      registro_id: user.id,
      dados_antigos: {
        nome: profile.nome,
        email: user.email,
        role: profile.role,
      },
      dados_novos: {
        tipo: 'solicitacao_exclusao',
        motivo: motivo.trim(),
        data_solicitacao: new Date().toISOString(),
        status: 'pendente',
        fundamentacao_legal: 'LGPD Art. 18, VI - Eliminacao dos dados pessoais',
      },
      ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
    })

  if (logError) {
    return NextResponse.json(
      { error: 'Erro ao registrar solicitacao: ' + logError.message },
      { status: 500 }
    )
  }

  // Revogar consentimento LGPD no perfil
  await supabase
    .from('profiles')
    .update({ consentimento_lgpd: false })
    .eq('id', user.id)

  const protocolo = `EXC-${Date.now()}`

  return NextResponse.json({
    success: true,
    protocolo,
    mensagem: 'Sua solicitacao de exclusao foi registrada com sucesso. A administracao analisara seu pedido conforme a LGPD (Art. 18, VI). Voce sera notificado sobre o andamento.',
  })
}
