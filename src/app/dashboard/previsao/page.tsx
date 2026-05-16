'use client'

import { FinancialOSHero, FutureScenarios } from '@/components/finance-os/FinancialOSViews'
import { Icon } from '@/components/ui/icon'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { ICONS } from '@/lib/iconography'

export default function PrevisaoPage() {
  const { data: os } = useFinancialOS()
  const probable = os.scenarios.find(scenario => scenario.id === 'probable') ?? os.scenarios[0]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <FinancialOSHero os={os} />

      <section className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
              <Icon name={ICONS.health.forecast} />
              Previsão de Futuro
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">Cenários antes da ansiedade chegar.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              O app compara o caminho provável com um cenário de proteção e um cenário de estresse para mostrar risco, saldo e score futuro.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Risco provável</p>
            <p className="mt-1 text-3xl font-black text-[var(--text-primary)]">{probable.risk}%</p>
          </div>
        </div>
      </section>

      <FutureScenarios os={os} />
    </div>
  )
}
