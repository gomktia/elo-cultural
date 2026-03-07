import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { DecisaoPDF } from '@/lib/pdf/DecisaoPDF'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Load recurso with projeto and proponente
    const { data: recurso } = await supabase
      .from('recursos')
      .select('*, profiles!recursos_proponente_id_fkey(nome, cpf_cnpj), projetos(id, titulo, numero_protocolo)')
      .eq('id', id)
      .single()

    if (!recurso) {
      return NextResponse.json({ error: 'Recurso nao encontrado' }, { status: 404 })
    }

    // Only generate PDF for decided recursos
    if (!['deferido', 'indeferido', 'deferido_parcial'].includes(recurso.status)) {
      return NextResponse.json({ error: 'Recurso ainda nao foi decidido' }, { status: 400 })
    }

    // Get decisor name
    let decisorNome = 'Autoridade Competente'
    if (recurso.decidido_por) {
      const { data: decisor } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', recurso.decidido_por)
        .single()
      if (decisor?.nome) decisorNome = decisor.nome
    }

    // Get tenant name
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    let tenantNome = 'Municipio'
    if (profile?.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', profile.tenant_id)
        .single()
      if (tenant?.nome) tenantNome = tenant.nome
    }

    const proponenteNome = (recurso.profiles as unknown as { nome: string } | null)?.nome || 'Proponente'
    const projetoTitulo = (recurso.projetos as unknown as { titulo: string } | null)?.titulo || 'Projeto'
    const projetoProtocolo = (recurso.projetos as unknown as { numero_protocolo: string } | null)?.numero_protocolo || '-'

    const dataDecisao = recurso.data_decisao
      ? format(new Date(recurso.data_decisao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
      : format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    const pdfElement = DecisaoPDF({
      tenantNome,
      recursoProtocolo: recurso.numero_protocolo,
      proponenteNome,
      projetoTitulo,
      projetoProtocolo,
      tipoRecurso: recurso.tipo,
      fundamentacao: recurso.fundamentacao || '',
      decisaoTexto: recurso.decisao || '',
      status: recurso.status,
      decisorNome,
      dataDecisao,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="decisao-${recurso.numero_protocolo}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF da decisao:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
