import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Informe seu e-mail ou CPF/CNPJ'),
  password: z.string().min(1, 'Informe sua senha'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const cadastroStep1Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido').refine(
    (val) => {
      const digits = val.replace(/\D/g, '')
      return digits.length === 11 || digits.length === 14
    },
    { message: 'CPF deve ter 11 dígitos ou CNPJ 14 dígitos' }
  ),
  telefone: z.string().min(10, 'Telefone inválido'),
  lgpdConsent: z.literal(true, {
    message: 'Você deve aceitar os termos da LGPD',
  }),
})

export type CadastroStep1Data = z.infer<typeof cadastroStep1Schema>

export const proponenteSchema = z.object({
  areas_atuacao: z.array(z.string()).default([]),
  tempo_atuacao: z.string().default(''),
  renda: z.string().default(''),
  genero: z.string().default(''),
  orientacao_sexual: z.string().default(''),
  raca_etnia: z.string().default(''),
  pcd: z.boolean().default(false),
  endereco_completo: z.string().default(''),
  municipio: z.string().default(''),
  estado: z.string().default(''),
})

export const avaliadorSchema = z.object({
  curriculo_descricao: z.string().default(''),
  areas_avaliacao: z.array(z.string()).default([]),
  lattes_url: z.string().url('URL inválida').or(z.literal('')).default(''),
})

export const gestorSchema = z.object({
  orgao_vinculado: z.string().default(''),
  funcao_cargo: z.string().default(''),
  matricula: z.string().default(''),
})

export const esquecerSenhaSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export type EsquecerSenhaData = z.infer<typeof esquecerSenhaSchema>

export const alterarSenhaSchema = z.object({
  nova: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmar: z.string().min(6, 'Confirmação deve ter pelo menos 6 caracteres'),
}).refine((data) => data.nova === data.confirmar, {
  message: 'As senhas não coincidem',
  path: ['confirmar'],
})

export type AlterarSenhaData = z.infer<typeof alterarSenhaSchema>
