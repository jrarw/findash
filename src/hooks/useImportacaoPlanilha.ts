'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ICONS, getCategoryIcon } from '@/lib/iconography'
import type { ImportBatch } from '@/types/database'
import type { ParsedSpreadsheetRow } from '@/lib/import/spreadsheet'

type SupabaseErrorLike = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

interface ConfirmImportInput {
  fileName: string
  rows: ParsedSpreadsheetRow[]
}

export interface ImportSummary {
  batchId: string
  importedRows: number
  skippedRows: number
  errorRows: number
  totalIncome: number
  totalExpense: number
  netTotal: number
  contasCriadas: number
  categoriasCriadas: number
  subcategoriasCriadas: number
}

function normalizeName(value: string) {
  return value.trim().toLowerCase()
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getSupabaseDetails(error: SupabaseErrorLike) {
  return [error.code, error.message, error.details, error.hint].filter(Boolean).join(' | ')
}

function getDuplicateCheckErrorMessage(error: SupabaseErrorLike) {
  if (error.code === '42703' || error.message?.toLowerCase().includes('import_hash')) {
    return 'A migration 007_importacao_planilhas.sql ainda não foi aplicada corretamente. A coluna transacoes.import_hash não existe no Supabase.'
  }

  return `Não foi possível verificar duplicidades antes da importação. Detalhes: ${getSupabaseDetails(error) || 'sem detalhes retornados'}`
}

export function useImportBatches() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['import-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_batches')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error
      return data as ImportBatch[]
    },
    staleTime: 30_000,
  })
}

