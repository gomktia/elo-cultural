'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Exportar planilha PNAB Federal (MinC) — Fase 8.1
 * Gera XML SpreadsheetML com 4 abas: Instrumentos, Pessoas Físicas, Organizações, Ações Culturais
 */
export async function exportarPNAB(editalId: string) {
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
    .select('*')
    .eq('id', editalId)
    .single()

  if (!edital) return { error: 'Edital não encontrado' }

  // Load tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('nome, cnpj')
    .eq('id', profile.tenant_id)
    .single()

  // Load projetos with proponente profile
  const { data: projetos } = await supabase
    .from('projetos')
    .select('*, profiles:proponente_id(id, nome, cpf_cnpj, telefone, data_nascimento, endereco_completo, municipio, estado, raca_etnia, genero, orientacao_sexual, renda, escolaridade, pcd, tipo_deficiencia, tipo_pessoa, razao_social, nome_fantasia, representante_nome, representante_cpf)')
    .eq('edital_id', editalId)

  interface PnabProfile {
    id: string
    nome: string
    cpf_cnpj: string | null
    telefone: string | null
    data_nascimento: string | null
    endereco_completo: string | null
    municipio: string | null
    estado: string | null
    raca_etnia: string | null
    genero: string | null
    orientacao_sexual: string | null
    renda: string | null
    escolaridade: string | null
    pcd: boolean
    tipo_deficiencia: string | null
    tipo_pessoa: string | null
    razao_social: string | null
    nome_fantasia: string | null
    representante_nome: string | null
    representante_cpf: string | null
  }

  interface PnabProjeto {
    id: string
    titulo: string
    numero_protocolo: string | null
    status_atual: string
    orcamento_total: number | null
    categoria_id: string | null
    resumo: string | null
    profiles: PnabProfile | null
  }

  const projetosList = (projetos || []) as unknown as PnabProjeto[]

  // Load categorias
  const { data: categorias } = await supabase
    .from('edital_categorias')
    .select('id, nome')
    .eq('edital_id', editalId)

  const catMap = new Map((categorias || []).map(c => [c.id, c.nome]))

  // Separate PF and PJ
  const pessoasFisicas = projetosList.filter(p => p.profiles?.tipo_pessoa !== 'juridica')
  const organizacoes = projetosList.filter(p => p.profiles?.tipo_pessoa === 'juridica')

  // Validation warnings
  const alertas: string[] = []
  for (const p of projetosList) {
    const prof = p.profiles
    if (!prof?.cpf_cnpj) alertas.push(`${p.titulo}: CPF/CNPJ ausente`)
    if (!prof?.data_nascimento && prof?.tipo_pessoa === 'fisica') alertas.push(`${p.titulo}: Data nascimento ausente`)
    if (!prof?.raca_etnia) alertas.push(`${p.titulo}: Raça/Etnia ausente`)
    if (!prof?.genero) alertas.push(`${p.titulo}: Gênero ausente`)
  }

  const esc = (val: unknown) => String(val ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // ── Aba 1: Instrumentos ──
  const abaInstrumentos = `<Worksheet ss:Name="Instrumentos">
<Table>
<Row>
${['CNPJ Ente', 'Título Edital', 'Número', 'Objeto', 'Modalidade', 'Valor Total', 'Inscritos', 'Selecionados', 'Segmentos', 'Cotas', 'Ações Afirmativas'].map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}
</Row>
<Row>
<Cell><Data ss:Type="String">${esc(tenant?.cnpj)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.titulo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.numero_edital)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.descricao)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.tipo_edital || 'fomento')}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${edital.valor_total || 0}</Data></Cell>
<Cell><Data ss:Type="Number">${projetosList.length}</Data></Cell>
<Cell><Data ss:Type="Number">${projetosList.filter(p => p.status_atual === 'selecionado').length}</Data></Cell>
<Cell><Data ss:Type="String">${esc((categorias || []).map(c => c.nome).join(', '))}</Data></Cell>
<Cell><Data ss:Type="String">${esc(JSON.stringify(edital.config_cotas || []))}</Data></Cell>
<Cell><Data ss:Type="String"></Data></Cell>
</Row>
</Table>
</Worksheet>`

  // ── Aba 2: Pessoas Físicas ──
  const pfHeaders = ['CPF', 'Nome', 'Email', 'Telefone', 'Nascimento', 'CEP', 'Cidade', 'UF', 'Situação', 'Raça', 'Sexo', 'Gênero', 'Orientação Sexual', 'Renda', 'Escolaridade', 'PCD', 'Tipo Deficiência', 'Segmento', 'Projeto', 'Valor']
  const abaPF = `<Worksheet ss:Name="Pessoas Fisicas">
<Table>
<Row>${pfHeaders.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${pessoasFisicas.map(p => {
    const prof = (p.profiles || {}) as Partial<PnabProfile>
    return `<Row>
<Cell><Data ss:Type="String">${esc(prof.cpf_cnpj)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.nome)}</Data></Cell>
<Cell><Data ss:Type="String"></Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.telefone)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.data_nascimento)}</Data></Cell>
<Cell><Data ss:Type="String"></Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.municipio)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.estado)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.status_atual)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.raca_etnia)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.genero)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.genero)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.orientacao_sexual)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.renda)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.escolaridade)}</Data></Cell>
<Cell><Data ss:Type="String">${prof.pcd ? 'Sim' : 'Não'}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.tipo_deficiencia)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(catMap.get(p.categoria_id) || '')}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.titulo)}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.orcamento_total || 0}</Data></Cell>
</Row>`
  }).join('\n')}
</Table>
</Worksheet>`

  // ── Aba 3: Organizações ──
  const orgHeaders = ['Tipo', 'CNPJ', 'Razão Social', 'Nome Fantasia', 'CPF Representante', 'Nome Representante', 'Projeto', 'Situação', 'Valor']
  const abaOrg = `<Worksheet ss:Name="Organizacoes">
<Table>
<Row>${orgHeaders.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${organizacoes.map(p => {
    const prof = (p.profiles || {}) as Partial<PnabProfile>
    return `<Row>
