import { z } from 'zod'

export const editalFormSchema = z.object({
  numero_edital: z.string().min(1, 'Numero do edital e obrigatorio'),
  titulo: z.string().min(3, 'Titulo deve ter pelo menos 3 caracteres'),
  descricao: z.string().default(''),
  inicio_inscricao: z.string().default(''),
  fim_inscricao: z.string().default(''),
  inicio_recurso: z.string().default(''),
  fim_recurso: z.string().default(''),
  inicio_recurso_inscricao: z.string().default(''),
  fim_recurso_inscricao: z.string().default(''),
  inicio_recurso_selecao: z.string().default(''),
  fim_recurso_selecao: z.string().default(''),
  inicio_recurso_habilitacao: z.string().default(''),
  fim_recurso_habilitacao: z.string().default(''),
  inicio_impugnacao_inscritos: z.string().default(''),
  fim_impugnacao_inscritos: z.string().default(''),
})

export type EditalFormData = z.infer<typeof editalFormSchema>
