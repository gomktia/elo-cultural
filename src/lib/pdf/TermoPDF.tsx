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
  signatureSeal: {
    marginTop: 6,
    padding: 6,
    backgroundColor: '#f0f7ff',
    borderRadius: 3,
    fontSize: 7,
    color: '#0047AB',
    textAlign: 'left',
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

export interface AssinaturaData {
  nome_signatario: string
  papel_signatario: string
  ip_address: string
  hash_documento: string
  assinado_em: string
}

export interface TermoPDFProps {
  tenantNome: string
  numeroTermo: string
  numeroEdital: string
  proponenteNome: string
  proponenteCpf: string | null
  proponenteRg: string | null
  proponenteEndereco: string | null
  proponenteMunicipio: string | null
  proponenteEstado: string | null
  projetoTitulo: string
  editalReferencia: string | null
  valorTotal: number
  valorExtenso: string | null
  vigenciaInicio: string | null
  vigenciaFim: string | null
  vigenciaMeses: number
  banco: string | null
  agencia: string | null
  contaCorrente: string | null
  tipoConta: string
  representanteNome: string | null
  representanteCargo: string | null
  assinaturas: AssinaturaData[]
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '___/___/______'
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function Clausula({ numero, titulo, texto }: { numero: number; titulo: string; texto: string }) {
  return React.createElement(
    View,
    { style: styles.clausulaContainer },
    React.createElement(
      Text,
      { style: styles.clausulaTitle },
      `Clausula ${numero}a - ${titulo}`
    ),
    React.createElement(Text, { style: styles.clausulaText }, texto)
  )
}

export function TermoPDF(props: TermoPDFProps) {
  const {
    tenantNome,
    numeroTermo,
    numeroEdital,
    proponenteNome,
    proponenteCpf,
    proponenteRg,
    proponenteEndereco,
    proponenteMunicipio,
    proponenteEstado,
    projetoTitulo,
    editalReferencia,
    valorTotal,
    valorExtenso,
    vigenciaInicio,
    vigenciaFim,
    vigenciaMeses,
    banco,
    agencia,
    contaCorrente,
    tipoConta,
    representanteNome,
    representanteCargo,
    assinaturas,
  } = props

  const enderecoCompleto = [proponenteEndereco, proponenteMunicipio, proponenteEstado]
    .filter(Boolean)
    .join(', ')

  const localidade = proponenteMunicipio || '_______________'

  const clausulas = [
    {
      titulo: 'Objeto',
      texto: `O presente Termo tem por objeto a execucao do projeto "${projetoTitulo}", selecionado pelo Edital ${editalReferencia || numeroEdital}, nos termos do art. 21 do Decreto no 11.453/2023.`,
    },
    {
      titulo: 'Valor',
      texto: `O ENTE FEDERATIVO repassara ao AGENTE CULTURAL o valor de ${formatCurrency(valorTotal)}${valorExtenso ? ` (${valorExtenso})` : ''}, em parcela unica/conforme cronograma de desembolso.`,
    },
    {
      titulo: 'Prazo de Execucao',
      texto: `O prazo de execucao sera de ${vigenciaMeses} meses, com inicio em ${formatDate(vigenciaInicio)} e termino em ${formatDate(vigenciaFim)}.`,
    },
    {
      titulo: 'Conta Bancaria',
      texto: `Os recursos serao depositados na conta ${tipoConta === 'poupanca' ? 'poupanca' : 'corrente'} no ${contaCorrente || '_______________'}, agencia ${agencia || '_______________'}, banco ${banco || '_______________'}.`,
    },
    {
      titulo: 'Prestacao de Contas',
      texto: 'O AGENTE CULTURAL devera apresentar prestacao de contas simplificada no prazo de 30 dias apos o termino da vigencia, mediante Relatorio de Execucao do Objeto.',
    },
    {
      titulo: 'Alteracoes',
      texto: 'Alteracoes ate 20% do valor podem ser realizadas pelo AGENTE CULTURAL mediante comunicacao previa. Alteracoes superiores a 20% dependem de aprovacao do ENTE FEDERATIVO, mediante Termo Aditivo.',
    },
    {
      titulo: 'Devolucao de Recursos',
      texto: 'O saldo remanescente nao utilizado devera ser devolvido ao ENTE FEDERATIVO no prazo de 30 dias apos o encerramento da vigencia.',
    },
    {
      titulo: 'Rescisao',
      texto: 'O presente Termo podera ser rescindido por acordo entre as partes ou descumprimento de clausulas.',
    },
    {
      titulo: 'Publicidade',
      texto: 'O AGENTE CULTURAL devera incluir a logomarca do ENTE FEDERATIVO em todo material de divulgacao.',
    },
    {
      titulo: 'Acessibilidade',
      texto: 'O AGENTE CULTURAL devera implementar medidas de acessibilidade conforme declarado no projeto.',
    },
    {
      titulo: 'Contrapartida',
      texto: 'O AGENTE CULTURAL devera executar a contrapartida social conforme descrito no projeto.',
    },
    {
      titulo: 'Penalidades',
      texto: 'O descumprimento podera resultar em: advertencia, suspensao de 180 a 540 dias, devolucao de recursos.',
    },
    {
      titulo: 'Foro',
      texto: `Fica eleito o Foro da Comarca de ${localidade} para dirimir questoes.`,
    },
    {
      titulo: 'Disposicoes Finais',
      texto: 'O presente instrumento passa a vigorar na data de assinatura por ambas as partes.',
    },
  ]

  const assinaturaGestor = assinaturas.find((a) => a.papel_signatario === 'gestor' || a.papel_signatario === 'secretario')
  const assinaturaProponente = assinaturas.find((a) => a.papel_signatario === 'proponente')

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
          `TERMO DE EXECUCAO CULTURAL No ${numeroTermo}`
        ),
        React.createElement(
          Text,
          { style: styles.headerSubtitle },
          `Processo Administrativo: ${numeroEdital}`
        )
      ),
      // Preambulo
      React.createElement(
        View,
        { style: styles.preambulo },
        React.createElement(
          Text,
          { style: styles.clausulaText },
          `${tenantNome.toUpperCase()}, neste ato representad${representanteCargo ? 'o(a)' : 'o(a)'} por ${representanteNome || '_______________'}${representanteCargo ? `, ${representanteCargo}` : ''}, doravante denominado ENTE FEDERATIVO, e ${proponenteNome}, inscrit${proponenteCpf ? 'o(a)' : 'o(a)'} no CPF sob o no ${proponenteCpf || '_______________'}${proponenteRg ? `, RG no ${proponenteRg}` : ''}${enderecoCompleto ? `, residente em ${enderecoCompleto}` : ''}, doravante denominado AGENTE CULTURAL, resolvem celebrar o presente Termo de Execucao Cultural, com fundamento na Lei no 14.903/2024 (Politica Nacional Aldir Blanc de Fomento a Cultura) e no Decreto no 11.453/2023 (Decreto de Fomento), mediante as clausulas e condicoes a seguir:`
        )
      ),
      // Clausulas
      ...clausulas.map((c, i) =>
        React.createElement(Clausula, {
          key: String(i),
          numero: i + 1,
          titulo: c.titulo,
          texto: c.texto,
        })
      ),
      // Footer
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          `Termo de Execucao Cultural No ${numeroTermo} - Gerado eletronicamente - ${tenantNome}`
        )
      )
    ),
    // Page 2: Signatures
    React.createElement(
      Page,
      { size: 'A4', style: styles.page },
      React.createElement(
        View,
        { style: styles.signatureSection },
        React.createElement(
          Text,
          { style: styles.signatureDate },
          `${localidade}, ${formatDate(new Date().toISOString())}.`
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
            React.createElement(Text, { style: styles.signatureRole }, 'ENTE FEDERATIVO'),
            assinaturaGestor
              ? React.createElement(
                  View,
                  { style: styles.signatureSeal },
                  React.createElement(
                    Text,
                    null,
                    `Assinado eletronicamente por ${assinaturaGestor.nome_signatario} em ${formatDate(assinaturaGestor.assinado_em)}`
                  ),
                  React.createElement(
                    Text,
                    null,
                    `IP: ${assinaturaGestor.ip_address}`
                  ),
                  React.createElement(
                    Text,
                    null,
                    `Hash: ${assinaturaGestor.hash_documento}`
                  )
                )
              : null
          ),
          // Agente Cultural
          React.createElement(
            View,
            { style: styles.signatureBlock },
            React.createElement(View, { style: styles.signatureLine }),
            React.createElement(Text, { style: styles.signatureName }, proponenteNome),
            React.createElement(Text, { style: styles.signatureRole }, 'AGENTE CULTURAL'),
            assinaturaProponente
              ? React.createElement(
                  View,
                  { style: styles.signatureSeal },
                  React.createElement(
                    Text,
                    null,
                    `Assinado eletronicamente por ${assinaturaProponente.nome_signatario} em ${formatDate(assinaturaProponente.assinado_em)}`
                  ),
                  React.createElement(
                    Text,
                    null,
                    `IP: ${assinaturaProponente.ip_address}`
                  ),
                  React.createElement(
                    Text,
                    null,
                    `Hash: ${assinaturaProponente.hash_documento}`
                  )
                )
              : null
          )
        )
      ),
      React.createElement(
        View,
        { style: styles.footer },
        React.createElement(
          Text,
          null,
          `Termo de Execucao Cultural No ${numeroTermo} - Gerado eletronicamente - ${tenantNome}`
        )
      )
    )
  )
}
