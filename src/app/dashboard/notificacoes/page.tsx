'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { NotificationList, NOTIFICATION_FILTERS } from '@/components/notifications/NotificationCenter'
import { useFinNotifications } from '@/hooks/useFinNotifications'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'
import type { FinNotificationType } from '@/lib/notifications'

const stagger = {
  container: { transition: { staggerChildren: 0.05 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } },
}

export default function NotificacoesPage() {
  const [filter, setFilter] = useState<'all' | FinNotificationType>('all')
  const {
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  } = useFinNotifications()

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter(notification => notification.type === filter)
  }, [filter, notifications])

  const grouped = useMemo(() => {
    const important = filtered.filter(notification => notification.priority === 'critical' || notification.priority === 'high')
    const regular = filtered.filter(notification => notification.priority !== 'critical' && notification.priority !== 'high')
    return { important, regular }
  }, [filtered])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
        <motion.section variants={stagger.item}>
          <Card className="relative overflow-hidden p-5 md:p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <Badge variant="cyan">Central inteligente</Badge>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                  Notificações financeiras
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  Alertas, vencimentos, metas e insights automáticos organizados por prioridade para você agir sem ruído.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" onClick={markAllAsRead}>
                  <Icon name={ICONS.action.check} className="text-sm" />
                  Marcar tudo como lido
                </Button>
                <Button type="button" variant="ghost" onClick={clearAll}>
                  <Icon name={ICONS.action.close} className="text-sm" />
                  Limpar central
                </Button>
              </div>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={stagger.item} className="grid gap-3 sm:grid-cols-3">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Não lidas</p>
              <Icon name={ICONS.status.notification} className="text-xl text-[var(--cyan)]" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{unreadCount}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Novos sinais para revisar</p>
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Críticas</p>
              <Icon name={ICONS.status.danger} className="text-xl text-red-500" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{criticalCount}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Pedem ação rápida</p>
          </Card>
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-[var(--text-muted)]">Total ativo</p>
              <Icon name={ICONS.health.radar} className="text-xl text-violet-500" />
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{notifications.length}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Inclui histórico recente</p>
          </Card>
        </motion.section>

        <motion.section variants={stagger.item}>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {NOTIFICATION_FILTERS.map(item => {
              const active = filter === item.value
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={cn(
                    'whitespace-nowrap rounded-full border px-3 py-2 text-sm font-semibold transition-all',
                    active
                      ? 'border-cyan-500/20 bg-cyan-500/10 text-cyan-700 shadow-[0_10px_24px_rgba(6,182,212,0.08)]'
                      : 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
                  )}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </motion.section>

        {grouped.important.length > 0 && (
          <motion.section variants={stagger.item}>
            <div className="mb-3 flex items-center gap-2">
              <Icon name={ICONS.status.warning} className="text-amber-500" />
              <p className="text-sm font-bold text-[var(--text-primary)]">Prioridade alta</p>
              <span className="text-xs text-[var(--text-muted)]">({grouped.important.length})</span>
            </div>
            <NotificationList notifications={grouped.important} onRead={markAsRead} onDismiss={dismiss} />
          </motion.section>
        )}

        <motion.section variants={stagger.item}>
          <div className="mb-3 flex items-center gap-2">
            <Icon name={ICONS.chart.dots} className="text-[var(--cyan)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">
              {grouped.important.length > 0 ? 'Outras notificações' : 'Histórico inteligente'}
            </p>
            <span className="text-xs text-[var(--text-muted)]">({grouped.regular.length})</span>
          </div>
          <NotificationList notifications={grouped.regular} onRead={markAsRead} onDismiss={dismiss} />
        </motion.section>
      </motion.div>
    </div>
  )
}
