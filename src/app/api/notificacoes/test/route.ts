import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Temporary test route - DELETE after testing
export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
  }

  // Get tenant_id from profile
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profile nao encontrado' }, { status: 404 })
  }

  const testNotifications = [
    {
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      tipo: 'habilitacao_resultado',
      titulo: 'Projeto Habilitado',
      mensagem: 'Seu projeto "Festival de Teatro Comunitário de Pinhais" foi habilitado.',
      link: '/projetos',
    },
    {
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      tipo: 'edital_fase',
      titulo: 'Edital: Resultado Final',
      mensagem: 'O edital "Fomento à Cultura - Lei Paulo Gustavo" avançou para a fase: Resultado Final.',
      link: '/editais',
    },
    {
      tenant_id: profile.tenant_id,
      usuario_id: user.id,
      tipo: 'recurso_decisao',
      titulo: 'Recurso Deferido',
      mensagem: 'Seu recurso referente ao projeto "Mostra de Cinema Independente" foi deferido.',
      link: '/projetos',
    },
  ]

  const { error } = await serviceClient.from('notificacoes').insert(testNotifications)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, count: testNotifications.length })
}
