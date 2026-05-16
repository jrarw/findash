'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ContaPagar } from '@/types/database'

export function useContasPagar() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contas-pagar'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`
          id, usuario_id, categoria_id, nome, valor, vencimento,
          tipo, status, recorrente, recorrencia_tipo, observacoes, created_at,
          categoria:categorias(id, nome, icone, cor)
        `)
        .order('vencimento')

      if (error) throw error
      return data as ContaPagar[]
    },
    staleTime: 30_000,
  })
}

export function useContasPagarProximas(dias = 7) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contas-pagar-proximas', dias],
    queryFn: async () => {
      const hoje = new Date()
      const limite = new Date(hoje)
      limite.setDate(limite.getDate() + dias)

      const { data, error } = await supabase
        .from('contas_pagar')
        .select(`id, nome, valor, vencimento, status, categoria:categorias(nome, icone, cor)`)
        .eq('status', 'pendente')
        .lte('vencimento', limite.toISOString().split('T')[0])
        .order('vencimento')

      if (error) throw error
      return data as ContaPagar[]
    },
    staleTime: 60_000,
  })
}

export function useMarcarPaga() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contas_pagar')
        .update({ status: 'pago' })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contas-pagar'] })
    }
  })
}

export function useAdicionarContaPagar() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (conta: Omit<ContaPagar, 'id' | 'created_at' | 'categoria'>) => {
      const { data, error } = await supabase.from('contas_pagar').insert(conta).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contas-pagar'] })
    }
  })
}
