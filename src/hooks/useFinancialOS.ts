'use client'

import { useMemo } from 'react'
import { getCurrentMonthYear } from '@/lib/format'
import { buildFinancialOS } from '@/lib/finance/operating-system'
import { useCartoesCredito, useComprasCartao } from '@/hooks/useCartoes'
import { useContasPagarProximas } from '@/hooks/useContasPagar'
import { useFinHealth, useOrcamentos } from '@/hooks/useFinancas'
import { useFluxoDiario, useGastosPorCategoria, useResumoMes } from '@/hooks/useTransacoes'

export function useFinancialOS(mes?: number, ano?: number) {
  const current = getCurrentMonthYear()
  const selectedMonth = mes ?? current.mes
  const selectedYear = ano ?? current.ano

  const resumo = useResumoMes(selectedMonth, selectedYear)
  const fluxo = useFluxoDiario(selectedMonth, selectedYear)
  const categorias = useGastosPorCategoria(selectedMonth, selectedYear)
  const contasProximas = useContasPagarProximas(14)
  const orcamentos = useOrcamentos(selectedMonth, selectedYear)
  const cartoes = useCartoesCredito()
  const comprasCartao = useComprasCartao(selectedMonth, selectedYear)
  const health = useFinHealth(selectedMonth, selectedYear)

  const data = useMemo(() => buildFinancialOS({
    mes: selectedMonth,
    ano: selectedYear,
    resumo: resumo.data,
    fluxo: fluxo.data,
    categorias: categorias.data,
    contasProximas: contasProximas.data,
    orcamentos: orcamentos.data,
    cartoes: cartoes.data,
    comprasCartao: comprasCartao.data,
    health: health.data,
  }), [
    selectedMonth,
    selectedYear,
    resumo.data,
    fluxo.data,
    categorias.data,
    contasProximas.data,
    orcamentos.data,
    cartoes.data,
    comprasCartao.data,
    health.data,
  ])

  return {
    data,
    mes: selectedMonth,
    ano: selectedYear,
    isLoading: resumo.isLoading || fluxo.isLoading || categorias.isLoading || contasProximas.isLoading || orcamentos.isLoading || cartoes.isLoading || comprasCartao.isLoading || health.isLoading,
  }
}
