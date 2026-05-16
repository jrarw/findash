'use client'

import { DecisionSimulator, FinancialOSHero } from '@/components/finance-os/FinancialOSViews'
import { Icon } from '@/components/ui/icon'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { ICONS } from '@/lib/iconography'

export default function SimuladorPage() {
  const { data: os } = useFinancialOS()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <FinancialOSHero os={os} />

      <section className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
          <Icon name={ICONS.finance.adjustment} />
          Simulador de Decisões
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">Teste o futuro antes de comprometer o presente.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          Reduzir gasto, aumentar renda, comprar parcelado, investir ou quitar dívida muda score, saldo e risco em tempo real.
        </p>
      </section>

      <DecisionSimulator os={os} />
    </div>
  )
}
