import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/** Format a date string as "dd/MM/yyyy" (e.g. 28/02/2026) */
export function formatDate(dateStr: string | Date): string {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR })
}

/** Format a date string as "dd MMM yyyy" (e.g. 28 fev 2026) */
export function formatDateShort(dateStr: string | Date): string {
  return format(new Date(dateStr), 'dd MMM yyyy', { locale: ptBR })
}

/** Format a date string as "dd/MM/yyyy HH:mm" (e.g. 28/02/2026 14:30) */
export function formatDateTime(dateStr: string | Date): string {
  return format(new Date(dateStr), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}
