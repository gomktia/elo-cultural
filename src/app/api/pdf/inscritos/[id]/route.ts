import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { InscritosPDF } from '@/lib/pdf/InscritosPDF'
import type { InscritoPDFItem } from '@/lib/pdf/InscritosPDF'
import type { Edital } from '@/types/database.types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Load edital
    const { data: edital, error: editalError } = await supabase
      .from('editais')
      .select('*')
      .eq('id', id)
      .single()

    if (editalError || !edital) {
      return NextResponse.json({ error: 'Edital nao encontrado' }, { status: 404 })
    }

    const e = edital as Edital

    // Only allow after divulgacao_inscritos
    const allowedPhases = [
      'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
      'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
      'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
      'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
    ]

    if (!allowedPhases.includes(e.status)) {
      return NextResponse.json(
        { error: 'Lista de inscritos ainda nao disponivel' },
        { status: 403 }
      )
    }

    // Load projects with proponent name
    const { data: projetos } = await supabase
      .from('projetos')
      .select('id, titulo, numero_protocolo, data_envio, categoria_id, profiles:proponente_id (nome)')
      .eq('edital_id', id)
      .order('data_envio', { ascending: true })

    // Load categories
    const { data: categorias } = await supabase
      .from('edital_categorias')
      .select('id, nome')
      .eq('edital_id', id)

    const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

    // Load tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('nome')
      .eq('id', e.tenant_id)
      .single()

    const inscritos: InscritoPDFItem[] = (projetos || []).map((p, idx) => ({
      numero: idx + 1,
      proponente: (p.profiles as unknown as { nome: string } | null)?.nome || '---',
      projeto: p.titulo,
      categoria: p.categoria_id ? catMap.get(p.categoria_id) || '---' : '---',
      protocolo: p.numero_protocolo || '---',
    }))

    const geradoEm = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

    const pdfElement = InscritosPDF({
      tenantNome: tenant?.nome || 'Ente Federativo',
      numeroEdital: e.numero_edital,
      tituloEdital: e.titulo,
      inscritos,
      geradoEm,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(pdfElement as any)

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="inscritos-${e.numero_edital}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar PDF de inscritos:', error)
    return NextResponse.json(
      { error: 'Erro interno ao gerar PDF' },
      { status: 500 }
    )
  }
}
