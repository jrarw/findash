'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { useCategorias, useCopiarOrcamentoMesAnterior, useOrcamentos, useSalvarOrcamento } from '@/hooks/useFinancas'
import { useGastosPorCategoria } from '@/hooks/useTransacoes'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatMonth, getCurrentMonthYear, parseCurrencyBRLInput } from '@/lib/format'
import { ICONS, type IconClass } from '@/lib/iconography'

function progressColor(percentual: number) {
  if (percentual >= 100) return '#EF4444'
  if (percentual >= 80) return '#F59E0B'
  return '#00E5FF'
}

function statusText(percentual: number) {
  if (percentual >= 100) return 'Estourado'
  if (percentual >= 80) return 'Atenção'
  return 'Saudável'
}

export default function OrcamentoPage() {
  const { mes, ano } = getCurrentMonthYear()
  const { data: categorias, isLoading: loadingCategorias } = useCategorias('saida')
  const { data: orcamentos, isLoading: loadingOrcamentos } = useOrcamentos(mes, ano)
  const { data: gastos, isLoading: loadingGastos } = useGastosPorCategoria(mes, ano)
  const salvarOrcamento = useSalvarOrcamento()
  const copiarMesAnterior = useCopiarOrcamentoMesAnterior()
  const [baseInputs, setBaseInputs] = useState<Record<string, string>>({})
  const [ajusteInputs, setAjusteInputs] = useState<Record<string, string>>({})
  const [transferirSobra, setTransferirSobra] = useState<Record<string, boolean>>({})
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [categoriaSalvando, setCategoriaSalvando] = useState<string | null>(null)

  const isLoading = loadingCategorias || loadingOrcamentos || loadingGastos

  const rows = useMemo(() => {
    const gastosMap = new Map((gastos ?? []).map(gasto => [gasto.categoria_id, gasto.total]))
    const orcamentosMap = new Map((orcamentos ?? []).map(orcamento => [orcamento.categoria_id, orcamento]))

    return (categorias ?? []).map(categoria => {
      const orcamento = orcamentosMap.get(categoria.id)
      const valorBase = Number(orcamento?.valor_base ?? orcamento?.valor_limite ?? 0)
      const valorAjustado = Number(orcamento?.valor_ajustado ?? orcamento?.valor_limite ?? valorBase)
      const gasto = Number(gastosMap.get(categoria.id) ?? 0)
      const sobraAtual = Math.max(valorAjustado - gasto, 0)
      const excesso = Math.max(gasto - valorAjustado, 0)
      const percentual = valorAjustado > 0 ? (gasto / valorAjustado) * 100 : 0

      return {
        categoria,
        orcamento,
        valorBase,
        valorAjustado,
        gasto,
        sobraAtual,
        excesso,
        percentual,
      }
    }).sort((a, b) => {
      if (b.percentual !== a.percentual) return b.percentual - a.percentual
      return b.gasto - a.gasto
    })
  }, [categorias, gastos, orcamentos])

  const totalBase = rows.reduce((sum, row) => sum + row.valorBase, 0)
  const totalAjustado = rows.reduce((sum, row) => sum + row.valorAjustado, 0)
  const totalGasto = rows.reduce((sum, row) => sum + row.gasto, 0)
  const totalSobra = Math.max(totalAjustado - totalGasto, 0)
  const totalExcesso = Math.max(totalGasto - totalAjustado, 0)
  const totalPercentual = totalAjustado > 0 ? (totalGasto / totalAjustado) * 100 : 0
  const categoriasEmAlerta = rows.filter(row => row.percentual >= 80).length

  async function handleSalvar(categoriaId: string, baseAtual: number, ajustadoAtual: number, transferirAtual: boolean) {
    const baseRaw = baseInputs[categoriaId] ?? String(baseAtual || '')
    const ajusteRaw = ajusteInputs[categoriaId] ?? String(ajustadoAtual || '')
    const valorBase = parseCurrencyBRLInput(baseRaw)
    const valorAjustado = parseCurrencyBRLInput(ajusteRaw)
    const deveTransferirSobra = transferirSobra[categoriaId] ?? transferirAtual

    if (!Number.isFinite(valorBase) || valorBase <= 0) {
      setErro('Informe um orçamento base válido maior que zero.')
      return
    }

    if (!Number.isFinite(valorAjustado) || valorAjustado <= 0) {
      setErro('Informe um orçamento ajustado válido maior que zero.')
      return
    }

    setErro('')
    setSucesso('')
    setCategoriaSalvando(categoriaId)

    try {
      await salvarOrcamento.mutateAsync({
        categoriaId,
        valorBase,
        valorAjustado,
        transferirSobra: deveTransferirSobra,
        mes,
        ano,
      })
      setBaseInputs(current => ({ ...current, [categoriaId]: '' }))
      setAjusteInputs(current => ({ ...current, [categoriaId]: '' }))
      setSucesso('Orçamento atualizado com sucesso.')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível salvar o orçamento. Tente novamente.')
    } finally {
      setCategoriaSalvando(null)
    }
  }

  async function handleCopiarMesAnterior() {
    setErro('')
    setSucesso('')

    try {
      const count = await copiarMesAnterior.mutateAsync({ mes, ano })
      setSucesso(`${count} categorias copiadas do mês anterior.`)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível copiar o orçamento anterior.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00E5FF]">Planejamento</p>
            <h1 className="text-2xl font-bold text-white">Orçamento mensal</h1>
            <p className="text-sm capitalize text-white/40">{formatMonth(mes, ano)}</p>
          </div>

          <Button
            type="button"
            variant="secondary"
            loading={copiarMesAnterior.isPending}
            onClick={handleCopiarMesAnterior}
            className="w-full md:w-auto"
          >
            <Icon name={ICONS.action.copy} className="text-base" />
            Copiar mês anterior
          </Button>
        </div>
      </motion.div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Utilização geral', value: `${Math.round(totalPercentual)}%`, icon: ICONS.health.pressure, color: progressColor(totalPercentual) },
          { label: 'Gasto filtrado', value: formatCurrencyBRL(totalGasto), icon: ICONS.finance.cash, color: '#00E5FF' },
          { label: 'Orçamento ajustado', value: formatCurrencyBRL(totalAjustado), icon: ICONS.finance.budgetAdjustment, color: '#A855F7' },
          { label: totalExcesso > 0 ? 'Excesso do mês' : 'Sobra prevista', value: formatCurrencyBRL(totalExcesso > 0 ? totalExcesso : totalSobra), icon: totalExcesso > 0 ? ICONS.finance.overBudget : ICONS.finance.savings, color: totalExcesso > 0 ? '#EF4444' : '#22C55E' },
        ].map((card: { label: string; value: string; icon: IconClass; color: string }) => (
          <Card key={card.label} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-white/40">{card.label}</p>
              <Icon name={card.icon} className="text-xl" style={{ color: card.color }} />
            </div>
            <p className="text-lg font-bold text-white">{card.value}</p>
          </Card>
        ))}
      </div>

      <Card className="mb-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">Overview do orçamento</p>
            <p className="text-xs text-white/40">
              {categoriasEmAlerta} categorias em alerta. Base: {formatCurrencyBRL(totalBase)}.
            </p>
          </div>
          <span className="rounded-full border border-white/[0.08] px-3 py-1 text-xs text-white/50">
            {statusText(totalPercentual)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: progressColor(totalPercentual) }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(totalPercentual, 100)}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </Card>

      {erro && (
        <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          <Icon name={ICONS.status.danger} className="mr-2" />
          {erro}
        </div>
      )}

      {sucesso && (
        <div className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          <Icon name={ICONS.status.success} className="mr-2" />
          {sucesso}
        </div>
      )}

      <div className="space-y-3">
        {isLoading && [1, 2, 3, 4].map(item => (
          <Card key={item} className="p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl skeleton" />
              <div className="flex-1">
                <div className="mb-2 h-4 w-40 rounded skeleton" />
                <div className="h-3 w-28 rounded skeleton" />
              </div>
            </div>
            <div className="h-2 rounded-full skeleton" />
          </Card>
        ))}

        {!isLoading && rows.map(row => {
          const color = progressColor(row.percentual)
          const isSaving = categoriaSalvando === row.categoria.id && salvarOrcamento.isPending
          const transferirAtual = transferirSobra[row.categoria.id] ?? row.orcamento?.transferir_sobra ?? false

          return (
            <motion.div
              key={row.categoria.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={cn(
                'p-4',
                row.percentual >= 100 && 'border-red-500/25 bg-red-500/[0.04]',
                row.percentual >= 80 && row.percentual < 100 && 'border-amber-500/25 bg-amber-500/[0.04]'
              )}>
                <div className="mb-4 flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${row.categoria.cor}20` }}
                  >
                    <Icon name={row.categoria.icone} className="text-lg" style={{ color: row.categoria.cor }} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-semibold text-white">{row.categoria.nome}</p>
                      <span className="text-xs font-semibold" style={{ color }}>
                        {statusText(row.percentual)}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      {formatCurrencyBRL(row.gasto)} usados de {row.valorAjustado > 0 ? formatCurrencyBRL(row.valorAjustado) : 'sem limite'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(row.percentual, 100)}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-white/35">
                    <span>{Math.round(row.percentual)}% utilizado</span>
                    <span>
                      {row.excesso > 0
                        ? `Excesso de ${formatCurrencyBRL(row.excesso)}`
                        : `Sobra de ${formatCurrencyBRL(row.sobraAtual)}`}
                    </span>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
                  <label className="block">
                    <span className="mb-1 block text-xs text-white/40">Base mensal</span>
                    <input
                      value={baseInputs[row.categoria.id] ?? ''}
                      onChange={event => setBaseInputs(current => ({ ...current, [row.categoria.id]: event.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white placeholder-white/25 focus:border-[#00E5FF]/50 focus:outline-none"
                      inputMode="decimal"
                      type="text"
                      placeholder={row.valorBase > 0 ? formatCurrencyBRL(row.valorBase) : 'Ex: 800,00'}
                      style={{ fontSize: '16px' }}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs text-white/40">Ajustado no mês</span>
                    <input
                      value={ajusteInputs[row.categoria.id] ?? ''}
                      onChange={event => setAjusteInputs(current => ({ ...current, [row.categoria.id]: event.target.value }))}
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white placeholder-white/25 focus:border-[#A855F7]/50 focus:outline-none"
                      inputMode="decimal"
                      type="text"
                      placeholder={row.valorAjustado > 0 ? formatCurrencyBRL(row.valorAjustado) : 'Ex: 950,00'}
                      style={{ fontSize: '16px' }}
                    />
                  </label>

                  <Button
                    type="button"
                    size="md"
                    loading={isSaving}
                    onClick={() => handleSalvar(row.categoria.id, row.valorBase, row.valorAjustado, Boolean(row.orcamento?.transferir_sobra))}
                    className="w-full md:w-auto"
                  >
                    Salvar
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => setTransferirSobra(current => ({ ...current, [row.categoria.id]: !transferirAtual }))}
                  className="mt-3 flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-left text-sm text-white/60"
                >
                  <span>Transferir sobra dessa categoria para o próximo mês</span>
                  <span className={cn(
                    'h-6 w-11 rounded-full p-0.5 transition-all',
                    transferirAtual ? 'bg-[#00E5FF]' : 'bg-white/[0.12]'
                  )}>
                    <span className={cn(
                      'block h-5 w-5 rounded-full bg-white transition-transform',
                      transferirAtual && 'translate-x-5'
                    )} />
                  </span>
                </button>
              </Card>
            </motion.div>
          )
        })}

        {!isLoading && rows.length === 0 && (
          <Card className="p-8 text-center">
            <Icon name={ICONS.empty.noBudget} className="mb-3 text-3xl text-white/20" />
            <p className="text-white/70 font-medium">Nenhuma categoria de saída encontrada</p>
            <p className="mt-1 text-sm text-white/40">
              Crie categorias de gasto para começar a planejar seu orçamento mensal.
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}

