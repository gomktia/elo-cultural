'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Exportar fichas de avaliação de um edital — Fase 8.3
 * Gera XML SpreadsheetML com uma aba por projeto avaliado
 */
export async function exportarFichasAvaliacao(editalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, role')
    .eq('id', user.id)
    .single()

  if (!profile || !['gestor', 'admin', 'super_admin'].includes(profile.role)) {
    return { error: 'Sem permissão' }
  }

  // Load edital
  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital')
    .eq('id', editalId)
    .single()

  if (!edital) return { error: 'Edital não encontrado' }

  // Load criterios
  const { data: criterios } = await supabase
    .from('criterios_avaliacao')
    .select('id, descricao, nota_maxima, peso')
    .eq('edital_id', editalId)
    .order('ordem', { ascending: true })

  const criteriosList = criterios || []

  // Load projetos
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, nota_final, status_atual, proponente_id, profiles:proponente_id(nome)')
    .eq('edital_id', editalId)
    .order('nota_final', { ascending: false })

  interface ProjetoExport {
    id: string
    titulo: string
    numero_protocolo: string | null
    nota_final: number | null
    status_atual: string
    proponente_id: string
    profiles: unknown
  }

  const projetosList = (projetos || []) as ProjetoExport[]

  // Load all avaliacoes for this edital
  const projetoIds = projetosList.map(p => p.id)
  const { data: avaliacoes } = await supabase
    .from('avaliacoes')
    .select('id, projeto_id, avaliador_id, nota_total, status, justificativa, notas_criterios, profiles:avaliador_id(nome)')
    .in('projeto_id', projetoIds.length > 0 ? projetoIds : ['_none_'])

  interface AvaliacaoExport {
    id: string
    projeto_id: string
    avaliador_id: string
    nota_total: number | null
    status: string
    justificativa: string | null
    notas_criterios: Record<string, number> | null
    profiles: unknown
  }

  const avaliacoesList = (avaliacoes || []) as AvaliacaoExport[]

  // Group avaliacoes by projeto
  const avaliacoesByProjeto = new Map<string, AvaliacaoExport[]>()
  for (const a of avaliacoesList) {
    const list = avaliacoesByProjeto.get(a.projeto_id) || []
    list.push(a)
    avaliacoesByProjeto.set(a.projeto_id, list)
  }

  const esc = (val: unknown) => String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Generate one worksheet per project (max 30 to avoid huge files)
  const maxSheets = Math.min(projetosList.length, 30)
  const worksheets: string[] = []

  // Summary sheet
  const summaryHeaders = ['#', 'Protocolo', 'Proponente', 'Projeto', 'Nota Final', 'Status', 'Avaliações']
  const summarySheet = `<Worksheet ss:Name="Resumo">
<Table>
<Row><Cell ss:StyleID="header" ss:MergeAcross="6"><Data ss:Type="String">${esc(edital.titulo)} - Fichas de Avaliação</Data></Cell></Row>
<Row>${summaryHeaders.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${projetosList.map((p, i) => {
    const avals = avaliacoesByProjeto.get(p.id) || []
    const proponenteNome = (p.profiles as unknown as { nome: string } | null)?.nome || ''
    return `<Row>
<Cell><Data ss:Type="Number">${i + 1}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.numero_protocolo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(proponenteNome)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.titulo)}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.nota_final || 0}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.status_atual)}</Data></Cell>
<Cell><Data ss:Type="Number">${avals.filter(a => a.status === 'finalizada').length}</Data></Cell>
</Row>`
  }).join('\n')}
</Table>
</Worksheet>`
  worksheets.push(summarySheet)

  // Individual ficha sheets
  for (let i = 0; i < maxSheets; i++) {
    const p = projetosList[i]
    const avals = avaliacoesByProjeto.get(p.id) || []
    const proponenteNome = (p.profiles as unknown as { nome: string } | null)?.nome || ''
    const sheetName = `P${String(i + 1).padStart(2, '0')} ${esc(p.numero_protocolo || '').substring(0, 20)}`

    // Build header: Critério | Max | Peso | Avaliador 1 | Avaliador 2 | ...
    const avaliadorHeaders = avals.map((a, j) => {
      const nome = (a.profiles as unknown as { nome: string } | null)?.nome || `Avaliador ${j + 1}`
      return nome
    })
    const headers = ['Critério', 'Nota Máx', 'Peso', ...avaliadorHeaders, 'Média']

    let rows = ''

    // Project info header
    rows += `<Row><Cell ss:StyleID="header" ss:MergeAcross="${headers.length - 1}"><Data ss:Type="String">FICHA DE AVALIAÇÃO - ${esc(p.titulo)}</Data></Cell></Row>`
    rows += `<Row><Cell><Data ss:Type="String">Protocolo: ${esc(p.numero_protocolo)}</Data></Cell><Cell ss:MergeAcross="${headers.length - 2}"><Data ss:Type="String">Proponente: ${esc(proponenteNome)}</Data></Cell></Row>`
    rows += `<Row></Row>`

    // Criteria header row
    rows += `<Row>${headers.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${esc(h)}</Data></Cell>`).join('')}</Row>`

    // Criteria rows
    for (const crit of criteriosList) {
      const notasAvaliadores = avals.map(a => {
        const notas = a.notas_criterios || {}
        return notas[crit.id] as number | undefined
      })
      const notasValidas = notasAvaliadores.filter((n): n is number => n != null).map(Number)
      const media = notasValidas.length > 0 ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length : 0

      rows += `<Row>
<Cell><Data ss:Type="String">${esc(crit.descricao)}</Data></Cell>
<Cell><Data ss:Type="Number">${crit.nota_maxima}</Data></Cell>
<Cell><Data ss:Type="Number">${crit.peso}</Data></Cell>
${notasAvaliadores.map(n => `<Cell ss:StyleID="num"><Data ss:Type="Number">${n || 0}</Data></Cell>`).join('')}
<Cell ss:StyleID="num"><Data ss:Type="Number">${media.toFixed(2)}</Data></Cell>
</Row>`
    }

    // Total row
    rows += `<Row>
<Cell ss:StyleID="header"><Data ss:Type="String">TOTAL</Data></Cell>
<Cell></Cell><Cell></Cell>
${avals.map(a => `<Cell ss:StyleID="num"><Data ss:Type="Number">${a.nota_total || 0}</Data></Cell>`).join('')}
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.nota_final || 0}</Data></Cell>
</Row>`

    // Justificativas
    rows += `<Row></Row>`
    rows += `<Row><Cell ss:StyleID="header"><Data ss:Type="String">Pareceres</Data></Cell></Row>`
    for (let j = 0; j < avals.length; j++) {
      const a = avals[j]
      const nome = (a.profiles as unknown as { nome: string } | null)?.nome || `Avaliador ${j + 1}`
      rows += `<Row>
<Cell ss:StyleID="header"><Data ss:Type="String">${esc(nome)}</Data></Cell>
<Cell ss:MergeAcross="${headers.length - 2}"><Data ss:Type="String">${esc(a.justificativa)}</Data></Cell>
</Row>`
    }

    worksheets.push(`<Worksheet ss:Name="${sheetName}">
<Table>${rows}</Table>
</Worksheet>`)
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
<Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
<Style ss:ID="header"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/><Interior ss:Color="#D9E2F3" ss:Pattern="Solid"/></Style>
<Style ss:ID="num"><NumberFormat ss:Format="0.00"/></Style>
</Styles>
${worksheets.join('\n')}
</Workbook>`

  return { xml, filename: `fichas-avaliacao-${edital.numero_edital || editalId}.xls` }
}
