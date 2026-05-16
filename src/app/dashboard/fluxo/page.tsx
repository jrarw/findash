'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AnalysisInsightCard } from '@/components/fin-smart/AnalysisInsightCard'
import { Card } from '@/components/ui/card'
import { ChartEmptyOverlay } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatDateShort, getMonthEnd, getMonthStart, getTodaySaoPauloISO } from '@/lib/format'
import { ICONS } from '@/lib/iconography'
import { useFluxoPeriodo, useResumoPeriodo } from '@/hooks/useTransacoes'

type QuickRange = '7d' | '30d' | 'mes' | '90d'
type CompareMode = 'off' | 'periodo_anterior' | 'mes_anterior'
type Granularity = 'day' | 'week'

interface FlowPoint {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

interface ChartPoint {
  data: string
  label: string
  entradas: number
  saidas: number
  saldo: number
  liquido: number
  compareSaldo?: number
  compareLiquido?: number
}

const QUICK_RANGES: Array<{ key: QuickRange; label: string; hint: string }> = [
  { key: '7d', label: '7 dias', hint: 'ritmo curto' },
  { key: '30d', label: '30 dias', hint: 'tendência' },
  { key: 'mes', label: 'Este mês', hint: 'competência' },
  { key: '90d', label: '90 dias', hint: 'macro' },
]

const COMPARE_MODES: Array<{ key: CompareMode; label: string }> = [
  { key: 'off', label: 'Sem comparação' },
  { key: 'periodo_anterior', label: 'Período anterior' },
  { key: 'mes_anterior', label: 'Mês anterior' },
]

const FLOW_COLORS = {
  income: '#10B981',
  expense: '#F9735B',
  balance: '#06B6D4',
  compare: '#8B5CF6',
  warning: '#F59E0B',
}

const EMPTY_FLOW: FlowPoint[] = [
  { data: '2026-01-01', entradas: 0, saidas: 0, saldo: 0 },
  { data: '2026-01-08', entradas: 0, saidas: 0, saldo: 0 },
  { data: '2026-01-15', entradas: 0, saidas: 0, saldo: 0 },
  { data: '2026-01-22', entradas: 0, saidas: 0, saldo: 0 },
  { data: '2026-01-30', entradas: 0, saidas: 0, saldo: 0 },
]

const stagger = {
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10)
}

function parseISO(date: string) {
  return new Date(`${date}T12:00:00`)
}

function daysBetween(start: string, end: string) {
  const diff = parseISO(end).getTime() - parseISO(start).getTime()
  return Math.max(1, Math.round(diff / 86_400_000) + 1)
}

function resolveRange(quick: QuickRange) {
  const today = parseISO(getTodaySaoPauloISO())
  const mes = today.getMonth() + 1
  const ano = today.getFullYear()

  if (quick === 'mes') {
    return { start: getMonthStart(mes, ano), end: getMonthEnd(mes, ano), label: 'Este mês' }
  }

  const days = quick === '7d' ? 7 : quick === '30d' ? 30 : 90
  return { start: toISO(addDays(today, -(days - 1))), end: toISO(today), label: `${days} dias` }
}

function resolveCompareRange(mode: CompareMode, range: { start: string; end: string }) {
  if (mode === 'off') return null

  if (mode === 'mes_anterior') {
    const start = parseISO(range.start)
    const previousMonth = start.getMonth() === 0 ? 12 : start.getMonth()
    const year = start.getMonth() === 0 ? start.getFullYear() - 1 : start.getFullYear()
    return { start: getMonthStart(previousMonth, year), end: getMonthEnd(previousMonth, year) }
  }

  const days = daysBetween(range.start, range.end)
  const compareEnd = addDays(parseISO(range.start), -1)
  const compareStart = addDays(compareEnd, -(days - 1))
  return { start: toISO(compareStart), end: toISO(compareEnd) }
}

function formatDelta(current: number, previous?: number | null) {
  if (previous == null || previous === 0) return null
  return ((current - previous) / Math.abs(previous)) * 100
}

