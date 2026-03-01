export interface ProjetoParaAnalise {
  id: string
  titulo: string
  resumo: string
  descricao_tecnica: string
  orcamento_total: number
  cronograma_execucao: string
}

export interface EditalParaAnalise {
  titulo: string
  numero_edital: string
  objeto: string
}

export interface CriterioParaAnalise {
  id: string
  descricao: string
  nota_minima: number
  nota_maxima: number
  peso: number
}

export interface DocumentoInfo {
  tipo: string
  nome_arquivo: string
}

const SYSTEM_MESSAGE =
  'Voce e um assistente especializado em analise de projetos culturais para editais publicos brasileiros. Analise com objetividade e rigor tecnico.'

export function buildHabilitacaoPrompt(
  projeto: ProjetoParaAnalise,
  edital: EditalParaAnalise,
  documentos: DocumentoInfo[]
): { system: string; user: string } {
  const tiposPresentes = documentos.map((d) => d.tipo)
  const listaDocumentos = documentos
    .map((d) => `- Tipo: ${d.tipo} | Arquivo: ${d.nome_arquivo}`)
    .join('\n')

  const user = `## Tarefa
Analise se o projeto abaixo atende aos requisitos basicos de habilitacao para o edital informado.

## Edital
- Titulo: ${edital.titulo}
- Numero: ${edital.numero_edital}
- Objeto: ${edital.objeto}

## Projeto
- Titulo: ${projeto.titulo}
- Resumo: ${projeto.resumo}
- Descricao Tecnica: ${projeto.descricao_tecnica}
- Orcamento Total: R$ ${projeto.orcamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Cronograma de Execucao: ${projeto.cronograma_execucao}

## Documentos Enviados
${listaDocumentos || 'Nenhum documento enviado.'}

Tipos de documentos presentes: ${tiposPresentes.join(', ') || 'nenhum'}

## Criterios de Habilitacao
1. Documentos obrigatorios: identidade, proposta, orcamento (complementar e opcional)
2. O resumo e a descricao tecnica devem estar alinhados com o objeto do edital
3. O orcamento deve estar dentro de uma faixa razoavel

## Formato de Resposta
Responda EXCLUSIVAMENTE em JSON valido, sem texto adicional, no seguinte formato:
{
  "sugestao": "habilitado" | "inabilitado" | "pendencia",
  "motivo": "Explicacao detalhada em portugues",
  "docs_completos": true | false,
  "problemas": ["lista", "de", "problemas encontrados"]
}`

  return { system: SYSTEM_MESSAGE, user }
}

export function buildAvaliacaoPrompt(
  projeto: ProjetoParaAnalise,
  criterio: CriterioParaAnalise,
  edital: EditalParaAnalise
): { system: string; user: string } {
  const user = `## Tarefa
Avalie o projeto abaixo com base no criterio de avaliacao especificado. Atribua uma nota dentro do intervalo permitido e justifique sua avaliacao.

## Edital
- Titulo: ${edital.titulo}
- Numero: ${edital.numero_edital}
- Objeto: ${edital.objeto}

## Projeto
- Titulo: ${projeto.titulo}
- Resumo: ${projeto.resumo}
- Descricao Tecnica: ${projeto.descricao_tecnica}
- Orcamento Total: R$ ${projeto.orcamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Cronograma de Execucao: ${projeto.cronograma_execucao}

## Criterio de Avaliacao
- ID: ${criterio.id}
- Descricao: ${criterio.descricao}
- Nota Minima: ${criterio.nota_minima}
- Nota Maxima: ${criterio.nota_maxima}
- Peso: ${criterio.peso}

## Instrucoes
- A nota deve estar entre ${criterio.nota_minima} e ${criterio.nota_maxima}
- Considere o resumo, descricao tecnica, orcamento e cronograma do projeto
- Avalie o alinhamento do projeto com o criterio descrito
- Indique seu nivel de confianca na avaliacao (0 a 1)

## Formato de Resposta
Responda EXCLUSIVAMENTE em JSON valido, sem texto adicional, no seguinte formato:
{
  "nota": 8.5,
  "justificativa": "Justificativa detalhada em portugues",
  "confianca": 0.75
}`

  return { system: SYSTEM_MESSAGE, user }
}

/**
 * Batch version: evaluates ALL criteria for a project in a single API call.
 * Reduces N+1 calls (1 per criteria) to a single call per project.
 */
export function buildAvaliacaoBatchPrompt(
  projeto: ProjetoParaAnalise,
  criterios: CriterioParaAnalise[],
  edital: EditalParaAnalise
): { system: string; user: string } {
  const criteriosStr = criterios.map((c, i) =>
    `${i + 1}. ID: ${c.id}\n   Descricao: ${c.descricao}\n   Nota Minima: ${c.nota_minima} | Nota Maxima: ${c.nota_maxima} | Peso: ${c.peso}`
  ).join('\n')

  const user = `## Tarefa
Avalie o projeto abaixo com base em TODOS os criterios de avaliacao listados. Para cada criterio, atribua uma nota dentro do intervalo permitido e justifique.

## Edital
- Titulo: ${edital.titulo}
- Numero: ${edital.numero_edital}
- Objeto: ${edital.objeto}

## Projeto
- Titulo: ${projeto.titulo}
- Resumo: ${projeto.resumo}
- Descricao Tecnica: ${projeto.descricao_tecnica}
- Orcamento Total: R$ ${Number(projeto.orcamento_total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
- Cronograma de Execucao: ${projeto.cronograma_execucao}

## Criterios de Avaliacao
${criteriosStr}

## Instrucoes
- Para CADA criterio, a nota deve estar entre a nota minima e maxima do criterio
- Considere o resumo, descricao tecnica, orcamento e cronograma do projeto
- Avalie o alinhamento do projeto com cada criterio descrito
- Indique seu nivel de confianca na avaliacao de cada criterio (0 a 1)

## Formato de Resposta
Responda EXCLUSIVAMENTE em JSON valido, sem texto adicional, no seguinte formato:
{
  "avaliacoes": [
    {
      "criterio_id": "uuid-do-criterio",
      "nota": 8.5,
      "justificativa": "Justificativa detalhada em portugues",
      "confianca": 0.75
    }
  ]
}`

  return { system: SYSTEM_MESSAGE, user }
}
