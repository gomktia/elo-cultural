import React from 'react'
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

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
    borderBottom: '2 solid #0047AB',
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
  preambulo: {
    marginBottom: 20,
    textAlign: 'justify',
  },
  clausulaContainer: {
    marginBottom: 12,
  },
  clausulaTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  clausulaText: {
    fontSize: 10,
    textAlign: 'justify',
  },
  alteracaoBox: {
    marginTop: 6,
    marginBottom: 6,
    padding: 8,
    backgroundColor: '#f5f8ff',
    borderLeft: '3 solid #0047AB',
  },
  alteracaoLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0047AB',
    marginBottom: 2,
  },
  alteracaoValue: {
    fontSize: 10,
  },
  signatureSection: {
    marginTop: 40,
  },
  signatureDate: {
    textAlign: 'center',
    marginBottom: 30,
    fontSize: 10,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  signatureBlock: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderBottom: '1 solid #333',
    marginBottom: 4,
    height: 40,
  },
  signatureName: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureRole: {
    fontSize: 9,
    color: '#555',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999',
    borderTop: '1 solid #eee',
    paddingTop: 8,
  },
})

export interface AditivoPDFProps {
  tenantNome: string
  numeroAditivo: number
  numeroTermo: string
  proponenteNome: string
  proponenteCpf: string | null
  projetoTitulo: string
  tipo: string
  descricaoAlteracao: string
  justificativa: string
  valorAnterior: number | null
  valorNovo: number | null
  dataInicioAnterior: string | null
  dataFimAnterior: string | null
  dataInicioNovo: string | null
  dataFimNovo: string | null
  representanteNome: string | null
  representanteCargo: string | null
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '___/___/______'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function tipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    prorrogacao: 'Prorrogacao de Prazo',
    alteracao_valor: 'Alteracao de Valor',
    alteracao_objeto: 'Alteracao do Objeto',
    alteracao_equipe: 'Alteracao de Equipe',
    outro: 'Outras Alteracoes',
  }
  return labels[tipo] || tipo
}

function ordinalLabel(n: number): string {
  const ordinals: Record<number, string> = {
    1: 'PRIMEIRO',
    2: 'SEGUNDO',
    3: 'TERCEIRO',
    4: 'QUARTO',
    5: 'QUINTO',
    6: 'SEXTO',
    7: 'SETIMO',
    8: 'OITAVO',
    9: 'NONO',
    10: 'DECIMO',
  }
  return ordinals[n] || `${n}o`
}

function Clausula({ numero, titulo, texto, children }: { numero: number; titulo: string; texto: string; children?: React.ReactNode }) {
  return React.createElement(
    View,
    { style: styles.clausulaContainer },
    React.createElement(
      Text,
      { style: styles.clausulaTitle },
      `Clausula ${numero}a - ${titulo}`
    ),
    React.createElement(Text, { style: styles.clausulaText }, texto),
    children || null
  )
}

function AlteracaoBox({ label, valor }: { label: string; valor: string }) {
  return React.createElement(
    View,
    { style: styles.alteracaoBox },
    React.createElement(Text, { style: styles.alteracaoLabel }, label),
    React.createElement(Text, { style: styles.alteracaoValue }, valor)
  )
}

