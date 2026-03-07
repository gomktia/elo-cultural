import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  header: { textAlign: 'center', marginBottom: 24, borderBottom: '2 solid #333', paddingBottom: 16 },
  tenantName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  docTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginTop: 8 },
  preambulo: { fontSize: 11, marginBottom: 16, textAlign: 'justify' },
  resolve: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginVertical: 16 },
  artigo: { fontSize: 11, marginBottom: 12, textAlign: 'justify' },
  artigoLabel: { fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#eee', borderBottom: '1 solid #333', paddingVertical: 6, paddingHorizontal: 4 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #ddd', paddingVertical: 5, paddingHorizontal: 4 },
  colNome: { flex: 3 },
  colCpf: { flex: 2 },
  colQual: { flex: 3 },
  colTipo: { flex: 2 },
  cellHeader: { fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase', color: '#333' },
  cell: { fontSize: 10 },
  signatureBlock: { marginTop: 50, alignItems: 'center' },
  signatureLine: { width: 250, borderBottom: '1 solid #333', marginBottom: 4, marginTop: 40 },
  signatureRole: { fontSize: 9, color: '#666', marginTop: 2 },
  signatureName: { fontSize: 10, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#999' },
})

const TIPO_LABELS: Record<string, string> = {
  sociedade_civil: 'Sociedade Civil',
  poder_executivo: 'Poder Executivo',
  suplente: 'Suplente',
}

interface MembroComissao {
  nome: string
  cpf: string | null
  qualificacao: string | null
  tipo: string
}

interface PortariaComissaoPDFProps {
  tenantNome: string
  editalTitulo: string
  editalNumero: string
  portariaNumero: string
  membros: MembroComissao[]
  dataPublicacao: string
}

export function PortariaComissaoPDF({
  tenantNome,
  editalTitulo,
  editalNumero,
  portariaNumero,
  membros,
  dataPublicacao,
}: PortariaComissaoPDFProps) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.tenantName }, tenantNome),
        React.createElement(Text, { style: styles.docTitle }, `PORTARIA N. ${portariaNumero}`)
      ),

      // Preambulo
      React.createElement(
        Text,
        { style: styles.preambulo },
        `O(A) Secretário(a) Municipal de Cultura, no uso de suas atribuições legais, e considerando a necessidade de constituir Comissão de Avaliação para o ${editalTitulo} (${editalNumero}),`
      ),

      // RESOLVE
      React.createElement(Text, { style: styles.resolve }, 'RESOLVE:'),

      // Art. 1
      React.createElement(
        Text,
        { style: styles.artigo },
        React.createElement(Text, { style: styles.artigoLabel }, 'Art. 1. '),
        React.createElement(Text, null, `Designar os seguintes membros para compor a Comissão de Avaliação do Edital ${editalNumero}:`)
      ),

      // Table header
      React.createElement(
        View,
        { style: styles.tableHeader },
        React.createElement(Text, { style: [styles.colNome, styles.cellHeader] }, 'Nome'),
        React.createElement(Text, { style: [styles.colCpf, styles.cellHeader] }, 'CPF'),
        React.createElement(Text, { style: [styles.colQual, styles.cellHeader] }, 'Qualificação'),
        React.createElement(Text, { style: [styles.colTipo, styles.cellHeader] }, 'Tipo')
      ),

      // Table rows
      ...membros.map((m, i) =>
        React.createElement(
          View,
          { style: styles.tableRow, key: String(i) },
          React.createElement(Text, { style: [styles.colNome, styles.cell] }, m.nome),
          React.createElement(Text, { style: [styles.colCpf, styles.cell] }, m.cpf || '-'),
          React.createElement(Text, { style: [styles.colQual, styles.cell] }, m.qualificacao || '-'),
          React.createElement(Text, { style: [styles.colTipo, styles.cell] }, TIPO_LABELS[m.tipo] || m.tipo)
        )
      ),

      // Art. 2
      React.createElement(
        Text,
        { style: [styles.artigo, { marginTop: 20 }] },
        React.createElement(Text, { style: styles.artigoLabel }, 'Art. 2. '),
        React.createElement(Text, null, 'A Comissão terá a atribuição de avaliar os projetos inscritos conforme critérios estabelecidos no edital referido no Art. 1.')
      ),

      // Art. 3
      React.createElement(
        Text,
        { style: styles.artigo },
        React.createElement(Text, { style: styles.artigoLabel }, 'Art. 3. '),
        React.createElement(Text, null, 'Esta Portaria entra em vigor na data de sua publicação.')
      ),

      // Signature block
      React.createElement(
        View,
        { style: styles.signatureBlock },
        React.createElement(Text, { style: { fontSize: 10, color: '#666', marginBottom: 4 } }, dataPublicacao),
        React.createElement(View, { style: styles.signatureLine }),
        React.createElement(Text, { style: styles.signatureName }, 'Secretário(a) Municipal de Cultura'),
        React.createElement(Text, { style: styles.signatureRole }, tenantNome)
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Documento gerado eletronicamente — ${tenantNome}`)
      )
    )
  )
}
