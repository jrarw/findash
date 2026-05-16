'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
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

export const NOTIFICATION_FILTERS: Array<{ value: 'all' | FinNotificationType; label: string }> = [
  { value: 'all', label: 'Todas' },
  { value: 'bill', label: 'Contas' },
  { value: 'budget', label: 'Orçamento' },
  { value: 'card', label: 'Cartões' },
  { value: 'goal', label: 'Metas' },
  { value: 'health', label: 'FinHealth' },
  { value: 'import', label: 'Importações' },
]

const TYPE_STYLE: Record<FinNotificationType | 'default', { icon: string; color: string; bg: string }> = {
  bill: { icon: 'ti-calendar-due', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  budget: { icon: 'ti-alert-triangle', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  card: { icon: 'ti-bell', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  goal: { icon: 'ti-trophy', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  cashflow: { icon: 'ti-bell', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  health: { icon: 'ti-heart-rate-monitor', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  import: { icon: 'ti-bell', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  insight: { icon: 'ti-bell', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
  default: { icon: 'ti-bell', color: '#64748b', bg: 'rgba(100,116,139,0.12)' },
}

function relativeTime(createdAt: string) {
  const created = new Date(createdAt).getTime()
  const diff = Math.max(0, Date.now() - created)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  return `${Math.floor(hours / 24)}d`
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
  const style = TYPE_STYLE[notification.type] ?? TYPE_STYLE.default
  const content = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative border-b border-[rgba(0,0,0,0.04)] transition-colors last:border-b-0',
        compact ? 'px-5 py-4' : 'rounded-2xl border border-[var(--card-border)] px-5 py-4',
        !notification.read && 'bg-cyan-500/[0.035]',
      )}
    >
      {!notification.read && (
        <span className="absolute left-2 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--cyan)]" />
      )}
      <div className="flex gap-3">
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl"
          style={{ background: style.bg }}
        >
          <Icon name={style.icon} className="text-2xl" style={{ color: style.color }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium leading-5 text-[var(--text-primary)]">{notification.title}</p>
            <span className="shrink-0 text-xs text-[rgba(0,0,0,0.35)]">{relativeTime(notification.createdAt)}</span>
          </div>
          <p className="mt-1 text-[13px] leading-5 text-[rgba(0,0,0,0.50)]">{notification.description}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {notification.meta && (
              <span className="rounded-full bg-[rgba(0,0,0,0.04)] px-2 py-1 text-[11px] font-semibold text-[rgba(0,0,0,0.45)]">
                {notification.meta}
              </span>
            )}
            {notification.amount !== undefined && (
              <span className="rounded-full bg-[rgba(0,0,0,0.04)] px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(notification.amount)}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (!notification.href) return content

  return (
    <Link href={notification.href} onClick={() => onRead(notification.id)} className="block">
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
      <div className="px-5 py-10 text-center">
        <Icon name="ti-bell-off" className="mx-auto text-4xl text-[rgba(0,0,0,0.20)]" />
        <p className="mt-3 text-sm text-[rgba(0,0,0,0.40)]">Nenhuma notificação</p>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'space-y-2'}>
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
  onClose,
  mobile = false,
}: {
  notifications: EnrichedNotification[]
  unreadCount: number
  criticalCount: number
  onRead: (id: string) => void
  onDismiss: (id: string) => void
  onMarkAll: () => void
  onClearAll: () => void
  onClose?: () => void
  mobile?: boolean
}) {
  const visible = notifications.slice(0, 5)

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden border border-[rgba(0,0,0,0.06)] bg-white text-[var(--text-primary)] shadow-[0_8px_40px_rgba(0,0,0,0.12)] backdrop-blur-md',
        mobile
          ? 'max-h-[75dvh] w-full rounded-t-[20px] pb-[max(20px,var(--sab))]'
          : 'w-[360px] rounded-2xl',
      )}
    >
      {mobile && <div className="mx-auto mt-2 h-1 w-8 rounded-full bg-[rgba(0,0,0,0.15)]" />}

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[rgba(0,0,0,0.06)] px-5 py-4">
        <p className="text-base font-semibold text-[var(--text-primary)]">Notificações</p>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAll}
            className="text-xs font-semibold text-[var(--cyan)] transition-opacity hover:opacity-75"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
        <NotificationList notifications={visible} onRead={onRead} onDismiss={onDismiss} compact />
      </div>

      {notifications.length > 0 && (
        <div className="shrink-0 border-t border-[rgba(0,0,0,0.06)] p-3">
          <Link
            href="/dashboard/notificacoes"
            onClick={onClose}
            className="block text-center text-sm font-semibold text-[var(--cyan)] transition-opacity hover:opacity-75"
          >
            Ver todas
          </Link>
        </div>
      )}
    </div>
  )
}
