'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyDataState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { AnalysisInsightCard } from '@/components/fin-smart/AnalysisInsightCard'
import { useGastosPorCategoria } from '@/hooks/useTransacoes'
import { useAdicionarCategoria, useCategorias } from '@/hooks/useFinancas'
import { formatCurrencyBRL, getCurrentMonthYear, formatMonth } from '@/lib/format'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'
import type { CategoriaTipo } from '@/types/database'

const CATEGORY_PALETTE = ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#F9735B', '#3B82F6', '#64748B', '#EC4899']

const EMPTY_DONUT = [
  { categoria_id: 'empty', nome: 'Sem dados', total: 1, cor: 'rgba(100,116,139,0.16)', icone: ICONS.finance.category, percentual: 100, count: 0 },
]

const EMPTY_CATEGORIES = [
  { categoria_id: 'empty-1', nome: 'Alimentação', total: 0, percentual: 42, cor: CATEGORY_PALETTE[0], icone: ICONS.category.food, count: 0 },
  { categoria_id: 'empty-2', nome: 'Moradia', total: 0, percentual: 31, cor: CATEGORY_PALETTE[1], icone: ICONS.category.home, count: 0 },
  { categoria_id: 'empty-3', nome: 'Transporte', total: 0, percentual: 18, cor: CATEGORY_PALETTE[2], icone: ICONS.category.transport, count: 0 },
  { categoria_id: 'empty-4', nome: 'Lazer', total: 0, percentual: 9, cor: CATEGORY_PALETTE[3], icone: ICONS.category.leisure, count: 0 },
]

const stagger = {
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
}

function categoryColor(index: number, fallback?: string) {
  return fallback && fallback !== '#6B7280' ? fallback : CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}

function concentrationLabel(percentual: number) {
  if (percentual >= 50) return 'Muito concentrado'
  if (percentual >= 35) return 'Concentrado'
  if (percentual >= 20) return 'Equilibrado'
  return 'Distribuído'
}

function TooltipBox({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string; payload?: { nome?: string } }> }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <p className="mb-1 text-xs font-semibold text-[var(--text-primary)]">{item.payload?.nome ?? item.name}</p>
      <p className="text-xs text-[var(--text-muted)]">{formatCurrencyBRL(Number(item.value))}</p>
    </div>
  )
}

