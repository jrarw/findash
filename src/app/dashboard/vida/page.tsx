'use client'

import { FinancialOSHero, LifeMapView } from '@/components/finance-os/FinancialOSViews'
import { Icon } from '@/components/ui/icon'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { ICONS } from '@/lib/iconography'

export default function VidaFinanceiraPage() {
  const { data: os } = useFinancialOS()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
      <FinancialOSHero os={os} />

      <section className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[var(--card-shadow)] md:p-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-primary)]">
          <Icon name={ICONS.health.radar} />
          Mapa de Vida Financeira
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)]">Cada área da vida tem um peso no seu futuro.</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-muted)]">
          O mapa traduz categorias em áreas humanas: moradia, alimentação, transporte, lazer, saúde, assinaturas, dívidas e investimentos.
        </p>
      </section>

      <LifeMapView os={os} />
    </div>
  )
}
