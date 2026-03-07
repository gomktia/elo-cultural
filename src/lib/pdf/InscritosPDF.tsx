import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const BRAND_COLOR = '#0047AB'

const styles = StyleSheet.create({
  page: {
    padding: 50,
    paddingBottom: 70,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.5,
    color: '#1a1a1a',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
    borderBottom: `2 solid ${BRAND_COLOR}`,
    paddingBottom: 16,
  },
  headerTenant: {
    fontSize: 13,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#555',
  },
  tableContainer: {
    marginTop: 16,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: BRAND_COLOR,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottom: '0.5 solid #e2e8f0',
  },
  tableRowAlt: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottom: '0.5 solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  colNum: {
    width: '6%',
    textAlign: 'center',
  },
  colProponente: {
    width: '26%',
    paddingHorizontal: 4,
  },
  colProjeto: {
    width: '30%',
    paddingHorizontal: 4,
  },
  colCategoria: {
    width: '18%',
    paddingHorizontal: 4,
  },
  colProtocolo: {
    width: '20%',
    textAlign: 'right',
    paddingHorizontal: 4,
  },
  headerText: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 8,
    color: '#334155',
  },
  cellTextBold: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  cellTextMono: {
    fontSize: 7,
    color: '#64748b',
    fontFamily: 'Courier',
    textTransform: 'uppercase',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTop: '1 solid #eee',
    paddingTop: 8,
    fontSize: 7,
    color: '#999',
  },
  totalBadge: {
    marginTop: 12,
    fontSize: 9,
    color: '#475569',
  },
})

export interface InscritoPDFItem {
  numero: number
  proponente: string
  projeto: string
  categoria: string
  protocolo: string
}

export interface InscritosPDFProps {
  tenantNome: string
  numeroEdital: string
  tituloEdital: string
  inscritos: InscritoPDFItem[]
  geradoEm: string
}

function TableHeaderRow() {
  return React.createElement(
    View,
    { style: styles.tableHeader },
    React.createElement(
      View,
      { style: styles.colNum },
      React.createElement(Text, { style: styles.headerText }, 'No')
    ),
    React.createElement(
      View,
      { style: styles.colProponente },
      React.createElement(Text, { style: styles.headerText }, 'Proponente')
    ),
    React.createElement(
      View,
      { style: styles.colProjeto },
      React.createElement(Text, { style: styles.headerText }, 'Projeto')
    ),
    React.createElement(
      View,
      { style: styles.colCategoria },
      React.createElement(Text, { style: styles.headerText }, 'Categoria')
    ),
    React.createElement(
      View,
      { style: styles.colProtocolo },
      React.createElement(Text, { style: styles.headerText }, 'Protocolo')
    )
  )
}

function TableDataRow({ item, index }: { item: InscritoPDFItem; index: number }) {
  const rowStyle = index % 2 === 1 ? styles.tableRowAlt : styles.tableRow
  return React.createElement(
    View,
    { style: rowStyle } as Record<string, unknown>,
    React.createElement(
      View,
      { style: styles.colNum },
      React.createElement(Text, { style: styles.cellText }, String(item.numero))
    ),
    React.createElement(
      View,
      { style: styles.colProponente },
      React.createElement(Text, { style: styles.cellTextBold }, item.proponente)
    ),
    React.createElement(
      View,
      { style: styles.colProjeto },
      React.createElement(Text, { style: styles.cellText }, item.projeto)
    ),
    React.createElement(
      View,
      { style: styles.colCategoria },
      React.createElement(Text, { style: styles.cellText }, item.categoria)
    ),
    React.createElement(
      View,
      { style: styles.colProtocolo },
      React.createElement(Text, { style: styles.cellTextMono }, item.protocolo)
    )
  )
}

export function InscritosPDF(props: InscritosPDFProps) {
  const { tenantNome, numeroEdital, tituloEdital, inscritos, geradoEm } = props

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'A4', style: styles.page } as Record<string, unknown>,
      // Header
      React.createElement(
        View,
        { style: styles.header } as Record<string, unknown>,
        React.createElement(Text, { style: styles.headerTenant }, tenantNome),
        React.createElement(Text, { style: styles.headerTitle }, 'LISTA DE INSCRITOS'),
        React.createElement(
          Text,
          { style: styles.headerSubtitle },
          `Edital ${numeroEdital} - ${tituloEdital}`
        )
      ),
      // Table
      React.createElement(
        View,
        { style: styles.tableContainer },
        React.createElement(TableHeaderRow, null),
        ...inscritos.map((item, index) =>
          React.createElement(TableDataRow, {
            key: String(index),
            item,
            index,
          })
        )
      ),
      // Total
      React.createElement(
        Text,
        { style: styles.totalBadge },
        `Total de inscritos: ${inscritos.length}`
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true } as Record<string, unknown>,
        React.createElement(
          Text,
          null,
          `Lista de Inscritos - Edital ${numeroEdital} - ${tenantNome}`
        ),
        React.createElement(
          Text,
          { render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
            `Gerado em ${geradoEm} | Pagina ${pageNumber} de ${totalPages}`
          } as Record<string, unknown>,
          null
        )
      )
    )
  )
}
