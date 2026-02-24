import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { textAlign: 'center', marginBottom: 30 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#666' },
  body: { marginBottom: 20, lineHeight: 1.6 },
  signature: { marginTop: 60, textAlign: 'center' },
  line: { borderBottom: '1 solid #333', width: 200, marginHorizontal: 'auto', marginBottom: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#999' },
})

interface GerarHomologacaoProps {
  editalTitulo: string
  editalNumero: string
  tenantNome: string
  dataHomologacao: string
  responsavel: string
}

export function gerarHomologacao({ editalTitulo, editalNumero, tenantNome, dataHomologacao, responsavel }: GerarHomologacaoProps) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'TERMO DE HOMOLOGACAO'),
        React.createElement(Text, { style: styles.subtitle }, tenantNome)
      ),
      React.createElement(
        View,
        { style: styles.body },
        React.createElement(
          Text,
          null,
          `O(A) responsavel abaixo identificado(a), no uso de suas atribuicoes legais, HOMOLOGA o resultado final do processo seletivo ${editalNumero} - "${editalTitulo}", declarando encerrados os trabalhos da comissao de selecao e tornando definitivo o resultado publicado.`
        ),
        React.createElement(Text, { style: { marginTop: 16 } }, `Data: ${dataHomologacao}`)
      ),
      React.createElement(
        View,
        { style: styles.signature },
        React.createElement(View, { style: styles.line }),
        React.createElement(Text, null, responsavel),
        React.createElement(Text, { style: { fontSize: 10, color: '#666' } }, 'Responsavel pela homologacao')
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Documento gerado eletronicamente - ${tenantNome} - Elo Cultura`)
      )
    )
  )
}
