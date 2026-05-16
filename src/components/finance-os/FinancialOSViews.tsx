'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Icon } from '@/components/ui/icon'
import { FinHealthRing } from '@/components/health/FinHealthRing'
import { ICONS } from '@/lib/iconography'
import type { CognitiveInsight, FinancialOS, SimulationInput } from '@/lib/finance/operating-system'

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function severityLabel(severity: CognitiveInsight['severity']) {
  const labels = {
    critical: 'Crítico',
    warning: 'Atenção',
    info: 'Observação',
    success: 'Evolução',
  }

  return labels[severity]
}

function severityClass(severity: CognitiveInsight['severity']) {
  if (severity === 'critical') return 'border-red-500/20 bg-red-500/10 text-red-500'
  if (severity === 'warning') return 'border-amber-500/20 bg-amber-500/10 text-amber-500'
  if (severity === 'success') return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
  return 'border-cyan-500/20 bg-cyan-500/10 text-cyan-500'
}

export function FinancialOSHero({ os }: { os: FinancialOS }) {
  const mainInsight = os.insights[0]

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="flex flex-col items-center rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface-glass)] p-6 text-center">
          <FinHealthRing score={os.health.score} size={188} strokeWidth={12} />
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-subtle)]">Fin Health Vivo</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">{os.health.label}</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Pressão {os.health.pressure}% · Sobrevida {os.health.survivalDays} dias · Perfil {os.profile.label}
            </p>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
            <Icon name={ICONS.brand.ai} />
            Financial OS
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--text-primary)] md:text-5xl">
            O sistema entendeu seu mês antes do mês terminar.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
            A leitura combina fluxo, categorias, orçamento, crédito, vencimentos e comportamento para transformar dados financeiros em direção prática.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MetricTile label="Fechamento provável" value={brl(os.health.projectedClosing)} icon={ICONS.finance.projection} />
            <MetricTile label="Perfil financeiro" value={os.profile.label} icon={ICONS.brand.user} />
            <MetricTile label="Insights ativos" value={String(os.insights.length)} icon={ICONS.health.focus} />
          </div>

          {mainInsight && (
            <div className="mt-5 rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-glass)] p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${mainInsight.color}18`, color: mainInsight.color }}>
                  <Icon name={mainInsight.icon} className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{mainInsight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{mainInsight.description}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function MetricTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--surface-glass)] p-4">
      <Icon name={icon} className="text-xl text-cyan-500" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">{label}</p>
      <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

export function FinancialOSModuleGrid() {
  const modules = [
    { href: '/dashboard/lancar', label: 'Lançar', desc: 'Registre entradas e saídas rapidamente.', icon: ICONS.action.add },
    { href: '/dashboard/extrato', label: 'Extrato', desc: 'Movimentações e histórico financeiro.', icon: ICONS.nav.statement },
    { href: '/dashboard/contas', label: 'Contas', desc: 'Vencimentos e contas a pagar.', icon: ICONS.nav.bills },
    { href: '/dashboard/health', label: 'Fin Health', desc: 'Score vivo, pilares, pressão e conquistas.', icon: ICONS.health.score },
    { href: '/dashboard/insights', label: 'Central Cognitiva', desc: 'Padrões detectados e ações recomendadas.', icon: ICONS.brand.ai },
    { href: '/dashboard/previsao', label: 'Previsão de Futuro', desc: 'Cenários, risco e fechamento provável.', icon: ICONS.health.forecast },
    { href: '/dashboard/vida', label: 'Mapa de Vida', desc: 'Áreas da vida e impacto no orçamento.', icon: ICONS.health.radar },
    { href: '/dashboard/timeline', label: 'Timeline', desc: 'Eventos, viradas e marcos financeiros.', icon: ICONS.health.timeline },
    { href: '/dashboard/simulador', label: 'Simulador', desc: 'Teste decisões antes de assumir impacto.', icon: ICONS.finance.adjustment },
  ]

  return (
    <div className="grid grid-cols-3 gap-2 md:gap-3 lg:grid-cols-2 xl:grid-cols-3">
      {modules.map(module => (
        <Link
          key={module.href}
          href={module.href}
          className="group flex min-h-[86px] flex-col items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] p-2 text-center shadow-[var(--card-shadow)] transition hover:-translate-y-0.5 hover:border-cyan-400/30 md:min-h-[unset] md:items-stretch md:justify-start md:rounded-[1.5rem] md:p-5 md:text-left"
        >
          <div className="flex items-center justify-center md:items-start md:justify-between md:gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-500 md:h-11 md:w-11 md:rounded-2xl">
              <Icon name={module.icon} className="text-lg md:text-xl" />
            </div>
            <Icon name={ICONS.action.arrowRight} className="hidden text-lg text-[var(--text-subtle)] transition group-hover:translate-x-1 group-hover:text-cyan-500 md:block" />
          </div>
          <h3 className="mt-2 text-[11px] font-black leading-tight text-[var(--text-primary)] md:mt-5 md:text-lg">{module.label}</h3>
          <p className="mt-2 hidden text-sm leading-6 text-[var(--text-muted)] md:block">{module.desc}</p>
        </Link>
      ))}
    </div>
  )
}

export function InsightDeck({ os }: { os: FinancialOS }) {
  return (
    <div className="grid gap-4">
      {os.insights.map((insight, index) => (
        <motion.article
          key={insight.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.04 }}
          className="rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${insight.color}18`, color: insight.color }}>
                <Icon name={insight.icon} className="text-2xl" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${severityClass(insight.severity)}`}>
                    {severityLabel(insight.severity)}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                    impacto {insight.scoreImpact > 0 ? '+' : ''}{insight.scoreImpact}
                  </span>
                </div>
                <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--text-primary)]">{insight.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{insight.description}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-4 md:max-w-xs">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Próxima ação</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text-primary)]">{insight.action}</p>
            </div>
          </div>
        </motion.article>
      ))}
    </div>
  )
}

export function FutureScenarios({ os }: { os: FinancialOS }) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {os.scenarios.map(scenario => (
        <article key={scenario.id} className="rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Cenário</p>
              <h2 className="mt-2 text-2xl font-black text-[var(--text-primary)]">{scenario.label}</h2>
            </div>
            <div className="rounded-2xl bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-500">{scenario.score}/100</div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{scenario.description}</p>
          <div className="mt-5 space-y-3">
            <ScenarioRow label="Saldo final" value={brl(scenario.projectedBalance)} />
            <ScenarioRow label="Gasto projetado" value={brl(scenario.projectedSpend)} />
            <ScenarioRow label="Tendência de sobra" value={brl(scenario.savingsTrend)} />
            <ScenarioRow label="Risco" value={`${scenario.risk}%`} />
          </div>
        </article>
      ))}
    </div>
  )
}

function ScenarioRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--surface-glass)] px-4 py-3">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="font-bold text-[var(--text-primary)]">{value}</span>
    </div>
  )
}

export function LifeMapView({ os }: { os: FinancialOS }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {os.lifeMap.map(area => (
        <article key={area.id} className="rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: `${area.color}18`, color: area.color }}>
                <Icon name={area.icon} className="text-2xl" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[var(--text-primary)]">{area.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">{brl(area.amount)} no mês</p>
              </div>
            </div>
            <span className="rounded-full bg-[var(--surface-glass)] px-3 py-1 text-xs font-bold text-[var(--text-muted)]">{Math.round(area.weight)}%</span>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-hover)]">
            <div className="h-full rounded-full" style={{ width: `${Math.min(area.weight, 100)}%`, backgroundColor: area.color }} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <ScenarioRow label="Impacto" value={`${Math.round(area.impact)}%`} />
            <ScenarioRow label="Risco" value={`${Math.round(area.risk)}%`} />
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--text-muted)]">{area.recommendation}</p>
        </article>
      ))}
    </div>
  )
}

export function TimelineView({ os }: { os: FinancialOS }) {
  return (
    <div className="relative space-y-4">
      {os.timeline.map((event, index) => (
        <article key={event.id} className="relative rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 pl-20 shadow-[var(--card-shadow)]">
          <div className="absolute left-5 top-5 flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${event.color}18`, color: event.color }}>
            <Icon name={event.icon} className="text-xl" />
          </div>
          {index < os.timeline.length - 1 && <div className="absolute left-10 top-16 h-[calc(100%-1rem)] w-px bg-[var(--card-border)]" />}
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-subtle)]">{event.label}</p>
          <h2 className="mt-2 text-xl font-black text-[var(--text-primary)]">{event.title}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{event.description}</p>
        </article>
      ))}
    </div>
  )
}