function bucketKey(date: string, granularity: Granularity) {
  if (granularity === 'day') return date
  const d = parseISO(date)
  const day = d.getDay()
  const monday = addDays(d, day === 0 ? -6 : 1 - day)
  return toISO(monday)
}

function bucketLabel(date: string, granularity: Granularity) {
  if (granularity === 'day') return date.slice(8)
  return `Sem. ${formatDateShort(date)}`
}

function aggregate(points: FlowPoint[], granularity: Granularity): ChartPoint[] {
  const map = new Map<string, ChartPoint>()
  points.forEach(point => {
    const key = bucketKey(point.data, granularity)
    const current = map.get(key) ?? {
      data: key,
      label: bucketLabel(key, granularity),
      entradas: 0,
      saidas: 0,
      saldo: 0,
      liquido: 0,
    }
    current.entradas += Number(point.entradas)
    current.saidas += Number(point.saidas)
    current.liquido += Number(point.entradas) - Number(point.saidas)
    current.saldo = Number(point.saldo)
    map.set(key, current)
  })

  return Array.from(map.values()).sort((a, b) => a.data.localeCompare(b.data))
}

function alignCompare(primary: ChartPoint[], compare: ChartPoint[] | null) {
  if (!compare?.length) return primary
  return primary.map((point, index) => ({
    ...point,
    compareSaldo: compare[index]?.saldo,
    compareLiquido: compare[index]?.liquido,
  }))
}

