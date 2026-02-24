import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#666', marginBottom: 16 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 8, borderBottom: '1 solid #ccc', paddingBottom: 4 },
  row: { flexDirection: 'row', borderBottom: '1 solid #eee', paddingVertical: 4 },
  col: { flex: 1 },
  colSmall: { width: 60 },
  bold: { fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#999' },
})

interface RankingItem {
  posicao: number
  titulo: string
  protocolo: string
  nota: number | null
}

interface AtaResultadoProps {
  editalTitulo: string
  editalNumero: string
  tipo: 'preliminar' | 'final'
  ranking: RankingItem[]
  dataPublicacao: string
  tenantNome: string
}

export function gerarAtaResultado({ editalTitulo, editalNumero, tipo, ranking, dataPublicacao, tenantNome }: AtaResultadoProps) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, tenantNome),
        React.createElement(Text, { style: styles.subtitle }, `Ata de Resultado ${tipo === 'preliminar' ? 'Preliminar' : 'Final'}`),
        React.createElement(Text, null, `${editalTitulo} - ${editalNumero}`),
        React.createElement(Text, { style: { marginTop: 8, fontSize: 10, color: '#666' } }, `Data: ${dataPublicacao}`)
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, 'Classificacao'),
        React.createElement(
          View,
          { style: [styles.row, { backgroundColor: '#f5f5f5' }] },
          React.createElement(Text, { style: [styles.colSmall, styles.bold] }, '#'),
          React.createElement(Text, { style: [styles.col, styles.bold] }, 'Projeto'),
          React.createElement(Text, { style: [styles.colSmall, styles.bold] }, 'Nota')
        ),
        ...ranking.map(item =>
          React.createElement(
            View,
            { style: styles.row, key: String(item.posicao) },
            React.createElement(Text, { style: styles.colSmall }, String(item.posicao)),
            React.createElement(Text, { style: styles.col }, `${item.titulo} (${item.protocolo})`),
            React.createElement(Text, { style: styles.colSmall }, item.nota?.toFixed(2) ?? '-')
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Documento gerado eletronicamente - ${tenantNome} - Elo Cultura`)
      )
    )
  )
}
