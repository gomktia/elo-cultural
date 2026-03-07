/**
 * Utilities for CPF/CNPJ detection, formatting, and validation
 */

/** Remove all non-digit characters */
export function cleanDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** Check if a cleaned string looks like a CNPJ (14 digits) */
export function isCnpj(value: string): boolean {
  return cleanDigits(value).length === 14
}

/** Check if a cleaned string looks like a CPF (11 digits) */
export function isCpf(value: string): boolean {
  return cleanDigits(value).length === 11
}

/** Detect type based on digit count */
export function detectDocType(value: string): 'cpf' | 'cnpj' | 'unknown' {
  const digits = cleanDigits(value)
  if (digits.length <= 11) return 'cpf'
  if (digits.length <= 14) return 'cnpj'
  return 'unknown'
}

/** Format CPF: 000.000.000-00 */
export function formatCpf(value: string): string {
  const digits = cleanDigits(value).slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

/** Format CNPJ: 00.000.000/0000-00 */
export function formatCnpj(value: string): string {
  const digits = cleanDigits(value).slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

/** Auto-format based on length */
export function formatCpfCnpj(value: string): string {
  const digits = cleanDigits(value)
  if (digits.length <= 11) return formatCpf(value)
  return formatCnpj(value)
}

/** Format CEP: 00000-000 */
export function formatCep(value: string): string {
  const digits = cleanDigits(value).slice(0, 8)
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}