export function DecisionSimulator({ os }: { os: FinancialOS }) {
  const [input, setInput] = useState<SimulationInput>({
    cutExpense: 300,
    extraIncome: 0,
    bigPurchase: 0,
    installments: 1,
    monthlyInvestment: 0,
    debtPayment: 0,
  })
  const result = useMemo(() => os.simulate(input), [input, os])

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.85fr]">
      <div className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)]">
        <h2 className="text-2xl font-black text-[var(--text-primary)]">Simule uma decisão</h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">Ajuste cenários e veja o impacto estimado no seu Fin Health.</p>
        <div className="mt-6 space-y-5">
          <Slider label="Cortar gasto variável" value={input.cutExpense} max={2500} onChange={cutExpense => setInput(current => ({ ...current, cutExpense }))} />
          <Slider label="Aumentar renda" value={input.extraIncome} max={5000} onChange={extraIncome => setInput(current => ({ ...current, extraIncome }))} />
          <Slider label="Compra grande" value={input.bigPurchase} max={8000} onChange={bigPurchase => setInput(current => ({ ...current, bigPurchase }))} />
          <Slider label="Parcelas" value={input.installments} min={1} max={24} currency={false} onChange={installments => setInput(current => ({ ...current, installments }))} />
          <Slider label="Investir por mês" value={input.monthlyInvestment} max={3000} onChange={monthlyInvestment => setInput(current => ({ ...current, monthlyInvestment }))} />
          <Slider label="Quitar dívida" value={input.debtPayment} max={6000} onChange={debtPayment => setInput(current => ({ ...current, debtPayment }))} />
        </div>
      </div>

      <aside className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] lg:sticky lg:top-6 lg:self-start">
        <div className="flex flex-col items-center rounded-[1.5rem] bg-[var(--surface-glass)] p-6 text-center">
          <FinHealthRing score={result.score} size={160} strokeWidth={10} />
          <p className="mt-4 text-sm font-bold text-[var(--text-muted)]">
            {result.deltaScore >= 0 ? '+' : ''}{result.deltaScore} pontos no score
          </p>
        </div>
        <div className="mt-5 space-y-3">
          <ScenarioRow label="Saldo projetado" value={brl(result.projectedBalance)} />
          <ScenarioRow label="Impacto no saldo" value={brl(result.deltaBalance)} />
          <ScenarioRow label="Risco estimado" value={`${result.risk}%`} />
        </div>
        <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Recomendação</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-[var(--text-primary)]">{result.recommendation}</p>
        </div>
      </aside>
    </div>
  )
}

function Slider({
  label,
  value,
  min = 0,
  max,
  currency = true,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max: number
  currency?: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-[var(--text-primary)]">{label}</span>
        <span className="rounded-full bg-[var(--surface-glass)] px-3 py-1 text-xs font-black text-[var(--text-muted)]">
          {currency ? brl(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={currency ? 50 : 1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-500"
      />
    </label>
  )
}
