'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '@/components/ui/icon'
import { useMetas } from '@/hooks/useFinancas'
import { formatCurrencyBRL, formatDate } from '@/lib/format'
import { ICONS, type IconClass } from '@/lib/iconography'
import type { Meta, Categoria } from '@/types/database'

const TIPO_CONFIG: Record<Meta['tipo'], { label: string; icon: IconClass; color: string }> = {
  economia: { label: 'Economia', icon: ICONS.finance.savings, color: '#22C55E' },
  limite_gasto: { label: 'Limite de gasto', icon: ICONS.finance.budget, color: '#EF4444' },
  saldo_minimo: { label: 'Saldo mínimo', icon: ICONS.finance.wallet, color: '#00E5FF' },
  reserva: { label: 'Reserva', icon: ICONS.finance.reserve, color: '#A855F7' },
  livre: { label: 'Livre', icon: ICONS.finance.goal, color: '#EAB308' },
}

function MetaCard({ meta }: { meta: Meta }) {
  const config = TIPO_CONFIG[meta.tipo]
  const pct = Math.min(100, (meta.valor_atual / meta.valor_alvo) * 100)
  const cat = meta.categoria as Categoria | null

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${config.color}15` }}
        >
          <Icon name={config.icon} className="text-lg" style={{ color: config.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{meta.titulo}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="default" className="text-[10px]">{config.label}</Badge>
            {cat && <span className="text-xs text-[var(--text-subtle)]">{cat.nome}</span>}
          </div>
        </div>
        <span className="text-sm font-bold" style={{ color: config.color }}>{Math.round(pct)}%</span>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="h-2 rounded-full bg-[var(--surface-muted)]">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: config.color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="grid gap-1 text-xs text-[var(--text-muted)] min-[420px]:flex min-[420px]:items-center min-[420px]:justify-between">
        <span>{formatCurrencyBRL(meta.valor_atual)} atingido</span>
        <span>Meta: {formatCurrencyBRL(meta.valor_alvo)}</span>
      </div>

      {meta.data_fim && (
        <p className="mt-1 text-xs text-[var(--text-subtle)]">Até {formatDate(meta.data_fim)}</p>
      )}
    </Card>
  )
}

export default function MetasPage() {
  const { data: metas, isLoading } = useMetas()

  return (
    <div className="app-page max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Metas</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Objetivos financeiros</p>
        </div>
        <Button size="sm" className="shrink-0">
          <Icon name={ICONS.action.add} className="text-sm" />
          Nova meta
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-4 w-48 rounded mb-3" />
              <div className="skeleton h-2 w-full rounded-full mb-2" />
              <div className="skeleton h-3 w-32 rounded" />
            </Card>
          ))}
        </div>
      ) : metas && metas.length > 0 ? (
        <div className="space-y-3">
          {metas.map(meta => <MetaCard key={meta.id} meta={meta} />)}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Icon name={ICONS.empty.noGoals} className="mb-3 text-3xl text-[var(--text-subtle)]" />
          <p className="mb-4 text-[var(--text-muted)]">Nenhuma meta definida</p>
          <Button size="lg" className="w-full sm:w-auto">Criar primeira meta</Button>
        </Card>
      )}
    </div>
  )
}
