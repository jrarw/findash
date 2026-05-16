'use client'

import { FinancialOSHero, FinancialOSModuleGrid, InsightDeck } from '@/components/finance-os/FinancialOSViews'
import { Icon } from '@/components/ui/icon'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { ICONS } from '@/lib/iconography'

export default function InsightsPage() {
  const { data: os } = useFinancialOS()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <FinancialOSHero os={os} />

      <section className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <aside className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] lg:sticky lg:top-6 lg:self-start">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-500">
            <Icon name={ICONS.brand.ai} className="text-2xl" />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--text-primary)]">Central Cognitiva</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
            Uma leitura do sistema sobre o que está mudando no seu comportamento financeiro, com impacto no score e próxima ação.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-subtle)]">Perfil atual</p>
            <p className="mt-2 text-xl font-black text-[var(--text-primary)]">{os.profile.label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{os.profile.tone}</p>
          </div>
        </aside>

        <InsightDeck os={os} />
      </section>

      <FinancialOSModuleGrid />
    </div>
  )
}