export function AditivoPDF(props: AditivoPDFProps) {
  const {
    tenantNome,
    numeroAditivo,
    numeroTermo,
    proponenteNome,
    proponenteCpf,
    projetoTitulo,
    tipo,
    descricaoAlteracao,
    justificativa,
    valorAnterior,
    valorNovo,
    dataFimAnterior,
    dataFimNovo,
    representanteNome,
    representanteCargo,
  } = props

  const ordinal = ordinalLabel(numeroAditivo)

  // Build alteracoes content based on tipo
  const alteracaoChildren: React.ReactNode[] = []
  if (tipo === 'alteracao_valor' && valorAnterior != null && valorNovo != null) {
    alteracaoChildren.push(
      React.createElement(AlteracaoBox, {
        key: 'val-ant',
        label: 'VALOR ANTERIOR:',
        valor: formatCurrency(valorAnterior),
      }),
      React.createElement(AlteracaoBox, {
        key: 'val-novo',
        label: 'NOVO VALOR:',
        valor: formatCurrency(valorNovo),
      })
    )
  }
  if ((tipo === 'prorrogacao' || tipo === 'alteracao_valor') && (dataFimAnterior || dataFimNovo)) {
    if (dataFimAnterior) {
      alteracaoChildren.push(
        React.createElement(AlteracaoBox, {
          key: 'data-ant',
          label: 'DATA FIM ANTERIOR:',
          valor: formatDate(dataFimAnterior),
        })
      )
    }
    if (dataFimNovo) {
      alteracaoChildren.push(
        React.createElement(AlteracaoBox, {
          key: 'data-novo',
          label: 'NOVA DATA FIM:',
          valor: formatDate(dataFimNovo),
        })
      )
    }
  }
  if (tipo === 'alteracao_objeto' || tipo === 'alteracao_equipe' || tipo === 'outro') {
    alteracaoChildren.push(
      React.createElement(AlteracaoBox, {
        key: 'desc',
        label: 'DESCRICAO DA ALTERACAO:',
        valor: descricaoAlteracao,
      })
    )
  }

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
        React.createElement(Text, { style: styles.headerTenant }, tenantNome),
        React.createElement(
          Text,
          { style: styles.headerTitle },
          `${ordinal} TERMO ADITIVO`
        ),
        React.createElement(
          Text,
          { style: styles.headerSubtitle },
          `ao TERMO DE EXECUCAO CULTURAL No ${numeroTermo}`
        )
      ),
      // Preambulo
      React.createElement(
        View,
        { style: styles.preambulo },
        React.createElement(
          Text,
          { style: styles.clausulaText },
          `${tenantNome.toUpperCase()}, neste ato representad${representanteCargo ? 'o(a)' : 'o(a)'} por ${representanteNome || '_______________'}${representanteCargo ? `, ${representanteCargo}` : ''}, doravante denominado ENTE FEDERATIVO, e ${proponenteNome}, inscrit${proponenteCpf ? 'o(a)' : 'o(a)'} no CPF sob o no ${proponenteCpf || '_______________'}, doravante denominado AGENTE CULTURAL, resolvem celebrar o presente Termo Aditivo ao Termo de Execucao Cultural No ${numeroTermo}, referente ao projeto "${projetoTitulo}", com fundamento na Lei no 14.903/2024 (Politica Nacional Aldir Blanc de Fomento a Cultura) e no Decreto no 11.453/2023, mediante as clausulas e condicoes a seguir:`
        )
      ),
      // Clausula 1: Objeto do Aditivo
      React.createElement(Clausula, {
        numero: 1,
        titulo: 'Objeto do Aditivo',
        texto: `O presente Termo Aditivo tem por objeto a ${tipoLabel(tipo).toLowerCase()} do Termo de Execucao Cultural No ${numeroTermo}, firmado entre as partes acima qualificadas.`,
      }),
      // Clausula 2: Justificativa
      React.createElement(Clausula, {
        numero: 2,
        titulo: 'Justificativa',
        texto: justificativa,
      }),
      // Clausula 3: Alteracoes
      React.createElement(
        Clausula,
        {
          numero: 3,
          titulo: 'Alteracoes',
          texto: `Em razao do disposto na Clausula 1a, ficam alteradas as condicoes do Termo de Execucao Cultural conforme abaixo:`,
        },
        ...alteracaoChildren
      ),
      // Clausula 4: Ratificacao
      React.createElement(Clausula, {
        numero: 4,
        titulo: 'Ratificacao',
        texto: 'Ficam ratificadas todas as demais clausulas e condicoes do Termo de Execucao Cultural que nao foram expressamente alteradas por este Termo Aditivo.',
      }),
      // Clausula 5: Vigencia do Aditivo
      React.createElement(Clausula, {
        numero: 5,
        titulo: 'Vigencia do Aditivo',
        texto: 'O presente Termo Aditivo entra em vigor na data de sua assinatura por ambas as partes.',
      }),
      // Signature section
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(
          Text,
          { style: styles.signatureDate },
          `${formatDate(new Date().toISOString())}.`
        ),
        React.createElement(
          View,
          { style: styles.signatureRow },
          // Ente Federativo
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(
              Text,
              { style: styles.signatureName },
              representanteNome || 'Representante do Ente Federativo'
            ),
            React.createElement(Text, { style: styles.signatureRole }, 'ENTE FEDERATIVO')
          ),
          // Agente Cultural
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, proponenteNome),
            React.createElement(Text, { style: styles.signatureRole }, 'AGENTE CULTURAL')
          )
        )
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          `${ordinal} Termo Aditivo ao Termo de Execucao Cultural No ${numeroTermo} - Gerado eletronicamente - ${tenantNome}`
        )
      )
    )
  )
}