function TooltipBox({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{label}</p>
      <div className="space-y-1">
        {payload.map(item => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">{formatCurrencyBRL(Number(item.value))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  color,
  delta,
  deltaGoodWhenDown = false,
}: {
  label: string
  value: string
  hint: string
  icon: string
  color: string
  delta?: number | null
  deltaGoodWhenDown?: boolean
}) {
  const hasDelta = delta != null && Number.isFinite(delta)
  const isGood = hasDelta ? (deltaGoodWhenDown ? delta <= 0 : delta >= 0) : null

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-[var(--text-muted)]">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl" style={{ background: `${color}14` }}>
          <Icon name={icon} className="text-lg" style={{ color }} />
        </div>
      </div>
      <p className="text-xl font-bold text-[var(--text-primary)]">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs leading-relaxed text-[var(--text-muted)]">{hint}</p>
        {hasDelta && (
          <span className={cn(
            'rounded-full px-2 py-1 text-[11px] font-black',
            isGood ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-500',
          )}>
            {delta > 0 ? '+' : ''}{Math.round(delta)}%
          </span>
        )}
      </div>
    </Card>
  )
}

function RhythmBar({ point, max }: { point: ChartPoint; max: number }) {
  const pressure = max > 0 ? Math.min(100, (point.saidas / max) * 100) : 0
  const income = max > 0 ? Math.min(100, (point.entradas / max) * 100) : 0
  const status = point.liquido >= 0 ? 'respirou' : 'pressionou'

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-bold text-[var(--text-primary)]">{point.label}</p>
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.14em]', point.liquido >= 0 ? 'text-emerald-500' : 'text-orange-500')}>
          {status}
        </span>
      </div>
      <div className="space-y-1.5">
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${income}%` }} />
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface-hover)]">
          <div className="h-full rounded-full bg-orange-500" style={{ width: `${pressure}%` }} />
        </div>
      </div>
      <p className="mt-2 text-[11px] text-[var(--text-muted)]">Líquido {formatCurrencyBRL(point.liquido)}</p>
    </div>
  )
}

export default function FluxoPage() {
  const [quick, setQuick] = useState<QuickRange>('mes')
  const [compareMode, setCompareMode] = useState<CompareMode>('periodo_anterior')
  const range = useMemo(() => resolveRange(quick), [quick])
  const compareRange = useMemo(() => resolveCompareRange(compareMode, range), [compareMode, range])
  const granularity: Granularity = daysBetween(range.start, range.end) > 45 ? 'week' : 'day'

  const { data: fluxo } = useFluxoPeriodo(range.start, range.end)
  const { data: resumo } = useResumoPeriodo(range.start, range.end)
  const { data: fluxoCompare } = useFluxoPeriodo(compareRange?.start ?? range.start, compareRange?.end ?? range.end)
  const { data: resumoCompare } = useResumoPeriodo(compareRange?.start ?? range.start, compareRange?.end ?? range.end)

  const rawFlow = fluxo?.length ? fluxo : EMPTY_FLOW
  const hasData = Boolean(fluxo?.length)
  const primarySeries = useMemo(() => aggregate(rawFlow, granularity), [rawFlow, granularity])
  const compareSeries = useMemo(() => compareRange && fluxoCompare?.length ? aggregate(fluxoCompare, granularity) : null, [compareRange, fluxoCompare, granularity])
  const chartData = useMemo(() => alignCompare(primarySeries, compareSeries), [primarySeries, compareSeries])

  const days = daysBetween(range.start, range.end)
  const entradas = Number(resumo?.entradas ?? 0)
  const saidas = Number(resumo?.saidas ?? 0)
  const saldo = Number(resumo?.saldo ?? 0)
  const dailyOut = saidas / days
  const dailyIn = entradas / days
  const burnRate = dailyIn > 0 ? (dailyOut / dailyIn) * 100 : 0
  const runRate30 = (dailyIn - dailyOut) * 30
  const projectedClosing = saldo + (dailyIn - dailyOut) * Math.max(0, 30 - Math.min(days, 30))
  const compareEntradas = resumoCompare?.entradas
  const compareSaidas = resumoCompare?.saidas
  const compareSaldo = resumoCompare?.saldo
  const bestBucket = [...chartData].sort((a, b) => b.liquido - a.liquido)[0]
  const worstBucket = [...chartData].sort((a, b) => a.liquido - b.liquido)[0]
  const maxMovement = Math.max(...chartData.map(point => Math.max(point.entradas, point.saidas)), 1)
  const pressureBuckets = chartData.filter(point => point.liquido < 0).length
  const positiveBuckets = chartData.filter(point => point.liquido >= 0).length
  const status = projectedClosing >= 0 && burnRate <= 90
    ? 'Fluxo saudável'
    : projectedClosing >= 0
      ? 'Fluxo atento'
      : 'Fluxo pressionado'
  const statusColor = status === 'Fluxo saudável' ? FLOW_COLORS.income : status === 'Fluxo atento' ? FLOW_COLORS.warning : FLOW_COLORS.expense

  const projectionData = [
    { label: 'Entradas', value: entradas },
    { label: 'Saídas', value: saidas },
    { label: 'Run-rate 30d', value: runRate30 },
    { label: 'Projeção', value: projectedClosing },
  ]

  return (
    <div className="app-page">
      <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-5">
        <motion.section variants={stagger.item}>
          <Card className="relative overflow-hidden p-4 md:p-6">
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
                    <Icon name={ICONS.nav.cashFlow} />
                    Cash intelligence
                  </div>
                  <h1 className="mt-4 text-2xl font-black leading-tight tracking-tight text-[var(--text-primary)] md:text-5xl">
                    Fluxo de caixa vivo.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-secondary)]">
                    Leia o ritmo do dinheiro por período, compare com a referência correta e entenda onde o caixa respira ou pressiona.
                  </p>
                </div>

                <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-4 shadow-[0_12px_32px_rgba(15,23,42,0.05)] backdrop-blur-xl">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">Status do fluxo</p>
                  <p className="mt-1 text-xl font-black" style={{ color: statusColor }}>{status}</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {range.start} → {range.end}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.85fr]">
                <div className="rounded-[1.35rem] border border-[var(--card-border)] bg-[var(--surface-glass)] p-2">
                  <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Periodicidade</p>
                  <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                    {QUICK_RANGES.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setQuick(item.key)}
                        className={cn(
                          'min-h-[64px] rounded-2xl px-3 py-3 text-left transition active:scale-[0.98]',
                          quick === item.key ? 'bg-cyan-500 text-white shadow-[0_12px_30px_rgba(6,182,212,0.22)]' : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        <span className="block text-sm font-black">{item.label}</span>
                        <span className={cn('mt-0.5 block text-[11px]', quick === item.key ? 'text-white/70' : 'text-[var(--text-subtle)]')}>{item.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-[var(--card-border)] bg-[var(--surface-glass)] p-2">
                  <p className="px-2 pb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Comparação</p>
                  <div className="grid gap-2">
                    {COMPARE_MODES.map(item => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setCompareMode(item.key)}
                        className={cn(
                          'flex min-h-[48px] items-center justify-between rounded-2xl px-3 py-2.5 text-sm font-bold transition active:scale-[0.98]',
                          compareMode === item.key ? 'bg-violet-500/12 text-[var(--text-primary)] ring-1 ring-violet-400/25' : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]',
                        )}
                      >
                        {item.label}
                        {compareMode === item.key && <Icon name={ICONS.action.check} className="text-violet-500" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={stagger.item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Entradas" value={formatCurrencyBRL(entradas)} hint={`Média ${formatCurrencyBRL(dailyIn)}/dia`} icon={ICONS.finance.income} color={FLOW_COLORS.income} delta={formatDelta(entradas, compareEntradas)} />
          <KpiCard label="Saídas" value={formatCurrencyBRL(saidas)} hint={`Média ${formatCurrencyBRL(dailyOut)}/dia`} icon={ICONS.finance.expense} color={FLOW_COLORS.expense} delta={formatDelta(saidas, compareSaidas)} deltaGoodWhenDown />
          <KpiCard label="Saldo" value={formatCurrencyBRL(saldo)} hint="Entradas menos saídas" icon={ICONS.finance.balance} color={saldo >= 0 ? FLOW_COLORS.balance : FLOW_COLORS.expense} delta={formatDelta(saldo, compareSaldo)} />
          <KpiCard label="Burn rate" value={`${Math.round(burnRate)}%`} hint="Saídas sobre entradas" icon={ICONS.finance.dailyBurn} color={FLOW_COLORS.compare} delta={formatDelta(burnRate, compareEntradas && compareEntradas > 0 ? ((compareSaidas ?? 0) / compareEntradas) * 100 : null)} deltaGoodWhenDown />
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.85fr]">
          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Fluxo por período',
                subtitle: `${range.start} → ${range.end}`,
                summary: 'A leitura combina movimento diário ou semanal, saldo acumulado e comparação para revelar a cadência real do caixa.',
                interpretation: projectedClosing >= 0 ? 'O ritmo atual sustenta um fechamento positivo, mas a qualidade depende da estabilidade entre entradas e saídas.' : 'A tendência atual pressiona o fechamento e pede redução de saídas ou antecipação de entradas.',
                metricLabel: 'Projeção de fechamento',
                metricValue: formatCurrencyBRL(projectedClosing),
                status: projectedClosing >= 0 ? 'good' : 'attention',
                color: FLOW_COLORS.balance,
                chart: chartData.map(item => ({ label: item.label, value: item.saldo })),
                details: [
                  `Melhor intervalo: ${bestBucket?.label ?? '--'} (${formatCurrencyBRL(bestBucket?.liquido ?? 0)}).`,
                  `Intervalo de maior pressão: ${worstBucket?.label ?? '--'} (${formatCurrencyBRL(worstBucket?.liquido ?? 0)}).`,
                  `Buckets positivos: ${positiveBuckets}; buckets pressionados: ${pressureBuckets}.`,
                ],
                actions: [
                  projectedClosing >= 0 ? 'Proteja a sobra projetada antes de liberar gasto variável.' : 'Use o pior intervalo como alvo para descobrir o comportamento que está drenando caixa.',
                ],
              }}
            >
              <Card className="p-4 md:p-5">
                <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-[var(--text-primary)]">Movimento alinhado</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {granularity === 'day' ? 'Visão diária' : 'Visão semanal'} · barras são entradas/saídas, linha é saldo acumulado
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-1 font-semibold text-emerald-600">Entradas</span>
                    <span className="rounded-full bg-orange-500/10 px-2 py-1 font-semibold text-orange-600">Saídas</span>
                    <span className="rounded-full bg-cyan-500/10 px-2 py-1 font-semibold text-cyan-700">Saldo</span>
                    {compareMode !== 'off' && <span className="rounded-full bg-violet-500/10 px-2 py-1 font-semibold text-violet-600">Comparativo</span>}
                  </div>
                </div>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="rgba(100,116,139,0.10)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: 'rgba(100,116,139,0.82)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<TooltipBox />} />
                      <Bar dataKey="entradas" name="Entradas" fill={FLOW_COLORS.income} opacity={0.78} radius={[6, 6, 0, 0]} />
                      <Bar dataKey="saidas" name="Saídas" fill={FLOW_COLORS.expense} opacity={0.66} radius={[6, 6, 0, 0]} />
                      <Area type="monotone" dataKey="saldo" name="Saldo" fill={FLOW_COLORS.balance} fillOpacity={0.10} stroke="transparent" />
                      <Line type="monotone" dataKey="saldo" name="Saldo" stroke={FLOW_COLORS.balance} strokeWidth={3} dot={false} />
                      {compareMode !== 'off' && <Line type="monotone" dataKey="compareSaldo" name="Saldo comparativo" stroke={FLOW_COLORS.compare} strokeWidth={2} strokeDasharray="5 5" dot={false} />}
                    </ComposedChart>
                  </ResponsiveContainer>
                  {!hasData && (
                    <ChartEmptyOverlay
                      title="Fluxo aguardando lançamentos"
                      description="A estrutura já está pronta para revelar ritmo, comparação e pressão quando os dados entrarem."
                    />
                  )}
                </div>
              </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item} className="space-y-5">
            <Card className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">Projeção inteligente</p>
                  <p className="text-xs text-[var(--text-muted)]">Run-rate do período selecionado</p>
                </div>
                <Icon name={ICONS.finance.projection} className="text-2xl text-violet-500" />
              </div>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={projectionData}>
                  <XAxis dataKey="label" tick={{ fill: 'rgba(100,116,139,0.82)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<TooltipBox />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {projectionData.map(item => (
                      <Cell key={item.label} fill={item.label === 'Entradas' ? FLOW_COLORS.income : item.label === 'Saídas' ? FLOW_COLORS.expense : item.value >= 0 ? FLOW_COLORS.balance : FLOW_COLORS.expense} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-4 md:p-5">
              <p className="text-sm font-bold text-[var(--text-primary)]">Ritmo do caixa</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Cada bloco mostra força de entrada e pressão de saída no intervalo.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {chartData.slice(-6).map(point => (
                  <RhythmBar key={point.data} point={point} max={maxMovement} />
                ))}
              </div>
            </Card>
          </motion.section>
        </div>

        <motion.section variants={stagger.item} className="grid gap-3 md:grid-cols-3">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10">
                <Icon name={ICONS.health.radar} className="text-lg text-cyan-700" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Leitura do caixa</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {pressureBuckets > positiveBuckets
                    ? 'Há mais intervalos pressionados do que positivos. O foco deve ser suavizar saídas recorrentes.'
                    : 'O caixa está encontrando mais pontos de respiro do que pressão, bom sinal de previsibilidade.'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10">
                <Icon name={ICONS.brand.ai} className="text-lg text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Modo comparação</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {compareMode === 'off'
                    ? 'Ative comparação para diferenciar melhora real de variação normal do período.'
                    : `Comparando contra ${compareMode === 'mes_anterior' ? 'mês anterior' : 'período anterior'} para mostrar aceleração ou desaceleração.`}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10">
                <Icon name={ICONS.finance.safeSpend} className="text-lg text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--text-primary)]">Próximo movimento</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {projectedClosing >= 0
                    ? 'Reserve a sobra projetada antes de aumentar consumo flexível.'
                    : 'Volte no intervalo mais negativo e corte a categoria que mais pesa naquele ponto.'}
                </p>
              </div>
            </div>
          </Card>
        </motion.section>
      </motion.div>
    </div>
  )
}
