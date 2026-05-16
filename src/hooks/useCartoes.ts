'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getCurrentMonthYear } from '@/lib/format'
import type { CartaoBandeira, CartaoCredito, CompraCartao, FaturaCartao } from '@/types/database'

export interface AdicionarCartaoInput {
  nome: string
  bandeira: CartaoBandeira
  limiteTotal: number
  diaFechamento: number
  diaVencimento: number
  cor: string
}

export function useCartoesCredito() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['cartoes-credito'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cartoes_credito')
        .select('id, usuario_id, nome, bandeira, limite_total, dia_fechamento, dia_vencimento, cor, ativo, created_at, updated_at')
        .eq('ativo', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as CartaoCredito[]
    },
    staleTime: 60_000,
  })
}

export function useComprasCartao(mes?: number, ano?: number) {
  const supabase = createClient()
  const atual = getCurrentMonthYear()
  const m = mes ?? atual.mes
  const a = ano ?? atual.ano

  return useQuery({
    queryKey: ['compras-cartao', m, a],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_cartao')
        .select(`
          id, usuario_id, cartao_id, categoria_id, descricao, valor_total,
          parcelas_total, parcela_atual, fatura_mes, fatura_ano, data_compra,
          recorrente, estabelecimento, observacoes, created_at, updated_at,
          cartao:cartoes_credito(id, nome, bandeira, limite_total, cor),
          categoria:categorias(id, nome, cor, icone)
        `)
        .eq('fatura_mes', m)
        .eq('fatura_ano', a)
        .order('data_compra', { ascending: false })

      if (error) throw error
      return data as CompraCartao[]
    },
    staleTime: 30_000,
  })
}

export function useFaturasCartao(mes?: number, ano?: number) {
  const supabase = createClient()
  const atual = getCurrentMonthYear()
  const m = mes ?? atual.mes
  const a = ano ?? atual.ano

  return useQuery({
    queryKey: ['faturas-cartao', m, a],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('faturas_cartao')
        .select(`
          id, usuario_id, cartao_id, mes, ano, valor_total, valor_pago, status,
          vencimento, fechamento, created_at, updated_at,
          cartao:cartoes_credito(id, nome, bandeira, limite_total, cor)
        `)
        .eq('mes', m)
        .eq('ano', a)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as FaturaCartao[]
    },
    staleTime: 30_000,
  })
}

export function useAdicionarCartao() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: AdicionarCartaoInput) => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Sua sessão expirou. Faça login novamente para cadastrar o cartão.')
      }

      const { data, error } = await supabase
        .from('cartoes_credito')
        .insert({
          usuario_id: authData.user.id,
          nome: input.nome.trim(),
          bandeira: input.bandeira,
          limite_total: input.limiteTotal,
          dia_fechamento: input.diaFechamento,
          dia_vencimento: input.diaVencimento,
          cor: input.cor,
          ativo: true,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        throw new Error('Não foi possível cadastrar o cartão. Verifique os dados e tente novamente.')
      }

      return data as CartaoCredito
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cartoes-credito'] })
    },
  })
}

