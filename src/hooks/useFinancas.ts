'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Categoria, CategoriaTipo, Meta, FinHealthScore, Orcamento, ObjetivoFinanceiro } from '@/types/database'
import { getCurrentMonthYear, getPreviousMonthYear } from '@/lib/format'
import { getCategoryIcon } from '@/lib/iconography'

// ---- CATEGORIAS ----
export function useCategorias(tipo?: 'entrada' | 'saida' | 'ambos') {
  const supabase = createClient()

  return useQuery({
    queryKey: ['categorias', tipo],
    queryFn: async () => {
      let q = supabase
        .from('categorias')
        .select('id, usuario_id, nome, tipo, icone, cor, ativa, ordem, created_at')
        .eq('ativa', true)
        .order('ordem')

      if (tipo) q = q.or(`tipo.eq.${tipo},tipo.eq.ambos`)

      const { data, error } = await q
      if (error) throw error
      return data as Categoria[]
    },
    staleTime: 3_600_000,
  })
}

export function useAdicionarCategoria() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      nome: string
      tipo: CategoriaTipo
      cor: string
      icone?: string
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Sua sessão expirou. Faça login novamente para criar categorias.')
      }

      const nome = input.nome.trim()
      if (!nome) throw new Error('Informe o nome da categoria.')

      const { data, error } = await supabase
        .from('categorias')
        .insert({
          usuario_id: user.id,
          nome,
          tipo: input.tipo,
          icone: input.icone ?? getCategoryIcon(nome),
          cor: input.cor,
          ativa: true,
          ordem: 999,
        })
        .select('id, usuario_id, nome, tipo, icone, cor, ativa, ordem, created_at')
        .single()

      if (error) {
        if (error.code === '23505') throw new Error('Essa categoria já existe.')
        throw new Error('Não foi possível criar a categoria. Tente novamente.')
      }

      return data as Categoria
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categorias'] })
      qc.invalidateQueries({ queryKey: ['gastos-categoria'] })
    },
  })
}

// ---- METAS ----
export function useMetas() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['metas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('metas')
        .select(`
          id, usuario_id, titulo, tipo, valor_alvo, valor_atual,
          data_inicio, data_fim, ativa, created_at,
          categoria:categorias(id, nome, icone, cor)
        `)
        .eq('ativa', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Meta[]
    },
    staleTime: 60_000,
  })
}

export function useAdicionarMeta() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (meta: Omit<Meta, 'id' | 'created_at' | 'categoria'>) => {
      const { data, error } = await supabase.from('metas').insert(meta).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['metas'] })
  })
}

// ---- ORÇAMENTOS ----
export function useOrcamentos(mes: number, ano: number) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['orcamentos', mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orcamentos')
        .select(`
          id, usuario_id, categoria_id, valor_limite, valor_base, valor_ajustado,
          sobra_transferida, transferir_sobra, mes, ano, created_at, updated_at,
          categoria:categorias(id, nome, tipo, icone, cor, ativa, ordem, created_at)
        `)
        .eq('mes', mes)
        .eq('ano', ano)

      if (error) throw error
      return data as Orcamento[]
    },
    staleTime: 30_000,
  })
}

interface SalvarOrcamentoInput {
  categoriaId: string
  valorBase: number
  valorAjustado: number
  transferirSobra: boolean
  mes: number
  ano: number
}

export function useSalvarOrcamento() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ categoriaId, valorBase, valorAjustado, transferirSobra, mes, ano }: SalvarOrcamentoInput) => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Sua sessão expirou. Faça login novamente para ajustar o orçamento.')
      }

      const { data, error } = await supabase
        .from('orcamentos')
        .upsert({
          usuario_id: authData.user.id,
          categoria_id: categoriaId,
          valor_limite: valorAjustado,
          valor_base: valorBase,
          valor_ajustado: valorAjustado,
          sobra_transferida: 0,
          transferir_sobra: transferirSobra,
          updated_at: new Date().toISOString(),
          mes,
          ano,
        }, { onConflict: 'usuario_id,categoria_id,mes,ano' })
        .select()
        .single()

      if (error) {
        throw new Error('Não foi possível salvar o limite dessa categoria. Tente novamente.')
      }

      return data
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['orcamentos', variables.mes, variables.ano] })
    },
  })
}

