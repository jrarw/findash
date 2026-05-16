'use client'

import { FinancialOSHero, TimelineView } from '@/components/finance-os/FinancialOSViews'
import { Icon } from '@/components/ui/icon'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { ICONS } from '@/lib/iconography'

export default function TimelineFinanceiraPage() {
  const { data: os } = useFinancialOS()

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6">
      <FinancialOSHero os={os} />

      <section className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
          <Icon name={ICONS.health.timeline} />
          Timeline Financeira
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">A história emocional do seu dinheiro.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          Viradas, riscos, padrões e marcos aparecem como uma linha do tempo viva para você entender não só quanto gastou, mas o que está acontecendo.
        </p>
      </section>

      <TimelineView os={os} />
    </div>
  )
}
