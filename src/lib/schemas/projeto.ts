import { z } from 'zod'

export const inscricaoSchema = z.object({
  titulo: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  resumo: z.string().default(''),
  descricao_tecnica: z.string().default(''),
  orcamento_total: z.string().default(''),
  cronograma_execucao: z.string().default(''),
})

export type InscricaoFormData = z.infer<typeof inscricaoSchema>

export const recursoSchema = z.object({
  tipo: z.enum(['habilitacao', 'avaliacao'], {
    message: 'Selecione o tipo de recurso',
  }),
  fundamentacao: z.string().min(10, 'Fundamentacao deve ter pelo menos 10 caracteres'),
})

export type RecursoFormData = z.infer<typeof recursoSchema>
