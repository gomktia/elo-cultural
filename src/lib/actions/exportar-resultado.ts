'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Exportar planilha Resultado/Classificação — Fase 8.4
 * Gera XML SpreadsheetML com 1 aba: Resultado
 * Colunas: Classificação, Proponente, Projeto, Categoria, Cota, Parecerista 1/2/3, Média Final, Status, Habilitação
 */
export async function exportarResultado(editalId: string) {
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

  // Load projetos with proponente profile
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, proponente_id, categoria_id, nota_final, status_atual, classificacao_tipo, status_habilitacao, profiles:proponente_id(id, nome)')
    .eq('edital_id', editalId)
    .order('nota_final', { ascending: false, nullsFirst: false })

  interface ResultadoProjeto {
    id: string
    titulo: string
    proponente_id: string
    categoria_id: string | null
    nota_final: number | null
    status_atual: string
    classificacao_tipo: string | null
    status_habilitacao: string | null
    profiles: unknown
  }

  const projetosList = (projetos || []) as unknown as ResultadoProjeto[]

  // Load categorias
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome')
    .eq('edital_id', editalId)

  const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

  // Load all finalized avaliacoes for this edital's projects
  const projetoIds = projetosList.map(p => p.id)

  interface ResultadoAvaliacao {
    id: string
    projeto_id: string
    avaliador_id: string
    pontuacao_total: number | null
    profiles: unknown
  }

  let avaliacoes: ResultadoAvaliacao[] = []

  if (projetoIds.length > 0) {
    const { data: avData } = await supabase
      .from('avaliacoes')
      .select('id, projeto_id, avaliador_id, pontuacao_total, profiles:avaliador_id(nome)')
      .in('projeto_id', projetoIds)
      .eq('status', 'finalizada')
      .eq('active', true)

    avaliacoes = (avData || []) as unknown as ResultadoAvaliacao[]
  }

  // Group avaliacoes by projeto_id
  const avalByProjeto = new Map<string, ResultadoAvaliacao[]>()
  for (const av of avaliacoes) {
    const list = avalByProjeto.get(av.projeto_id) || []
    list.push(av)
    avalByProjeto.set(av.projeto_id, list)
  }

  // Sort projetos by nota_final DESC (nulls last)
  projetosList.sort((a, b) => {
    const na = a.nota_final ?? -1
    const nb = b.nota_final ?? -1
    return nb - na
  })

  // Classificação tipo labels
  const classificacaoLabel = (tipo: string | null): string => {
    const labels: Record<string, string> = {
      ampla_concorrencia: 'Ampla Concorrência',
      cota_pessoa_negra: 'Cota Pessoa Negra',
      cota_pessoa_indigena: 'Cota Pessoa Indígena',
      cota_pessoa_pcd: 'Cota PcD',
      cota_areas_perifericas: 'Cota Áreas Periféricas',
      remanejamento: 'Remanejamento',
    }
    return labels[tipo || ''] || ''
  }

  const habilitacaoLabel = (status: string | null): string => {
    const labels: Record<string, string> = {
      pendente: 'Pendente',
      em_analise: 'Em Análise',
      habilitado: 'Habilitado',
      inabilitado: 'Inabilitado',
    }
    return labels[status || ''] || status || ''
  }

  const statusLabel = (status: string | null): string => {
    const labels: Record<string, string> = {
      inscrito: 'Inscrito',
      em_analise: 'Em Análise',
      classificado: 'Classificado',
      selecionado: 'Selecionado',
      suplente: 'Suplente',
      desclassificado: 'Desclassificado',
      contratado: 'Contratado',
      concluido: 'Concluído',
    }
    return labels[status || ''] || status || ''
  }

  const esc = (val: unknown) => String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Build data rows
  const headers = [
    'Classificação', 'Proponente', 'Projeto', 'Categoria', 'Cota',
    'Parecerista 1', 'Parecerista 2', 'Parecerista 3',
    'Média Final', 'Status', 'Habilitação',
  ]

  const dataRows = projetosList.map((p, idx: number) => {
    const prof = (p.profiles as unknown as { nome: string } | null) || { nome: '' }
    const projetoAvals = avalByProjeto.get(p.id) || []

    // Get up to 3 pareceristas with their scores
    const parecerista1 = projetoAvals[0]
    const parecerista2 = projetoAvals[1]
    const parecerista3 = projetoAvals[2]

    const pareceristaCellValue = (av: ResultadoAvaliacao | undefined) => {
      if (!av) return ''
      const nome = (av.profiles as unknown as { nome: string } | null)?.nome || 'Avaliador'
      const nota = av.pontuacao_total != null ? Number(av.pontuacao_total).toFixed(2) : '-'
      return `${nome} (${nota})`
    }

    return `<Row>
<Cell><Data ss:Type="Number">${idx + 1}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.nome)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.titulo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(catMap.get(p.categoria_id) || '')}</Data></Cell>
<Cell><Data ss:Type="String">${esc(classificacaoLabel(p.classificacao_tipo))}</Data></Cell>
<Cell><Data ss:Type="String">${esc(pareceristaCellValue(parecerista1))}</Data></Cell>
<Cell><Data ss:Type="String">${esc(pareceristaCellValue(parecerista2))}</Data></Cell>
<Cell><Data ss:Type="String">${esc(pareceristaCellValue(parecerista3))}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.nota_final != null ? Number(p.nota_final) : 0}</Data></Cell>
<Cell><Data ss:Type="String">${esc(statusLabel(p.status_atual))}</Data></Cell>
<Cell><Data ss:Type="String">${esc(habilitacaoLabel(p.status_habilitacao))}</Data></Cell>
</Row>`
  })

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0047AB" ss:Pattern="Solid"/></Style>
 <Style ss:ID="title"><Font ss:Bold="1" ss:Size="14"/></Style>
 <Style ss:ID="num"><NumberFormat ss:Format="#,##0.00"/></Style>
</Styles>
<Worksheet ss:Name="Resultado">
<Table>
<Row ss:StyleID="title">
<Cell ss:MergeAcross="10"><Data ss:Type="String">${esc(edital.titulo)} — Resultado / Classificação</Data></Cell>
</Row>
<Row></Row>
<Row>
${headers.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('\n')}
</Row>
${dataRows.join('\n')}
</Table>
</Worksheet>
</Workbook>`

  return {
    success: true,
    xml,
    filename: `Resultado-${edital.numero_edital || editalId}-${new Date().toISOString().slice(0, 10)}.xls`,
  }
}
