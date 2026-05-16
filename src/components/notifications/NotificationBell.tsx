'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
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
  const [isMobile, setIsMobile] = useState(false)
  const [panelPosition, setPanelPosition] = useState({ top: 72, left: 16 })
  const pathname = usePathname()
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
    function updateViewport() {
      setIsMobile(window.innerWidth < 640)
    }

    updateViewport()
    window.addEventListener('resize', updateViewport)
    return () => window.removeEventListener('resize', updateViewport)
  }, [])

  useLayoutEffect(() => {
    function updatePosition() {
      if (!ref.current || typeof window === 'undefined') return
      const rect = ref.current.getBoundingClientRect()
      const width = 360
      const margin = 12
      const preferredLeft = panelAlign === 'left' ? rect.left : rect.right - width
      const left = Math.min(Math.max(margin, preferredLeft), window.innerWidth - width - margin)
      setPanelPosition({ top: rect.bottom + 10, left })
    }

    if (open && !isMobile) updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, panelAlign, isMobile])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          {isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black"
            />
          )}

          {isMobile ? (
            <motion.div
              ref={panelRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.22 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 80 || info.velocity.y > 650) setOpen(false)
              }}
              onPointerDown={event => event.stopPropagation()}
              className="fixed inset-x-0 bottom-0 z-[60]"
            >
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                criticalCount={criticalCount}
                onRead={markAsRead}
                onDismiss={dismiss}
                onMarkAll={markAllAsRead}
                onClearAll={clearAll}
                onClose={() => setOpen(false)}
                mobile
              />
            </motion.div>
          ) : (
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onPointerDown={event => event.stopPropagation()}
              className="fixed z-[60] w-[360px]"
              style={{ top: panelPosition.top, left: panelPosition.left }}
            >
              <NotificationPanel
                notifications={notifications}
                unreadCount={unreadCount}
                criticalCount={criticalCount}
                onRead={markAsRead}
                onDismiss={dismiss}
                onMarkAll={markAllAsRead}
                onClearAll={clearAll}
                onClose={() => setOpen(false)}
              />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  )

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
          <span className="arw-on-accent absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-[0_8px_18px_rgba(239,68,68,0.28)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {typeof document !== 'undefined' ? createPortal(panel, document.body) : null}
    </div>
  )
}
