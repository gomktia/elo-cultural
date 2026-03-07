/**
 * API lookups for CNPJ (BrasilAPI) and CEP (ViaCEP)
 */

export interface CnpjData {
  razao_social: string
  nome_fantasia: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  cep: string
  telefone: string
  email: string
}

export interface CepData {
  logradouro: string
  complemento: string
  bairro: string
  localidade: string
  uf: string
  cep: string
}

/** Fetch company data from BrasilAPI by CNPJ (14 digits) */
export async function fetchCnpjData(cnpj: string): Promise<CnpjData | null> {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return null

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      municipio: data.municipio || '',
      uf: data.uf || '',
      cep: data.cep || '',
      telefone: data.ddd_telefone_1 || '',
      email: data.email || '',
    }
  } catch {
    return null
  }
}

/** Fetch address data from ViaCEP by CEP (8 digits) */
export async function fetchCepData(cep: string): Promise<CepData | null> {
  const digits = cep.replace(/\D/g, '')
  if (digits.length !== 8) return null

  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
    if (!res.ok) return null
    const data = await res.json()
    if (data.erro) return null
    return {
      logradouro: data.logradouro || '',
      complemento: data.complemento || '',
      bairro: data.bairro || '',
      localidade: data.localidade || '',
      uf: data.uf || '',
      cep: data.cep || '',
    }
  } catch {
    return null
  }
}