export function useCopiarOrcamentoMesAnterior() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({ mes, ano }: { mes: number; ano: number }) => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Sua sessão expirou. Faça login novamente para copiar o orçamento.')
      }

      const anterior = getPreviousMonthYear(mes, ano)
      const { data: anteriores, error: buscarError } = await supabase
        .from('orcamentos')
        .select('categoria_id, valor_base, valor_ajustado, valor_limite, sobra_transferida, transferir_sobra')
        .eq('mes', anterior.mes)
        .eq('ano', anterior.ano)

      if (buscarError) {
        throw new Error('Não foi possível buscar o orçamento do mês anterior.')
      }

      if (!anteriores || anteriores.length === 0) {
        throw new Error('Não encontramos orçamento no mês anterior para copiar.')
      }

      const payload = anteriores.map(orcamento => {
        const base = Number(orcamento.valor_base ?? orcamento.valor_limite ?? 0)
        const ajustado = Number(orcamento.valor_ajustado ?? orcamento.valor_limite ?? base)
        const sobra = orcamento.transferir_sobra ? Number(orcamento.sobra_transferida ?? 0) : 0

        return {
          usuario_id: authData.user.id,
          categoria_id: orcamento.categoria_id,
          valor_limite: ajustado + sobra,
          valor_base: base,
          valor_ajustado: ajustado + sobra,
          sobra_transferida: sobra,
          transferir_sobra: Boolean(orcamento.transferir_sobra),
          mes,
          ano,
          updated_at: new Date().toISOString(),
        }
      })

      const { error } = await supabase
        .from('orcamentos')
        .upsert(payload, { onConflict: 'usuario_id,categoria_id,mes,ano' })

      if (error) {
        throw new Error('Não foi possível copiar o orçamento do mês anterior. Tente novamente.')
      }

      return payload.length
    },
    onSuccess: (_count, variables) => {
      qc.invalidateQueries({ queryKey: ['orcamentos', variables.mes, variables.ano] })
    },
  })
}

// ---- FIN HEALTH ----
export function useFinHealth(mes?: number, ano?: number) {
  const supabase = createClient()
  const { mes: mesPadrao, ano: anoPadrao } = getCurrentMonthYear()
  const m = mes ?? mesPadrao
  const a = ano ?? anoPadrao

  return useQuery({
    queryKey: ['fin-health', m, a],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_health_scores')
        .select('*')
        .eq('mes', m)
        .eq('ano', a)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as FinHealthScore | null
    },
    staleTime: 600_000,
  })
}

export function useFinHealthHistorico() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['fin-health-historico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fin_health_scores')
        .select('score_geral, mes, ano, created_at')
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(12)

      if (error) throw error
      return (data as Pick<FinHealthScore, 'score_geral' | 'mes' | 'ano' | 'created_at'>[]).reverse()
    },
    staleTime: 600_000,
  })
}

// ---- CONTAS BANCÁRIAS ----
export function useContas() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['contas-bancarias'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contas')
        .select('id, nome, tipo, banco, cor, icone, saldo_inicial, ativa, created_at')
        .eq('ativa', true)
        .order('created_at')

      if (error) throw error
      return data
    },
    staleTime: 3_600_000,
  })
}

// ---- USUÁRIO ----
export function useUsuario() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['usuario'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, role, plano, objetivo, renda_mensal_estimada, onboarding_concluido, ultimo_acesso, created_at')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    },
    staleTime: 300_000,
  })
}

export function useAtualizarPerfil() {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      nome: string
      objetivo: ObjetivoFinanceiro | null
      rendaMensalEstimada: number | null
    }) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error('Sua sessão expirou. Faça login novamente para atualizar o perfil.')
      }

      const { data, error } = await supabase
        .from('usuarios')
        .update({
          nome: input.nome.trim(),
          objetivo: input.objetivo,
          renda_mensal_estimada: input.rendaMensalEstimada,
        })
        .eq('id', user.id)
        .select('id, nome, email, role, plano, objetivo, renda_mensal_estimada, onboarding_concluido, ultimo_acesso, created_at')
        .single()

      if (error) {
        throw new Error('Não foi possível atualizar seu perfil. Tente novamente.')
      }

      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuario'] })
    },
  })
}
