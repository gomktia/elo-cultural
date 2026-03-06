import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { PortariaComissaoPDF } from '@/lib/pdf/PortariaComissaoPDF'
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

    // Load edital
    const { data: edital } = await supabase
      .from('editais')
      .select('id, titulo, numero_edital, tenant_id')
      .eq('id', id)
      .single()

    if (!edital) {
      return NextResponse.json({ error: 'Edital nao encontrado' }, { status: 404 })
    }

    // Load comissao members
    const { data: membros } = await supabase
      .from('edital_comissao')
      .select('nome, cpf, qualificacao, tipo, portaria_numero')
      .eq('edital_id', id)
      .order('tipo')
      .order('nome')

    if (!membros || membros.length === 0) {
      return NextResponse.json({ error: 'Nenhum membro na comissao' }, { status: 400 })
    }

    // Get tenant name
    let tenantNome = 'Municipio'
    if (edital.tenant_id) {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('nome')
        .eq('id', edital.tenant_id)
        .single()
      if (tenant?.nome) tenantNome = tenant.nome
    }

    // Use the first portaria_numero found, or a default
    const portariaNumero = membros.find(m => m.portaria_numero)?.portaria_numero || '___/2026'

    const dataPublicacao = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })

    const pdfElement = PortariaComissaoPDF({
      tenantNome,
      editalTitulo: edital.titulo,
      editalNumero: edital.numero_edital || '',
      portariaNumero,
      membros: membros.map(m => ({
        nome: m.nome,
        cpf: m.cpf,
        qualificacao: m.qualificacao,
        tipo: m.tipo,
      })),
      dataPublicacao,
    })

    const buffer = await renderToBuffer(pdfElement as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="portaria-comissao-${edital.numero_edital || id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF da portaria:', error)
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 })
  }
}
