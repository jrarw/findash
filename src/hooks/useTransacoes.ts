'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Transacao, TransacaoInsert } from '@/types/database'
import { getMonthStart, getMonthEnd } from '@/lib/format'
import { ICONS } from '@/lib/iconography'

type GastoCategoriaRow = {
  valor: number
  categoria: { id: string; nome: string; cor: string; icone: string } | null
}

export function useTransacoes(mes: number, ano: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transacoes', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          id, usuario_id, conta_id, categoria_id, tipo, valor,
          descricao, data, efetivado, recorrente, recorrencia_tipo,
          observacoes, tags, created_at,
          categoria:categorias(id, nome, icone, cor, tipo),
          conta:contas(id, nome, banco, cor)
        `)
        .gte('data', getMonthStart(mes, ano))
        .lte('data', getMonthEnd(mes, ano))
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Transacao[]
    },
    staleTime: 30_000,
  })
}

export function useTransacoesAll(limit = 50) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['transacoes-all', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`
          id, usuario_id, conta_id, categoria_id, tipo, valor,
          descricao, data, efetivado, recorrente, recorrencia_tipo,
          observacoes, tags, created_at,
          categoria:categorias(id, nome, icone, cor, tipo),
          conta:contas(id, nome, banco, cor)
        `)
        .order('data', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data as Transacao[]
    },
    staleTime: 30_000,
  })
}

export function useResumoMes(mes: number, ano: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['resumo-mes', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select('tipo, valor')
        .gte('data', getMonthStart(mes, ano))
        .lte('data', getMonthEnd(mes, ano))
        .eq('efetivado', true)

      if (error) throw error

      const entradas = data.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0)
      const saidas = data.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0)

      return { entradas, saidas, saldo: entradas - saidas, mes, ano }
    },
    staleTime: 30_000,
  })
}

export function useResumoPeriodo(start: string, end: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['resumo-periodo', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select('tipo, valor')
        .gte('data', start)
        .lte('data', end)
        .eq('efetivado', true)

      if (error) throw error

      const entradas = data.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0)
      const saidas = data.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0)

      return { entradas, saidas, saldo: entradas - saidas, start, end }
    },
    staleTime: 30_000,
  })
}

export function useFluxoDiario(mes: number, ano: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['fluxo-diario', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, data')
        .gte('data', getMonthStart(mes, ano))
        .lte('data', getMonthEnd(mes, ano))
        .eq('efetivado', true)
        .order('data')

      if (error) throw error

      const byDay: Record<string, { entradas: number; saidas: number }> = {}
      data.forEach(t => {
        if (!byDay[t.data]) byDay[t.data] = { entradas: 0, saidas: 0 }
        if (t.tipo === 'entrada') byDay[t.data].entradas += Number(t.valor)
        if (t.tipo === 'saida') byDay[t.data].saidas += Number(t.valor)
      })

      let saldoAcumulado = 0
      return Object.entries(byDay).sort().map(([data, vals]) => {
        saldoAcumulado += vals.entradas - vals.saidas
        return { data, ...vals, saldo: saldoAcumulado }
      })
    },
    staleTime: 30_000,
  })
}

export function useFluxoPeriodo(start: string, end: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['fluxo-periodo', start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select('tipo, valor, data')
        .gte('data', start)
        .lte('data', end)
        .eq('efetivado', true)
        .order('data')

      if (error) throw error

      const byDay: Record<string, { entradas: number; saidas: number }> = {}
      data.forEach(t => {
        if (!byDay[t.data]) byDay[t.data] = { entradas: 0, saidas: 0 }
        if (t.tipo === 'entrada') byDay[t.data].entradas += Number(t.valor)
        if (t.tipo === 'saida') byDay[t.data].saidas += Number(t.valor)
      })

      let saldoAcumulado = 0
      return Object.entries(byDay).sort().map(([data, vals]) => {
        saldoAcumulado += vals.entradas - vals.saidas
        return { data, ...vals, saldo: saldoAcumulado }
      })
    },
    staleTime: 30_000,
  })
}

export function useGastosPorCategoria(mes: number, ano: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['gastos-categoria', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transacoes')
        .select(`valor, categoria:categorias(id, nome, cor, icone)`)
        .eq('tipo', 'saida')
        .gte('data', getMonthStart(mes, ano))
        .lte('data', getMonthEnd(mes, ano))

      if (error) throw error

      const gastos = (data ?? []) as GastoCategoriaRow[]
      const map: Record<string, { nome: string; cor: string; icone: string; total: number; count: number }> = {}
      gastos.forEach(t => {
        const cat = t.categoria
        const id = cat?.id ?? 'sem-categoria'
        if (!map[id]) map[id] = { nome: cat?.nome ?? 'Sem categoria', cor: cat?.cor ?? '#6B7280', icone: cat?.icone ?? ICONS.category.other, total: 0, count: 0 }
        map[id].total += Number(t.valor)
        map[id].count++
      })

      const total = Object.values(map).reduce((s, v) => s + v.total, 0)
      return Object.entries(map)
        .map(([id, v]) => ({ categoria_id: id, ...v, percentual: total > 0 ? v.total / total * 100 : 0 }))
        .sort((a, b) => b.total - a.total)
    },
    staleTime: 30_000,
  })
}

export function useAdicionarTransacao() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (transacao: TransacaoInsert) => {
      const { data, error } = await supabase.from('transacoes').insert(transacao).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transacoes'] })
      qc.invalidateQueries({ queryKey: ['resumo-mes'] })
      qc.invalidateQueries({ queryKey: ['fluxo-diario'] })
      qc.invalidateQueries({ queryKey: ['gastos-categoria'] })
    }
  })
}
