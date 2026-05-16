'use client'

import { useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'
import MetasPage from '../metas/page'
import OrcamentoPage from '../orcamento/page'
import CategoriasPage from '../categorias/page'

type PlanningTab = 'metas' | 'orcamento' | 'categorias'

const PLANNING_TABS: Array<{ key: PlanningTab; label: string; icon: string }> = [
  { key: 'metas', label: 'Metas', icon: ICONS.nav.goals },
  { key: 'orcamento', label: 'Orçamento', icon: ICONS.nav.budget },
  { key: 'categorias', label: 'Categorias', icon: ICONS.nav.categories },
]

function resolveTab(value: string | null): PlanningTab {
  if (value === 'orcamento' || value === 'categorias') return value
  return 'metas'
}

export default function PlanejamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = resolveTab(searchParams.get('tab'))

  const content = useMemo(() => ({
    metas: <MetasPage />,
    orcamento: <OrcamentoPage />,
    categorias: <CategoriasPage />,
  }), [])

  function setTab(tab: PlanningTab) {
    router.replace(`/dashboard/planejamento?tab=${tab}`, { scroll: false })
  }

  return (
    <div className="app-page max-w-6xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="space-y-5"
      >
        <Card className="relative overflow-hidden p-4 md:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
              <Icon name={ICONS.nav.goals} />
              Planejamento
            </div>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text-primary)] md:text-4xl">
              Metas & Orçamento
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              Objetivos, orçamento e categorias agora vivem juntos, como uma camada única de intenção financeira.
            </p>
          </div>
        </Card>

        <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-2">
          {PLANNING_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setTab(tab.key)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition duration-150',
                activeTab === tab.key
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                  : 'text-[rgba(0,0,0,0.40)] hover:bg-[var(--surface)]/60',
              )}
            >
              <Icon name={tab.icon} className="text-base" />
              {tab.label}
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="-mx-4 md:-mx-6"
        >
          {content[activeTab]}
        </motion.div>
      </motion.div>
    </div>
  )
}
