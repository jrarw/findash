'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { getTodaySaoPauloISO } from '@/lib/format'
import { getAccountTypeIcon } from '@/lib/iconography'
import type { ContaTipo, ObjetivoFinanceiro } from '@/types/database'

type SupabaseMutationError = {
  code?: string
  message?: string
  details?: string
  hint?: string
}

export interface OnboardingPayload {
  nome: string
  objetivo: ObjetivoFinanceiro
  conta: {
    nome: string
    tipo: ContaTipo
    saldoInicial: number
  }
  rendaMensalEstimada: number
  meta: {
    titulo: string
    valorAlvo: number
  }
}

function getOnboardingDatabaseMessage(error: SupabaseMutationError) {
  const detail = [error.code, error.message, error.details, error.hint].filter(Boolean).join(' | ')

  if (error.code === '42703') {
    return 'O banco ainda não tem os campos do onboarding. Execute a migration 003_onboarding.sql no Supabase.'
  }

  if (error.code === '42P17' || error.message?.toLowerCase().includes('infinite recursion')) {
    return 'As policies de segurança do banco precisam ser atualizadas. Execute a migration 004_fix_rls_policies.sql no Supabase.'
  }

  if (error.message?.toLowerCase().includes('row-level security')) {
    return 'O Supabase bloqueou a gravação por RLS. Execute a migration 004_fix_rls_policies.sql no Supabase.'
  }

  return `Não foi possível salvar seus dados iniciais. Erro Supabase: ${detail || 'sem detalhes retornados'}`
}

export function useConcluirOnboarding() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: OnboardingPayload) => {
      const { data: authData, error: authError } = await supabase.auth.getUser()

      if (authError || !authData.user) {
        throw new Error('Sua sessão expirou. Faça login novamente para concluir o onboarding.')
      }

      const usuarioId = authData.user.id
      const email = authData.user.email ?? ''
      const hoje = getTodaySaoPauloISO()
      const usuarioPayload = {
        nome: payload.nome.trim(),
        email,
        role: 'user' as const,
        plano: 'free' as const,
        objetivo: payload.objetivo,
        renda_mensal_estimada: payload.rendaMensalEstimada,
        onboarding_concluido: false,
      }

      const { data: usuarioExistente, error: buscarUsuarioError } = await supabase
        .from('usuarios')
        .select('id')
        .eq('id', usuarioId)
        .maybeSingle()

      if (buscarUsuarioError) {
        throw new Error(getOnboardingDatabaseMessage(buscarUsuarioError))
      }

      const { error: usuarioError } = usuarioExistente
        ? await supabase
          .from('usuarios')
          .update(usuarioPayload)
          .eq('id', usuarioId)
        : await supabase
          .from('usuarios')
          .insert({
            id: usuarioId,
            ...usuarioPayload,
          })

      if (usuarioError) {
        throw new Error(getOnboardingDatabaseMessage(usuarioError))
      }

      const { error: contaError } = await supabase
        .from('contas')
        .insert({
          usuario_id: usuarioId,
          nome: payload.conta.nome.trim(),
          tipo: payload.conta.tipo,
          banco: null,
          cor: '#00E5FF',
          icone: getAccountTypeIcon(payload.conta.tipo),
          saldo_inicial: payload.conta.saldoInicial,
          ativa: true,
        })

      if (contaError) {
        throw new Error('Não foi possível criar sua primeira conta. Revise os dados e tente de novo.')
      }

      const { error: metaError } = await supabase
        .from('metas')
        .insert({
          usuario_id: usuarioId,
          titulo: payload.meta.titulo.trim(),
          tipo: 'economia',
          valor_alvo: payload.meta.valorAlvo,
          valor_atual: 0,
          data_inicio: hoje,
          data_fim: null,
          categoria_id: null,
          ativa: true,
        })

      if (metaError) {
        throw new Error('Não foi possível criar sua meta inicial. Tente novamente.')
      }

      const { error: concluirError } = await supabase
        .from('usuarios')
        .update({
          onboarding_concluido: true,
          objetivo: payload.objetivo,
          renda_mensal_estimada: payload.rendaMensalEstimada,
          nome: payload.nome.trim(),
        })
        .eq('id', usuarioId)

      if (concluirError) {
        throw new Error('Não foi possível concluir o onboarding. Tente novamente.')
      }

      return { usuarioId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuario'] })
      queryClient.invalidateQueries({ queryKey: ['contas-bancarias'] })
      queryClient.invalidateQueries({ queryKey: ['metas'] })
    },
  })
}

