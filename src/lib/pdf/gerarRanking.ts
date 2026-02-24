import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11 },
  header: { textAlign: 'center', marginBottom: 20 },
  title: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', borderBottom: '1 solid #eee', paddingVertical: 4 },
  col: { flex: 1 },
  colSmall: { width: 60 },
  bold: { fontWeight: 'bold' },
  headerRow: { flexDirection: 'row', borderBottom: '2 solid #333', paddingBottom: 4, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 9, color: '#999' },
})

interface RankingItem {
  posicao: number
  titulo: string
  protocolo: string
  nota: number | null
  avaliacoes: number
}

interface GerarRankingProps {
  editalTitulo: string
  editalNumero: string
  ranking: RankingItem[]
  tenantNome: string
}

export function gerarRanking({ editalTitulo, editalNumero, ranking, tenantNome }: GerarRankingProps) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, `Ranking Consolidado`),
        React.createElement(Text, null, `${editalTitulo} - ${editalNumero}`)
      ),
      React.createElement(
        View,
        { style: styles.headerRow },
        React.createElement(Text, { style: [styles.colSmall, styles.bold] }, '#'),
        React.createElement(Text, { style: [styles.col, styles.bold] }, 'Projeto'),
        React.createElement(Text, { style: [styles.colSmall, styles.bold] }, 'Nota'),
        React.createElement(Text, { style: [styles.colSmall, styles.bold] }, 'Aval.')
      ),
      ...ranking.map(item =>
        React.createElement(
          View,
          { style: styles.row, key: String(item.posicao) },
          React.createElement(Text, { style: styles.colSmall }, String(item.posicao)),
          React.createElement(Text, { style: styles.col }, `${item.titulo} (${item.protocolo})`),
          React.createElement(Text, { style: styles.colSmall }, item.nota?.toFixed(2) ?? '-'),
          React.createElement(Text, { style: styles.colSmall }, String(item.avaliacoes))
        )
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `${tenantNome} - Elo Cultura`)
      )
    )
  )
}