export default function CategoriasPage() {
  const { mes, ano } = getCurrentMonthYear()
  const { data: categorias, isLoading } = useGastosPorCategoria(mes, ano)
  const { data: categoriasConfiguradas } = useCategorias()
  const adicionarCategoria = useAdicionarCategoria()
  const [showForm, setShowForm] = useState(false)
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<CategoriaTipo>('saida')
  const [cor, setCor] = useState(CATEGORY_PALETTE[0])
  const [erro, setErro] = useState('')
  const [showConfigured, setShowConfigured] = useState(false)

  const total = categorias?.reduce((s, c) => s + c.total, 0) ?? 0
  const hasData = Boolean(categorias?.length)
  const listData = (hasData ? categorias! : EMPTY_CATEGORIES).map((cat, index) => ({
    ...cat,
    cor: categoryColor(index, cat.cor),
  }))
  const donutData = hasData ? listData.slice(0, 8) : EMPTY_DONUT
  const topCategory = listData[0]
  const activeCategories = hasData ? listData.length : 0
  const avgTicket = hasData
    ? total / Math.max(1, listData.reduce((sum, cat) => sum + (cat.count ?? 0), 0))
    : 0
  const topShare = topCategory?.percentual ?? 0
  const topThreeShare = listData.slice(0, 3).reduce((sum, cat) => sum + cat.percentual, 0)
  const barData = listData.slice(0, 7)

  async function handleCriarCategoria() {
    setErro('')
    try {
      await adicionarCategoria.mutateAsync({ nome, tipo, cor })
      setNome('')
      setTipo('saida')
      setCor(CATEGORY_PALETTE[0])
      setShowForm(false)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível criar a categoria.')
    }
  }

  return (
    <div className="app-page max-w-6xl">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
        <motion.section variants={stagger.item}>
          <Card className="relative overflow-hidden p-5 md:p-6">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="purple">Behavior map</Badge>
                <h1 className="mt-3 text-2xl font-black leading-tight tracking-tight text-[var(--text-primary)] md:text-4xl">
                  Categorias
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {formatMonth(mes, ano)} · entenda concentração, categorias dominantes e padrões de consumo.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">Concentração</p>
                <p className="mt-1 text-xl font-bold text-[var(--text-primary)]">{concentrationLabel(topShare)}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">{Math.round(topShare)}% em {topCategory?.nome ?? 'categoria líder'}</p>
              </div>
              <Button type="button" onClick={() => setShowForm(current => !current)} className="w-full md:w-auto">
                <Icon name={ICONS.action.add} className="text-sm" />
                Nova categoria
              </Button>
            </div>
          </Card>
        </motion.section>

        {showForm && (
          <motion.section variants={stagger.item}>
            <Card className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Criar categoria</p>
                  <p className="text-xs text-[var(--text-muted)]">Ela ficará disponível para lançamentos e importações futuras.</p>
                </div>
                <Icon name={ICONS.finance.category} className="text-2xl text-violet-500" />
              </div>

              <div className="grid gap-3 md:grid-cols-[1.2fr_0.7fr_1fr_auto] md:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Nome</span>
                  <input
                    value={nome}
                    onChange={event => setNome(event.target.value)}
                    className="min-h-[52px] w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none"
                    placeholder="Ex: Academia"
                    style={{ fontSize: '16px' }}
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Tipo</span>
                  <select
                    value={tipo}
                    onChange={event => setTipo(event.target.value as CategoriaTipo)}
                    className="min-h-[52px] w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none"
                    style={{ fontSize: '16px' }}
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                    <option value="ambos">Ambos</option>
                  </select>
                </label>

                <div>
                  <span className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cor</span>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_PALETTE.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCor(item)}
                        className={cn('h-9 w-9 rounded-full border-2 transition-transform hover:scale-105', cor === item ? 'border-[var(--text-primary)]' : 'border-transparent')}
                        style={{ background: item }}
                        aria-label={`Selecionar cor ${item}`}
                      />
                    ))}
                  </div>
                </div>

                <Button type="button" loading={adicionarCategoria.isPending} onClick={handleCriarCategoria}>
                  Criar
                </Button>
              </div>

              {erro && <p className="mt-3 rounded-2xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-600">{erro}</p>}
            </Card>
          </motion.section>
        )}

        {categoriasConfiguradas && categoriasConfiguradas.length > 0 && (
          <motion.section variants={stagger.item}>
            <Card className="overflow-hidden p-0">
              <button
                type="button"
                onClick={() => setShowConfigured(current => !current)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-[var(--surface-hover)] md:p-5"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name={ICONS.finance.category} className="text-lg text-violet-500" />
                    <p className="text-sm font-bold text-[var(--text-primary)]">Categorias configuradas</p>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {categoriasConfiguradas.length} ativa(s) · clique para {showConfigured ? 'recolher' : 'ver detalhes'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden -space-x-2 sm:flex">
                    {categoriasConfiguradas.slice(0, 8).map(categoria => (
                      <span
                        key={categoria.id}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--card-bg)] bg-[var(--surface-soft)] shadow-sm"
                        title={categoria.nome}
                      >
                        <Icon name={categoria.icone} className="text-sm" style={{ color: categoria.cor }} />
                      </span>
                    ))}
                  </div>
                  <Badge variant="default">{categoriasConfiguradas.length}</Badge>
                  <Icon name={ICONS.action.expand} className={cn('text-sm text-[var(--text-subtle)] transition-transform', showConfigured && 'rotate-180')} />
                </div>
              </button>

              {showConfigured && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="border-t border-[var(--card-border)] p-4 md:p-5"
                >
                  <div className="flex flex-wrap gap-2">
                    {categoriasConfiguradas.map(categoria => (
                      <span key={categoria.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)]">
                        <Icon name={categoria.icone} className="text-sm" style={{ color: categoria.cor }} />
                        {categoria.nome}
                        <span className="text-xs text-[var(--text-subtle)]">{categoria.tipo}</span>
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.section>
        )}

        <motion.section variants={stagger.item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)]">Total categorizado</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyBRL(total)}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Saídas efetivadas no mês</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)]">Categorias ativas</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{activeCategories}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Com despesas registradas</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)]">Top 3 concentram</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{Math.round(topThreeShare)}%</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Leitura de dependência de hábitos</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-[var(--text-muted)]">Ticket médio</p>
            <p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{formatCurrencyBRL(avgTicket)}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Média por lançamento</p>
          </Card>
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Mapa de categorias',
                subtitle: 'Distribuição do consumo',
                summary: 'O donut mostra quais áreas concentram as saídas do mês sem usar escala de score. Cada cor representa uma categoria, não uma avaliação de saúde.',
                interpretation: hasData ? `${topCategory?.nome} lidera com ${Math.round(topShare)}% das saídas.` : 'Ainda não há dados reais suficientes para leitura.',
                metricLabel: 'Total analisado',
                metricValue: formatCurrencyBRL(total),
                status: topShare >= 45 ? 'attention' : 'neutral',
                color: topCategory?.cor ?? CATEGORY_PALETTE[0],
                chart: listData.slice(0, 6).map(cat => ({ label: cat.nome.slice(0, 8), value: cat.total })),
                details: listData.slice(0, 5).map(cat => `${cat.nome}: ${formatCurrencyBRL(cat.total)} (${Math.round(cat.percentual)}%).`),
                actions: [
                  topShare >= 45 ? 'Investigue se a categoria líder é necessidade, sazonalidade ou vazamento de consumo.' : 'A distribuição está menos concentrada; acompanhe se alguma categoria começa a acelerar.',
                ],
              }}
            >
              <Card className="p-4 md:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">Distribuição visual</p>
                    <p className="text-xs text-[var(--text-muted)]">Cores categóricas, não escala FinHealth</p>
                  </div>
                  <Icon name={ICONS.finance.category} className="text-2xl text-violet-500" />
                </div>
                <div className="relative flex flex-col items-center">
                  <ResponsiveContainer width="100%" height={270}>
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%"
                        cy="50%"
                        innerRadius={78}
                        outerRadius={112}
                        dataKey="total"
                        nameKey="nome"
                        paddingAngle={3}
                        cornerRadius={7}
                      >
                        {donutData.map((cat, index) => (
                          <Cell
                            key={cat.categoria_id}
                            fill={hasData ? cat.cor : categoryColor(index)}
                            opacity={hasData ? 0.92 : 0.45}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<TooltipBox />} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute top-[106px] text-center">
                    <p className="text-xs text-[var(--text-muted)]">Total</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">{formatCurrencyBRL(total)}</p>
                  </div>
                  {!hasData && !isLoading && (
                    <p className="mt-2 max-w-xs text-center text-xs text-[var(--text-muted)]">
                      O gráfico permanece pronto; suas despesas vão preencher as fatias automaticamente.
                    </p>
                  )}
                </div>
              </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item}>
            <Card className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Ranking de impacto</p>
                  <p className="text-xs text-[var(--text-muted)]">Quanto cada categoria pesa no mês</p>
                </div>
                <Icon name={ICONS.chart.bar} className="text-2xl text-cyan-700" />
              </div>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={barData} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="nome" type="category" width={92} tick={{ fill: 'rgba(100,116,139,0.9)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]}>
                    {barData.map(cat => <Cell key={cat.categoria_id} fill={cat.cor} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.section>
        </div>

        <motion.section variants={stagger.item}>
          <Card className="p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Detalhamento por categoria</p>
                <p className="text-xs text-[var(--text-muted)]">Volume, participação e frequência estimada</p>
              </div>
              <Badge variant={topShare >= 45 ? 'warning' : 'cyan'}>{concentrationLabel(topShare)}</Badge>
            </div>

            <div className="space-y-3">
              {isLoading && [1, 2, 3, 4, 5].map(i => (
                <Card key={i} className="p-4">
                  <div className="skeleton h-4 w-full rounded" />
                </Card>
              ))}

              {listData.map((cat, index) => (
                <Card key={cat.categoria_id} className={cn('p-4', !hasData && 'opacity-55')}>
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `${cat.cor}16` }}
                    >
                      <Icon name={cat.icone} className="text-lg" style={{ color: cat.cor }} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{cat.nome}</p>
                          <p className="text-xs text-[var(--text-muted)]">
                            #{index + 1} no ranking · {cat.count ?? 0} lançamento(s)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--text-primary)]">{formatCurrencyBRL(cat.total)}</p>
                          <p className="text-xs font-semibold" style={{ color: cat.cor }}>{Math.round(cat.percentual)}%</p>
                        </div>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: cat.cor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(cat.percentual, 100)}%` }}
                          transition={{ duration: 0.7, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}

              {!isLoading && !hasData && (
                <EmptyDataState
                  icon={ICONS.finance.category}
                  title="Nenhum gasto registrado"
                  description="As categorias acima são placeholders para manter o painel vivo até os primeiros lançamentos."
                />
              )}
            </div>
          </Card>
        </motion.section>

        <motion.section variants={stagger.item} className="grid gap-3 md:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10">
                <Icon name={ICONS.health.radar} className="text-lg text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Leitura de concentração</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {topShare >= 45
                    ? 'Uma categoria domina o mês. Isso pode ser normal, mas merece investigação antes de virar padrão recorrente.'
                    : 'Os gastos estão mais distribuídos entre categorias, o que facilita ajustes sem sacrificar uma única área.'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10">
                <Icon name={ICONS.brand.ai} className="text-lg text-cyan-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Próximo movimento</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  Compare as três maiores categorias com o orçamento mensal. Se o top 3 passar de 70%, priorize limites nessas áreas.
                </p>
              </div>
            </div>
          </Card>
        </motion.section>
      </motion.div>
    </div>
  )
}