export function useConfirmarImportacao() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ fileName, rows }: ConfirmImportInput): Promise<ImportSummary> => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Sua sessão expirou. Faça login novamente para importar a planilha.')
      }

      const usuarioId = authData.user.id
      const validRows = rows.filter(row => row.errors.length === 0)
      const invalidRows = rows.length - validRows.length
      const uniqueRows = validRows.filter((row, index, all) => all.findIndex(item => item.hash === row.hash) === index)
      const duplicatedInFile = validRows.length - uniqueRows.length
      const hashes = uniqueRows.map(row => row.hash)
      const existingHashSet = new Set<string>()

      for (const hashChunk of chunkArray(hashes, 250)) {
        const { data: existingHashes, error: hashError } = await supabase
          .from('transacoes')
          .select('import_hash')
          .in('import_hash', hashChunk)

        if (hashError) {
          throw new Error(getDuplicateCheckErrorMessage(hashError))
        }

        ;(existingHashes ?? []).forEach(item => {
          if (item.import_hash) existingHashSet.add(item.import_hash)
        })
      }

      const importRows = uniqueRows.filter(row => !existingHashSet.has(row.hash))
      const skippedRows = duplicatedInFile + uniqueRows.length - importRows.length

      const totalIncome = importRows
        .filter(row => row.tipo === 'entrada')
        .reduce((sum, row) => sum + row.valor, 0)
      const totalExpense = importRows
        .filter(row => row.tipo === 'saida')
        .reduce((sum, row) => sum + row.valor, 0)
      const netTotal = totalIncome - totalExpense

      const { data: batch, error: batchError } = await supabase
        .from('import_batches')
        .insert({
          usuario_id: usuarioId,
          file_name: fileName,
          total_rows: rows.length,
          imported_rows: 0,
          skipped_rows: skippedRows,
          error_rows: invalidRows,
          total_income: totalIncome,
          total_expense: totalExpense,
          net_total: netTotal,
          status: 'completed',
        })
        .select()
        .single()

      if (batchError || !batch) {
        throw new Error('Não foi possível criar o lote de importação.')
      }

      const { data: contasExistentes, error: contasError } = await supabase
        .from('contas')
        .select('id, nome')
        .eq('ativa', true)

      if (contasError) throw new Error('Não foi possível buscar contas existentes.')

      const { data: categoriasExistentes, error: categoriasError } = await supabase
        .from('categorias')
        .select('id, nome, tipo')
        .eq('ativa', true)

      if (categoriasError) throw new Error('Não foi possível buscar categorias existentes.')

      const contasMap = new Map((contasExistentes ?? []).map(conta => [normalizeName(conta.nome), conta.id]))
      const categoriasMap = new Map((categoriasExistentes ?? []).map(categoria => [normalizeName(categoria.nome), categoria.id]))
      let contasCriadas = 0
      let categoriasCriadas = 0
      let subcategoriasCriadas = 0

      for (const row of importRows) {
        if (!contasMap.has(normalizeName(row.conta))) {
          const { data: conta, error } = await supabase
            .from('contas')
            .insert({
              usuario_id: usuarioId,
              nome: row.conta,
              tipo: 'corrente',
              banco: null,
              cor: '#00E5FF',
              icone: ICONS.finance.account,
              saldo_inicial: 0,
              ativa: true,
            })
            .select('id, nome')
            .single()

          if (error || !conta) throw new Error(`Não foi possível criar a conta "${row.conta}".`)
          contasMap.set(normalizeName(conta.nome), conta.id)
          contasCriadas++
        }

        if (!categoriasMap.has(normalizeName(row.categoria))) {
          const { data: categoria, error } = await supabase
            .from('categorias')
            .insert({
              usuario_id: usuarioId,
              nome: row.categoria,
              tipo: row.tipo === 'entrada' ? 'entrada' : 'saida',
              icone: row.tipo === 'entrada' ? ICONS.finance.income : getCategoryIcon(row.categoria),
              cor: row.tipo === 'entrada' ? '#22C55E' : '#00E5FF',
              ativa: true,
              ordem: 999,
            })
            .select('id, nome')
            .single()

          if (error || !categoria) throw new Error(`Não foi possível criar a categoria "${row.categoria}".`)
          categoriasMap.set(normalizeName(categoria.nome), categoria.id)
          categoriasCriadas++
        }
      }

      const subcategoriaMap = new Map<string, string>()
      for (const row of importRows.filter(item => item.subcategoria)) {
        const categoriaId = categoriasMap.get(normalizeName(row.categoria))
        if (!categoriaId || !row.subcategoria) continue

        const key = `${categoriaId}:${normalizeName(row.subcategoria)}`
        if (subcategoriaMap.has(key)) continue

        const { data: existente } = await supabase
          .from('subcategorias')
          .select('id')
          .eq('categoria_id', categoriaId)
          .eq('nome', row.subcategoria)
          .maybeSingle()

        if (existente) {
          subcategoriaMap.set(key, existente.id)
          continue
        }

        const { data: subcategoria, error } = await supabase
          .from('subcategorias')
          .insert({
            usuario_id: usuarioId,
            categoria_id: categoriaId,
            nome: row.subcategoria,
            ativa: true,
          })
          .select('id')
          .single()

        if (error || !subcategoria) throw new Error(`Não foi possível criar a subcategoria "${row.subcategoria}".`)
        subcategoriaMap.set(key, subcategoria.id)
        subcategoriasCriadas++
      }

      if (importRows.length > 0) {
        const payload = importRows.map(row => {
          const categoriaId = categoriasMap.get(normalizeName(row.categoria)) ?? null
          const subcategoriaId = row.subcategoria && categoriaId
            ? subcategoriaMap.get(`${categoriaId}:${normalizeName(row.subcategoria)}`) ?? null
            : null

          return {
            usuario_id: usuarioId,
            conta_id: contasMap.get(normalizeName(row.conta)) ?? null,
            categoria_id: categoriaId,
            subcategoria_id: subcategoriaId,
            tipo: row.tipo,
            valor: row.valor,
            descricao: row.descricao,
            data: row.data,
            data_competencia: row.data,
            efetivado: true,
            recorrente: false,
            recorrencia_id: null,
            recorrencia_tipo: null,
            observacoes: null,
            tags: row.tags,
            origem: 'spreadsheet_import',
            import_batch_id: batch.id,
            import_hash: row.hash,
          }
        })

        for (const chunk of chunkArray(payload, 400)) {
          const { error: insertError } = await supabase.from('transacoes').insert(chunk)
          if (insertError) {
            throw new Error('Não foi possível importar as transações válidas.')
          }
        }
      }

      const { error: updateBatchError } = await supabase
        .from('import_batches')
        .update({
          imported_rows: importRows.length,
          skipped_rows: skippedRows,
          error_rows: invalidRows,
          total_income: totalIncome,
          total_expense: totalExpense,
          net_total: netTotal,
        })
        .eq('id', batch.id)

      if (updateBatchError) {
        throw new Error('As transações foram importadas, mas o resumo do lote não pôde ser atualizado.')
      }

      return {
        batchId: batch.id,
        importedRows: importRows.length,
        skippedRows,
        errorRows: invalidRows,
        totalIncome,
        totalExpense,
        netTotal,
        contasCriadas,
        categoriasCriadas,
        subcategoriasCriadas,
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['import-batches'] })
      qc.invalidateQueries({ queryKey: ['transacoes'] })
      qc.invalidateQueries({ queryKey: ['resumo-mes'] })
      qc.invalidateQueries({ queryKey: ['fluxo-diario'] })
      qc.invalidateQueries({ queryKey: ['gastos-categoria'] })
      qc.invalidateQueries({ queryKey: ['contas-bancarias'] })
      qc.invalidateQueries({ queryKey: ['categorias'] })
    },
  })
}

export function useDesfazerImportacao() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (batchId: string) => {
      const { error: deleteError } = await supabase
        .from('transacoes')
        .delete()
        .eq('import_batch_id', batchId)

      if (deleteError) {
        throw new Error('Não foi possível remover as transações desse lote.')
      }

      const { error: batchError } = await supabase
        .from('import_batches')
        .update({ status: 'undone' })
        .eq('id', batchId)

      if (batchError) {
        throw new Error('As transações foram removidas, mas o lote não pôde ser marcado como desfeito.')
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['import-batches'] })
      qc.invalidateQueries({ queryKey: ['transacoes'] })
      qc.invalidateQueries({ queryKey: ['resumo-mes'] })
      qc.invalidateQueries({ queryKey: ['fluxo-diario'] })
      qc.invalidateQueries({ queryKey: ['gastos-categoria'] })
    },
  })
}

