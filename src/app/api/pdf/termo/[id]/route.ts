import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { TermoPDF } from '@/lib/pdf/TermoPDF'
import type { AssinaturaData } from '@/lib/pdf/TermoPDF'

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
          cpf_cnpj,
          endereco_completo,
          municipio,
          estado
        )
      `)
      .eq('id', id)
      .single()

    if (termoError || !termo) {
      return NextResponse.json({ error: 'Termo nao encontrado' }, { status: 404 })
    }

    // Load tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome, cnpj')
      .eq('id', termo.tenant_id)
      .single()

    // Load assinaturas for this termo
    const { data: assinaturas } = await supabase
      .from('assinaturas_digitais')
      .select('nome_signatario, papel_signatario, ip_address, hash_documento, assinado_em')
      .eq('documento_tipo', 'termo_execucao')
      .eq('documento_id', id)

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
      endereco_completo: string | null
      municipio: string | null
      estado: string | null
    } | null

    const pdfElement = TermoPDF({
      tenantNome: tenant?.nome || 'Ente Federativo',
      numeroTermo: termo.numero_termo,
      numeroEdital: projeto?.editais?.numero_edital || '',
      proponenteNome: profile?.nome || '---',
      proponenteCpf: profile?.cpf_cnpj || null,
      proponenteRg: null,
      proponenteEndereco: profile?.endereco_completo || null,
      proponenteMunicipio: profile?.municipio || null,
      proponenteEstado: profile?.estado || null,
      projetoTitulo: projeto?.titulo || '---',
      editalReferencia: termo.edital_referencia || projeto?.editais?.numero_edital || null,
      valorTotal: Number(termo.valor_total) || 0,
      valorExtenso: termo.valor_extenso || null,
      vigenciaInicio: termo.vigencia_inicio || null,
      vigenciaFim: termo.vigencia_fim || null,
      vigenciaMeses: termo.vigencia_meses || 0,
      banco: termo.banco || null,
      agencia: termo.agencia || null,
      contaCorrente: termo.conta_corrente || null,
      tipoConta: termo.tipo_conta || 'corrente',
      representanteNome: gestorProfile?.nome || null,
      representanteCargo: gestorProfile?.funcao_cargo || null,
      assinaturas: ((assinaturas || []) as AssinaturaData[]),
    })

    const buffer = await renderToBuffer(pdfElement as any)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="termo-${termo.numero_termo}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF do termo:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar PDF' },
      { status: 500 }
    )
  }
}
