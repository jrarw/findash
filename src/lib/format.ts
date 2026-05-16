export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCurrencyPreviewBRL(value: number): string {
  return formatCurrencyBRL(Number.isFinite(value) ? value : 0)
}

export function parseCurrencyBRLInput(value: string): number {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '')
  if (!cleaned) return 0

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandSeparator = decimalSeparator === ',' ? '.' : ','
    return Number(cleaned.replaceAll(thousandSeparator, '').replace(decimalSeparator, '.'))
  }

  if (lastComma >= 0) {
    return Number(cleaned.replaceAll('.', '').replace(',', '.'))
  }

  if (lastDot >= 0) {
    const decimalDigits = cleaned.length - lastDot - 1
    if (decimalDigits === 3 && cleaned.indexOf('.') === lastDot) {
      return Number(cleaned.replaceAll('.', ''))
    }
  }

  return Number(cleaned)
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(d)
}

export function formatMonth(mes: number, ano: number): string {
  const date = new Date(ano, mes - 1, 1)
  return new Intl.DateTimeFormat('pt-BR', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getCurrentMonthYear(): { mes: number; ano: number } {
  const now = new Date()
  return { mes: now.getMonth() + 1, ano: now.getFullYear() }
}

export function getPreviousMonthYear(mes: number, ano: number): { mes: number; ano: number } {
  if (mes === 1) return { mes: 12, ano: ano - 1 }
  return { mes: mes - 1, ano }
}

export function getMonthStart(mes: number, ano: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-01`
}

export function getMonthEnd(mes: number, ano: number): string {
  const lastDay = new Date(ano, mes, 0).getDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

export function getTodaySaoPauloISO(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const get = (type: string) => parts.find(part => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function getDaysUntil(dateStr: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

export function getGreeting(nome: string): string {
  const hour = new Date().getHours()
  if (hour < 12) return `Bom dia, ${nome.split(' ')[0]} 👋`
  if (hour < 18) return `Boa tarde, ${nome.split(' ')[0]} 👋`
  return `Boa noite, ${nome.split(' ')[0]} 👋`
}
