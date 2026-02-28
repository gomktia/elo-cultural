import { getOpenAIClient } from '@/lib/openai'
import { getIAConfig } from '@/lib/ia/config'

interface ProjetoTexto {
  id: string
  titulo: string
  texto: string // resumo + " " + descricao_tecnica concatenated
  orcamento_total: number
}

interface IrregularidadeResult {
  projetoId: string
  projetoSimilarId: string
  similaridade: number
  tipo: 'texto_similar' | 'orcamento_duplicado'
}

export async function detectarIrregularidades(
  projetos: ProjetoTexto[]
): Promise<IrregularidadeResult[]> {
  const flags: IrregularidadeResult[] = []

  if (projetos.length < 2) return flags

  // 1. Generate embeddings for all projects
  const openai = await getOpenAIClient()
  const iaConfig = await getIAConfig()
  const textos = projetos.map((p) => p.texto)

  const embeddingResponse = await openai.embeddings.create({
    model: iaConfig.embeddingModel,
    input: textos,
  })

  const embeddings = embeddingResponse.data.map((d) => d.embedding)

  // 2. Compare all pairs (cosine similarity)
  for (let i = 0; i < projetos.length; i++) {
    for (let j = i + 1; j < projetos.length; j++) {
      const sim = cosineSimilarity(embeddings[i], embeddings[j])
      if (sim > 0.85) {
        flags.push({
          projetoId: projetos[i].id,
          projetoSimilarId: projetos[j].id,
          similaridade: Math.round(sim * 10000) / 10000,
          tipo: 'texto_similar',
        })
      }
    }
  }

  // 3. Check duplicate budgets
  const orcamentoMap = new Map<number, string[]>()
  for (const p of projetos) {
    const key = p.orcamento_total
    if (!orcamentoMap.has(key)) orcamentoMap.set(key, [])
    orcamentoMap.get(key)!.push(p.id)
  }

  for (const [, ids] of orcamentoMap) {
    if (ids.length > 1) {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          flags.push({
            projetoId: ids[i],
            projetoSimilarId: ids[j],
            similaridade: 1,
            tipo: 'orcamento_duplicado',
          })
        }
      }
    }
  }

  return flags
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
