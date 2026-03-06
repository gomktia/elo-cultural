import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  header: { textAlign: 'center', marginBottom: 24, borderBottom: '2 solid #333', paddingBottom: 16 },
  tenantName: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  docTitle: { fontSize: 16, fontWeight: 'bold', letterSpacing: 2, marginTop: 8 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingVertical: 8, borderBottom: '1 solid #ddd' },
  metaLabel: { fontSize: 9, color: '#666', marginBottom: 2 },
  metaValue: { fontSize: 11, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginTop: 20, marginBottom: 8, borderBottom: '1 solid #ccc', paddingBottom: 4, textTransform: 'uppercase' },
  paragraph: { fontSize: 11, marginBottom: 8, textAlign: 'justify' },
  dispositivo: { marginTop: 16, padding: 12, backgroundColor: '#f5f5f5', borderLeft: '3 solid #333' },
  dispositivoText: { fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  signatureBlock: { marginTop: 40, alignItems: 'center' },
  signatureLine: { width: 250, borderBottom: '1 solid #333', marginBottom: 4, marginTop: 40 },
  signatureRole: { fontSize: 9, color: '#666', marginTop: 2 },
  signatureName: { fontSize: 10, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#999' },
})

interface DecisaoPDFProps {
  tenantNome: string
  recursoProtocolo: string
  proponenteNome: string
  projetoTitulo: string
  projetoProtocolo: string
  tipoRecurso: string
  fundamentacao: string
  decisaoTexto: string
  status: string
  decisorNome: string
  dataDecisao: string
}

export function DecisaoPDF({
  tenantNome,
  recursoProtocolo,
  proponenteNome,
  projetoTitulo,
  projetoProtocolo,
  tipoRecurso,
  fundamentacao,
  decisaoTexto,
  status,
  decisorNome,
  dataDecisao,
}: DecisaoPDFProps) {
  const statusLabel = status === 'deferido' ? 'DEFERIDO' :
    status === 'deferido_parcial' ? 'DEFERIDO PARCIALMENTE' : 'INDEFERIDO'

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
        React.createElement(Text, { style: styles.docTitle }, 'DECISAO ADMINISTRATIVA')
      ),

      // Meta info
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.metaLabel }, 'Protocolo do Recurso'),
          React.createElement(Text, { style: styles.metaValue }, recursoProtocolo)
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.metaLabel }, 'Protocolo do Projeto'),
          React.createElement(Text, { style: styles.metaValue }, projetoProtocolo)
        ),
        React.createElement(
          View,
          null,
          React.createElement(Text, { style: styles.metaLabel }, 'Tipo'),
          React.createElement(Text, { style: styles.metaValue }, tipoRecurso === 'habilitacao' ? 'Habilitacao' : 'Avaliacao')
        )
      ),

      // Proponente / Projeto
      React.createElement(
        View,
        { style: { marginBottom: 8 } },
        React.createElement(Text, { style: styles.metaLabel }, 'Proponente'),
        React.createElement(Text, { style: styles.metaValue }, proponenteNome)
      ),
      React.createElement(
        View,
        { style: { marginBottom: 16 } },
        React.createElement(Text, { style: styles.metaLabel }, 'Projeto'),
        React.createElement(Text, { style: styles.metaValue }, projetoTitulo)
      ),

      // Fundamentacao
      React.createElement(Text, { style: styles.sectionTitle }, 'Fundamentacao'),
      React.createElement(Text, { style: styles.paragraph }, fundamentacao),

      // Analise do Merito
      React.createElement(Text, { style: styles.sectionTitle }, 'Analise do Merito'),
      React.createElement(Text, { style: styles.paragraph }, decisaoTexto),

      // Conclusao
      React.createElement(Text, { style: styles.sectionTitle }, 'Conclusao'),
      React.createElement(
        Text,
        { style: styles.paragraph },
        `Diante da analise realizada e considerando os elementos constantes nos autos, conclui-se pelo ${statusLabel.toLowerCase()} do presente recurso.`
      ),

      // Dispositivo
      React.createElement(Text, { style: styles.sectionTitle }, 'Dispositivo'),
      React.createElement(
        View,
        { style: styles.dispositivo },
        React.createElement(Text, { style: styles.dispositivoText }, statusLabel)
      ),

      // Signature block
      React.createElement(
        View,
        { style: styles.signatureBlock },
        React.createElement(View, { style: styles.signatureLine }),
        React.createElement(Text, { style: styles.signatureName }, decisorNome),
        React.createElement(Text, { style: styles.signatureRole }, 'Assessor / Coordenador / Secretario'),
        React.createElement(Text, { style: { fontSize: 9, color: '#666', marginTop: 8 } }, dataDecisao)
      ),

      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(Text, null, `Documento gerado eletronicamente - ${tenantNome}`)
      )
    )
  )
}
