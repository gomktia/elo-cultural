import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { AditivoPDF } from '@/lib/pdf/AditivoPDF'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
    }

    // Load aditivo
    const { data: aditivo, error: aditivoError } = await supabase
      .from('termos_aditivos')
      .select('*')
      .eq('id', id)
      .single()

    if (aditivoError || !aditivo) {
      return NextResponse.json({ error: 'Aditivo nao encontrado' }, { status: 404 })
    }

    // Load termo with project and proponente
    const { data: termo, error: termoError } = await supabase
      .from('termos_execucao')
      .select(`
        *,
        projetos:projeto_id (
          titulo,
          numero_protocolo,
          editais:edital_id (titulo, numero_edital)
        ),
        profiles:proponente_id (
          nome,
          cpf_cnpj
        )
      `)
      .eq('id', aditivo.termo_id)
      .single()

    if (termoError || !termo) {
      return NextResponse.json({ error: 'Termo nao encontrado' }, { status: 404 })
    }

    // Load tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome')
      .eq('id', termo.tenant_id)
      .single()

    // Load gestor profile for representative info
    const { data: gestorProfile } = await supabase
      .from('profiles')
      .select('nome, funcao_cargo')
      .eq('tenant_id', termo.tenant_id)
      .in('role', ['gestor', 'admin'])
      .limit(1)
      .single()

    // Cast Supabase join results
    const projeto = termo.projetos as unknown as {
      titulo: string
      numero_protocolo: string
      editais: { titulo: string; numero_edital: string } | null
    } | null

    const profile = termo.profiles as unknown as {
      nome: string
      cpf_cnpj: string | null
    } | null

    const pdfElement = AditivoPDF({
      tenantNome: tenant?.nome || 'Ente Federativo',
      numeroAditivo: aditivo.numero_aditivo,
      numeroTermo: termo.numero_termo,
      proponenteNome: profile?.nome || '---',
      proponenteCpf: profile?.cpf_cnpj || null,
      projetoTitulo: projeto?.titulo || '---',
      tipo: aditivo.tipo,
      descricaoAlteracao: aditivo.justificativa,
      justificativa: aditivo.justificativa,
      valorAnterior: Number(termo.valor_total) || null,
      valorNovo: aditivo.valor_alterado != null ? Number(aditivo.valor_alterado) : null,
      dataInicioAnterior: termo.vigencia_inicio || null,
      dataFimAnterior: termo.vigencia_fim || null,
      dataInicioNovo: null,
      dataFimNovo: aditivo.nova_vigencia_fim || null,
      representanteNome: gestorProfile?.nome || null,
      representanteCargo: gestorProfile?.funcao_cargo || null,
    })

    const buffer = await renderToBuffer(pdfElement as any)

    const filename = `aditivo-${aditivo.numero_aditivo}-termo-${termo.numero_termo}.pdf`

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF do aditivo:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar PDF' },
      { status: 500 }
    )
  }
}