<Cell><Data ss:Type="String">Pessoa Jurídica</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.cpf_cnpj)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.razao_social)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.nome_fantasia)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.representante_cpf)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.representante_nome)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.titulo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.status_atual)}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.orcamento_total || 0}</Data></Cell>
</Row>`
  }).join('\n')}
</Table>
</Worksheet>`

  // ── Aba 4: Ações Culturais ──
  const acHeaders = ['Identificador', 'CPF/CNPJ', 'Edital', 'Valor', 'Modalidade', 'Resumo', 'Segmento', 'Status']
  const abaAC = `<Worksheet ss:Name="Acoes Culturais">
<Table>
<Row>${acHeaders.map(h => `<Cell ss:StyleID="header"><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${projetosList.map(p => {
    const prof = (p.profiles || {}) as Partial<PnabProfile>
    return `<Row>
<Cell><Data ss:Type="String">${esc(p.numero_protocolo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(prof.cpf_cnpj)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.numero_edital)}</Data></Cell>
<Cell ss:StyleID="num"><Data ss:Type="Number">${p.orcamento_total || 0}</Data></Cell>
<Cell><Data ss:Type="String">${esc(edital.tipo_edital || 'fomento')}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.resumo)}</Data></Cell>
<Cell><Data ss:Type="String">${esc(catMap.get(p.categoria_id) || '')}</Data></Cell>
<Cell><Data ss:Type="String">${esc(p.status_atual)}</Data></Cell>
</Row>`
  }).join('\n')}
</Table>
</Worksheet>`

  // ── Montar planilha completa ──
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Styles>
 <Style ss:ID="header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#0047AB" ss:Pattern="Solid"/></Style>
 <Style ss:ID="num"><NumberFormat ss:Format="#,##0.00"/></Style>
</Styles>
${abaInstrumentos}
${abaPF}
${abaOrg}
${abaAC}
</Workbook>`

  return {
    success: true,
    xml,
    filename: `PNAB-${edital.numero_edital}-${new Date().toISOString().slice(0, 10)}.xls`,
    alertas,
  }
}
