'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyDataState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { useConfirmarImportacao, useDesfazerImportacao, useImportBatches, type ImportSummary } from '@/hooks/useImportacaoPlanilha'
import {
  buildPreviewRows,
  detectColumnMapping,
  parseSpreadsheetFile,
  type ColumnMapping,
  type ImportField,
} from '@/lib/import/spreadsheet'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatDate } from '@/lib/format'
import { ICONS } from '@/lib/iconography'

const fields: { key: ImportField; label: string; required?: boolean }[] = [
  { key: 'data', label: 'Data', required: true },
  { key: 'descricao', label: 'Descrição', required: true },
  { key: 'valor', label: 'Valor', required: true },
  { key: 'conta', label: 'Conta', required: true },
  { key: 'categoria', label: 'Categoria' },
  { key: 'subcategoria', label: 'Subcategoria' },
  { key: 'tags', label: 'Tags' },
]

const emptyMapping: ColumnMapping = {
  data: '',
  descricao: '',
  valor: '',
  conta: '',
  categoria: '',
  subcategoria: '',
  tags: '',
}

export default function ImportarPage() {
  const confirmarImportacao = useConfirmarImportacao()
  const desfazerImportacao = useDesfazerImportacao()
  const { data: batches } = useImportBatches()
  const [fileName, setFileName] = useState('')
  const [sheetName, setSheetName] = useState('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, unknown>[]>([])
  const [mapping, setMapping] = useState<ColumnMapping>(emptyMapping)
  const [erro, setErro] = useState('')
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const rows = useMemo(() => buildPreviewRows(rawRows, mapping), [rawRows, mapping])
  const validRows = rows.filter(row => row.errors.length === 0)
  const invalidRows = rows.filter(row => row.errors.length > 0)
  const receitas = validRows.filter(row => row.tipo === 'entrada')
  const despesas = validRows.filter(row => row.tipo === 'saida')
  const totalIncome = receitas.reduce((sum, row) => sum + row.valor, 0)
  const totalExpense = despesas.reduce((sum, row) => sum + row.valor, 0)
  const netTotal = totalIncome - totalExpense
  const requiredMissing = fields.filter(field => field.required && !mapping[field.key])

  async function handleFile(file?: File) {
    if (!file) return

    setErro('')
    setSummary(null)

    try {
      const parsed = await parseSpreadsheetFile(file)
      setFileName(file.name)
      setSheetName(parsed.sheetName)
      setHeaders(parsed.headers)
      setRawRows(parsed.rawRows)
      setMapping(detectColumnMapping(parsed.headers))
    } catch {
      setErro('Não foi possível ler o arquivo. Envie um .xlsx ou .csv válido.')
    }
  }

  async function handleConfirmar() {
    if (requiredMissing.length > 0) {
      setErro('Mapeie Data, Descrição, Valor e Conta antes de importar.')
      return
    }

    if (validRows.length === 0) {
      setErro('Não existem linhas válidas para importar.')
      return
    }

    setErro('')

    try {
      const result = await confirmarImportacao.mutateAsync({ fileName, rows })
      setSummary(result)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível importar a planilha.')
    }
  }

  async function handleDesfazer(batchId: string) {
    setErro('')

    try {
      await desfazerImportacao.mutateAsync(batchId)
      if (summary?.batchId === batchId) setSummary(null)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível desfazer a importação.')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <Badge variant="cyan">Importação inteligente</Badge>
        <h1 className="mt-3 text-2xl font-bold text-white md:text-3xl">Importar planilha financeira</h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45">
          Leia CSV ou Excel, revise os dados, corrija mapeamentos e confirme só o que estiver válido. Contas, categorias e subcategorias são criadas automaticamente.
        </p>
      </motion.div>

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">1. Upload</p>
                <p className="text-xs text-white/40">Arquivos .xlsx e .csv</p>
              </div>
              <Icon name={ICONS.import.file} className="text-2xl text-[#00E5FF]" />
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/[0.12] bg-white/[0.03] px-4 py-10 text-center transition-colors hover:border-[#00E5FF]/35 hover:bg-[#00E5FF]/[0.03]">
              <Icon name={ICONS.import.upload} className="mb-3 text-4xl text-white/25" />
              <span className="text-sm font-medium text-white">{fileName || 'Selecionar planilha'}</span>
              <span className="mt-1 text-xs text-white/35">Aba “Transações” é detectada automaticamente</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={event => handleFile(event.target.files?.[0])}
              />
            </label>

            {sheetName && (
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-sm text-white/55">
                Aba detectada: <span className="font-semibold text-white">{sheetName}</span>
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">2. Mapeamento</p>
                <p className="text-xs text-white/40">Ajuste caso a planilha venha com nomes diferentes</p>
              </div>
              <Icon name={ICONS.import.columns} className="text-2xl text-[#A855F7]" />
            </div>

            {headers.length > 0 ? (
              <div className="space-y-3">
                {fields.map(field => (
                  <label key={field.key} className="grid gap-1">
                    <span className="text-xs text-white/40">
                      {field.label} {field.required && <span className="text-red-300">*</span>}
                    </span>
                    <select
                      value={mapping[field.key]}
                      onChange={event => setMapping(current => ({ ...current, [field.key]: event.target.value }))}
                      className="rounded-xl border border-white/[0.08] bg-[#111119] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="">Não mapear</option>
                      {headers.map(header => <option key={header} value={header}>{header}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            ) : (
              <EmptyDataState
                compact
                icon={ICONS.import.mapping}
                title="Aguardando arquivo"
                description="Depois do upload, as colunas aparecem aqui para revisão."
              />
            )}
          </Card>

          {batches && batches.length > 0 && (
            <Card className="p-5">
              <p className="mb-4 text-sm font-semibold text-white">Importações recentes</p>
              <div className="space-y-2">
                {batches.map(batch => (
                  <div key={batch.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{batch.file_name}</p>
                        <p className="text-xs text-white/35">{formatDate(batch.created_at.slice(0, 10))} • {batch.imported_rows} linhas</p>
                      </div>
                      <Badge variant={batch.status === 'undone' ? 'default' : 'success'}>{batch.status === 'undone' ? 'desfeito' : 'importado'}</Badge>
                    </div>
                    {batch.status !== 'undone' && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        loading={desfazerImportacao.isPending}
                        onClick={() => handleDesfazer(batch.id)}
                      >
                        Desfazer importação
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">3. Preview e validação</p>
                <p className="text-xs text-white/40">Revise antes de gravar no Supabase</p>
              </div>
              <Badge variant={invalidRows.length > 0 ? 'warning' : 'cyan'}>{rows.length} linhas</Badge>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-xs text-white/35">Receitas</p>
                <p className="mt-1 font-bold text-green-400">{formatCurrencyBRL(totalIncome)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-xs text-white/35">Despesas</p>
                <p className="mt-1 font-bold text-red-300">{formatCurrencyBRL(totalExpense)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-xs text-white/35">Líquido</p>
                <p className="mt-1 font-bold text-white">{formatCurrencyBRL(netTotal)}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                <p className="text-xs text-white/35">Erros</p>
                <p className="mt-1 font-bold text-amber-300">{invalidRows.length}</p>
              </div>
            </div>

            {erro && (
              <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                <Icon name={ICONS.status.danger} className="mr-2" />
                {erro}
              </div>
            )}

            {summary && (
              <div className="mb-4 rounded-3xl border border-[#00E5FF]/20 bg-[#00E5FF]/10 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Icon name={ICONS.status.success} className="text-xl text-[#00E5FF]" />
                  <p className="font-semibold text-white">Importação concluída</p>
                </div>
                <div className="grid gap-2 text-sm text-white/65 md:grid-cols-2">
                  <span>{summary.importedRows} transações importadas</span>
                  <span>{formatCurrencyBRL(summary.totalIncome)} em receitas</span>
                  <span>{formatCurrencyBRL(summary.totalExpense)} em despesas</span>
                  <span>{formatCurrencyBRL(summary.netTotal)} de saldo líquido</span>
                  <span>{summary.contasCriadas} contas criadas</span>
                  <span>{summary.categoriasCriadas + summary.subcategoriasCriadas} categorias/subcategorias criadas</span>
                </div>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  loading={desfazerImportacao.isPending}
                  onClick={() => handleDesfazer(summary.batchId)}
                  className="mt-4"
                >
                  Desfazer importação
                </Button>
              </div>
            )}

            {rows.length > 0 ? (
              <div className="max-h-[460px] overflow-auto rounded-2xl border border-white/[0.08]">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 bg-[#101018] text-xs text-white/40">
                    <tr>
                      <th className="px-3 py-3">Linha</th>
                      <th className="px-3 py-3">Data</th>
                      <th className="px-3 py-3">Descrição</th>
                      <th className="px-3 py-3">Valor</th>
                      <th className="px-3 py-3">Conta</th>
                      <th className="px-3 py-3">Categoria</th>
                      <th className="px-3 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map(row => (
                      <tr key={`${row.rowNumber}-${row.hash}`} className="border-t border-white/[0.06]">
                        <td className="px-3 py-3 text-white/35">{row.rowNumber}</td>
                        <td className="px-3 py-3 text-white/70">{row.data || '-'}</td>
                        <td className="max-w-[220px] truncate px-3 py-3 text-white">{row.descricao || '-'}</td>
                        <td className={cn('px-3 py-3 font-semibold', row.tipo === 'entrada' ? 'text-green-400' : 'text-red-300')}>
                          {formatCurrencyBRL(row.valor)}
                        </td>
                        <td className="px-3 py-3 text-white/70">{row.conta || '-'}</td>
                        <td className="px-3 py-3 text-white/70">{row.categoria}{row.subcategoria ? ` > ${row.subcategoria}` : ''}</td>
                        <td className="px-3 py-3">
                          {row.errors.length > 0 ? (
                            <span className="text-xs text-amber-300">{row.errors.join(', ')}</span>
                          ) : (
                            <Badge variant="success">válida</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyDataState
                icon={ICONS.import.table}
                title="Preview vazio"
                description="Envie uma planilha para visualizar as transações antes de confirmar a importação."
              />
            )}

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-xs text-white/35">
                Linhas inválidas são ignoradas. Duplicidades são puladas automaticamente quando possível.
              </p>
              <Button
                type="button"
                loading={confirmarImportacao.isPending}
                disabled={rows.length === 0 || requiredMissing.length > 0 || validRows.length === 0}
                onClick={handleConfirmar}
                className="w-full md:w-auto"
              >
                Confirmar importação
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

