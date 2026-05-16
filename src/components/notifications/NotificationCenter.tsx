'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'
import type { FinNotification, FinNotificationPriority, FinNotificationType } from '@/lib/notifications'

export type EnrichedNotification = FinNotification & { read: boolean }

const TYPE_LABEL: Record<FinNotificationType, string> = {
  bill: 'Contas',
  budget: 'Orçamento',
  card: 'Cartões',
  goal: 'Metas',
  cashflow: 'Caixa',
  health: 'FinHealth',
  import: 'Importação',
  insight: 'Insight',
}

const PRIORITY_LABEL: Record<FinNotificationPriority, string> = {
  critical: 'Crítico',
  high: 'Importante',
  medium: 'Atenção',
  low: 'Informativo',
}

export const NOTIFICATION_FILTERS: Array<{ value: 'all' | FinNotificationType; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'bill', label: 'Contas' },
  { value: 'budget', label: 'Orçamento' },
  { value: 'card', label: 'Cartões' },
  { value: 'goal', label: 'Metas' },
  { value: 'health', label: 'FinHealth' },
  { value: 'import', label: 'Importações' },
]

function priorityClass(priority: FinNotificationPriority) {
  if (priority === 'critical') return 'border-red-500/20 bg-red-500/[0.045]'
  if (priority === 'high') return 'border-amber-500/20 bg-amber-500/[0.04]'
  if (priority === 'medium') return 'border-cyan-500/15 bg-cyan-500/[0.035]'
  return 'border-[var(--card-border)] bg-[var(--surface)]'
}

export function NotificationItem({
  notification,
  onRead,
  onDismiss,
  compact = false,
}: {
  notification: EnrichedNotification
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  compact?: boolean
}) {
  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group rounded-3xl border p-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_42px_rgba(15,23,42,0.08)]',
        priorityClass(notification.priority),
        notification.read && 'opacity-65',
        !compact && 'p-4',
      )}
    >
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ background: `${notification.color}16` }}
        >
          <Icon name={notification.icon} className="text-lg" style={{ color: notification.color }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            {!notification.read && <span className="h-2 w-2 rounded-full bg-[var(--cyan)] shadow-[0_0_0_4px_rgba(6,182,212,0.10)]" />}
            <Badge variant={notification.priority === 'critical' ? 'danger' : notification.priority === 'high' ? 'warning' : 'default'}>
              {PRIORITY_LABEL[notification.priority]}
            </Badge>
            <span className="text-[11px] font-medium text-[var(--text-subtle)]">{TYPE_LABEL[notification.type]}</span>
            {notification.source === 'mock' && <span className="text-[10px] text-[var(--text-subtle)]">demo</span>}
          </div>

          <p className="text-sm font-semibold text-[var(--text-primary)]">{notification.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">{notification.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {notification.meta && (
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)]">
                {notification.meta}
              </span>
            )}
            {notification.amount !== undefined && (
              <span className="rounded-full bg-[var(--surface-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notification.amount)}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
          {!notification.read && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                onRead(notification.id)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--cyan)]"
              title="Marcar como lida"
            >
              <Icon name={ICONS.action.check} className="text-sm" />
            </button>
          )}
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              onDismiss(notification.id)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[var(--text-subtle)] hover:bg-red-500/10 hover:text-red-500"
            title="Limpar notificação"
          >
            <Icon name={ICONS.action.close} className="text-sm" />
          </button>
        </div>
      </div>
    </motion.div>
  )

  if (!notification.href) return content

  return (
    <Link href={notification.href} onClick={() => onRead(notification.id)}>
      {content}
    </Link>
  )
}

export function NotificationList({
  notifications,
  onRead,
  onDismiss,
  compact = false,
}: {
  notifications: EnrichedNotification[]
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  compact?: boolean
}) {
  if (notifications.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-[var(--cyan)]">
          <Icon name={ICONS.status.notification} className="text-2xl" />
        </div>
        <p className="font-semibold text-[var(--text-primary)]">Tudo limpo por aqui</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-muted)]">
          Quando houver vencimentos, alertas ou insights financeiros, eles aparecem aqui com prioridade clara.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRead={onRead}
          onDismiss={onDismiss}
          compact={compact}
        />
      ))}
    </div>
  )
}

export function NotificationPanel({
  notifications,
  unreadCount,
  criticalCount,
  onRead,
  onDismiss,
  onMarkAll,
  onClearAll,
}: {
  notifications: EnrichedNotification[]
  unreadCount: number
  criticalCount: number
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  onMarkAll: () => void
  onClearAll: () => void
}) {
  const visible = notifications.slice(0, 5)

  return (
    <Card className="relative z-[10000] flex h-full w-full flex-col overflow-hidden rounded-t-[var(--radius-sheet)] bg-[var(--surface)] p-0 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:h-auto sm:w-[min(92vw,420px)] sm:rounded-[var(--radius-card)]">
      <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-[var(--text-subtle)]/30 sm:hidden" />
      <div className="shrink-0 border-b border-[var(--card-border)] bg-[var(--surface-glass)] p-4 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Central inteligente</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {unreadCount > 0 ? `${unreadCount} não lida(s)` : 'Nenhuma pendência não lida'}
              {criticalCount > 0 ? ` • ${criticalCount} crítica(s)` : ''}
            </p>
          </div>
          <Badge variant={criticalCount > 0 ? 'danger' : unreadCount > 0 ? 'cyan' : 'default'}>
            {criticalCount > 0 ? 'Ação agora' : unreadCount > 0 ? 'Novas' : 'Em dia'}
          </Badge>
        </div>
        <div className="mt-4 flex gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onMarkAll} className="flex-1">
            Marcar lidas
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClearAll} className="flex-1">
            Limpar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:max-h-[420px]">
        <NotificationList notifications={visible} onRead={onRead} onDismiss={onDismiss} compact />
      </div>

      <div className="shrink-0 border-t border-[var(--card-border)] p-3">
        <Link
          href="/dashboard/notificacoes"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[var(--surface-soft)] px-3 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--cyan-muted)]"
        >
          Ver central completa
          <Icon name={ICONS.action.next} className="text-sm text-[var(--text-subtle)]" />
        </Link>
      </div>
    </Card>
  )
}
