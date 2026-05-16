'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from '@/components/ui/icon'
import { NotificationPanel } from '@/components/notifications/NotificationCenter'
import { useFinNotifications } from '@/hooks/useFinNotifications'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'

interface NotificationBellProps {
  className?: string
  panelAlign?: 'left' | 'right'
}

export function NotificationBell({ className, panelAlign = 'right' }: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const {
    notifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  } = useFinNotifications()

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const panel = open ? (
    <>
      <div
        onClick={() => setOpen(false)}
        className="fixed inset-0 z-[9998] bg-[var(--bg-overlay)] backdrop-blur-sm sm:hidden"
      />
      <div
        ref={panelRef}
        className={cn(
          'fixed inset-x-0 bottom-0 top-16 z-[9999] px-3 pb-[calc(12px+env(safe-area-inset-bottom))] pt-3 sm:bottom-auto sm:left-auto sm:right-4 sm:top-16 sm:w-[min(92vw,420px)] sm:p-0 xl:right-auto xl:top-16',
          panelAlign === 'left' ? 'xl:left-4' : 'xl:right-4',
        )}
      >
        <NotificationPanel
          notifications={notifications}
          unreadCount={unreadCount}
          criticalCount={criticalCount}
          onRead={markAsRead}
          onDismiss={dismiss}
          onMarkAll={markAllAsRead}
          onClearAll={clearAll}
        />
      </div>
    </>
  ) : null

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(current => !current)}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-0.5 hover:text-[var(--text-primary)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]',
          criticalCount > 0 && 'border-red-500/20 bg-red-500/[0.045] text-red-500',
        )}
        aria-label="Abrir notificações"
      >
        <Icon name={ICONS.status.notification} className="text-xl" />
        {unreadCount > 0 && (
          <span className="arw-on-accent absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[var(--cyan)] px-1 text-[10px] font-bold text-white shadow-[0_8px_18px_rgba(6,182,212,0.25)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </div>
  )
}
