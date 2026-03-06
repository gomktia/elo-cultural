/**
 * Utilitários para contagem de dias úteis (Fase 4.1).
 * Exclui sábados e domingos. Feriados nacionais fixos incluídos.
 */

const FERIADOS_FIXOS = [
  '01-01', // Ano Novo
  '04-21', // Tiradentes
  '05-01', // Dia do Trabalho
  '09-07', // Independência
  '10-12', // N.S. Aparecida
  '11-02', // Finados
  '11-15', // Proclamação da República
  '12-25', // Natal
]

function isFeriado(date: Date): boolean {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return FERIADOS_FIXOS.includes(mmdd)
}

function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6
}

function isDiaUtil(date: Date): boolean {
  return !isWeekend(date) && !isFeriado(date)
}

/**
 * Count business days between two dates (exclusive of start, inclusive of end).
 */
export function contarDiasUteis(inicio: Date | string, fim: Date | string): number {
  const start = new Date(inicio)
  const end = new Date(fim)
  let count = 0
  const current = new Date(start)
  current.setDate(current.getDate() + 1)

  while (current <= end) {
    if (isDiaUtil(current)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/**
 * Add N business days to a date.
 */
export function adicionarDiasUteis(date: Date | string, dias: number): Date {
  const result = new Date(date)
  let added = 0
  while (added < dias) {
    result.setDate(result.getDate() + 1)
    if (isDiaUtil(result)) added++
  }
  return result
}

/**
 * Get remaining business days until a deadline.
 * Returns negative if past deadline.
 */
export function diasUteisRestantes(deadline: Date | string): number {
  const now = new Date()
  const end = new Date(deadline)
  if (end < now) {
    return -contarDiasUteis(end, now)
  }
  return contarDiasUteis(now, end)
}
