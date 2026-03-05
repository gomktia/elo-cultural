import { z } from 'zod'

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor hexadecimal invalida')

export const tenantFormSchema = z.object({
  nome: z.string().min(2, 'Nome e obrigatorio'),
  cnpj: z.string().min(14, 'CNPJ invalido').refine(
    (val) => val.replace(/\D/g, '').length === 14,
    { message: 'CNPJ deve ter 14 digitos' }
  ),
  dominio: z.string().min(2, 'Dominio e obrigatorio'),
  status: z.enum(['ativo', 'inativo', 'suspenso']).default('ativo'),
  cor_primaria: hexColor.default('#0047AB'),
  cor_secundaria: hexColor.default('#7E3AF2'),
})

export type TenantFormData = z.infer<typeof tenantFormSchema>

export const configuracoesSchema = z.object({
  nome: z.string().min(2, 'Nome e obrigatorio'),
  cnpj: z.string().default(''),
  dominio: z.string().default(''),
  cor_primaria: hexColor.default('#1A56DB'),
  cor_secundaria: hexColor.default('#7E3AF2'),
})

export type ConfiguracoesFormData = z.infer<typeof configuracoesSchema>

export const perfilSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  telefone: z.string().default(''),
  cpf_cnpj: z.string().default(''),
})

export type PerfilFormData = z.infer<typeof perfilSchema>
