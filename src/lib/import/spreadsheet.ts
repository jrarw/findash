import * as XLSX from 'xlsx'

export type ImportField = 'data' | 'descricao' | 'valor' | 'conta' | 'categoria' | 'subcategoria' | 'tags'

export type ColumnMapping = Record<ImportField, string>

export interface ParsedSpreadsheetRow {
  rowNumber: number
  raw: Record<string, unknown>
  data: string
  descricao: string
  valorOriginal: number
  valor: number
  tipo: 'entrada' | 'saida'
  conta: string
  categoria: string
  subcategoria: string | null
  tags: string[]
  hash: string
  errors: string[]
}

export interface SpreadsheetParseResult {
  sheetName: string
  headers: string[]
  rows: ParsedSpreadsheetRow[]
}

const aliases: Record<ImportField, string[]> = {
  data: ['data', 'date', 'dt', 'dia'],
  descricao: ['descricao', 'descrição', 'description', 'desc', 'historico', 'histórico', 'memo'],
  valor: ['valor', 'amount', 'value', 'quantia', 'total'],
  conta: ['conta', 'account', 'carteira', 'wallet', 'banco'],
  categoria: ['categoria', 'category', 'cat'],
  subcategoria: ['subcategoria', 'sub categoria', 'subcategory', 'subcat'],
  tags: ['tags', 'tag', 'marcadores', 'labels'],
}

function normalizeHeader(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function normalizeText(value: unknown) {
  return String(value ?? '').trim()
}

function parseBrazilianDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }

  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return null
    return `${parsed.y}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`
  }

  const text = normalizeText(value)
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2])
  const year = Number(match[3].length === 2 ? `20${match[3]}` : match[3])
  const date = new Date(Date.UTC(year, month - 1, day))

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseAmount(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value

  const cleaned = normalizeText(value)
    .replace(/[R$\s]/g, '')

  if (!cleaned) return null

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')
  let normalized = cleaned

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? ',' : '.'
    const thousandSeparator = decimalSeparator === ',' ? '.' : ','
    normalized = cleaned.replaceAll(thousandSeparator, '').replace(decimalSeparator, '.')
  } else if (lastComma >= 0) {
    normalized = cleaned.replaceAll('.', '').replace(',', '.')
  } else if (lastDot >= 0) {
    const decimalDigits = cleaned.length - lastDot - 1
    const looksLikeThousands = decimalDigits === 3 && cleaned.indexOf('.') === lastDot
    normalized = looksLikeThousands ? cleaned.replaceAll('.', '') : cleaned
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function parseTags(value: unknown): string[] {
  const text = normalizeText(value)
  if (!text) return []

  return text
    .split(/[;,|]/)
    .map(tag => tag.trim())
    .filter(Boolean)
}

function hashImportRow(parts: string[]) {
  const input = parts.join('|').toLowerCase()
  let hash = 2166136261

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }

  return `imp_${(hash >>> 0).toString(16)}`
}

export function detectColumnMapping(headers: string[]): ColumnMapping {
  const normalized = headers.map(header => ({ header, normalized: normalizeHeader(header) }))

  return (Object.keys(aliases) as ImportField[]).reduce((mapping, field) => {
    const match = normalized.find(item =>
      aliases[field].some(alias => item.normalized === normalizeHeader(alias))
    )
    mapping[field] = match?.header ?? ''
    return mapping
  }, {} as ColumnMapping)
}

export async function parseSpreadsheetFile(file: File): Promise<{ headers: string[]; rawRows: Record<string, unknown>[]; sheetName: string }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const sheetName = workbook.SheetNames.includes('Transações') ? 'Transações' : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '', raw: false })
  const headers = rawRows[0] ? Object.keys(rawRows[0]) : []

  return { headers, rawRows, sheetName }
}

export function buildPreviewRows(rawRows: Record<string, unknown>[], mapping: ColumnMapping): ParsedSpreadsheetRow[] {
  return rawRows
    .map((row, index) => {
      const values = Object.values(row).map(normalizeText)
      const isEmpty = values.every(value => !value)

      if (isEmpty) return null

      const errors: string[] = []
      const data = parseBrazilianDate(row[mapping.data])
      const descricao = normalizeText(row[mapping.descricao])
      const valorOriginal = parseAmount(row[mapping.valor])
      const conta = normalizeText(row[mapping.conta])
      const categoria = normalizeText(row[mapping.categoria])
      const subcategoria = normalizeText(row[mapping.subcategoria]) || null
      const tags = parseTags(row[mapping.tags])

      if (!data) errors.push('Data inválida ou ausente')
      if (!descricao) errors.push('Descrição obrigatória')
      if (valorOriginal === null) errors.push('Valor inválido ou ausente')
      if (!conta) errors.push('Conta obrigatória')

      const safeAmount = valorOriginal ?? 0
      const tipo = safeAmount >= 0 ? 'entrada' : 'saida'
      const valor = Math.abs(safeAmount)
      const hash = hashImportRow([data ?? '', descricao, String(safeAmount), conta, categoria, subcategoria ?? '', tags.join(',')])

      return {
        rowNumber: index + 2,
        raw: row,
        data: data ?? '',
        descricao,
        valorOriginal: safeAmount,
        valor,
        tipo,
        conta,
        categoria: categoria || 'Sem categoria',
        subcategoria,
        tags,
        hash,
        errors,
      }
    })
    .filter(Boolean) as ParsedSpreadsheetRow[]
}

