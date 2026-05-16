'use client'

import { useEffect, useMemo, useState } from 'react'
import { useCartoesCredito, useComprasCartao } from '@/hooks/useCartoes'
import { useContasPagar } from '@/hooks/useContasPagar'
import { useImportBatches } from '@/hooks/useImportacaoPlanilha'
import { useMetas, useOrcamentos } from '@/hooks/useFinancas'
import { useGastosPorCategoria, useResumoMes } from '@/hooks/useTransacoes'
import { getCurrentMonthYear } from '@/lib/format'
import { buildFinNotifications } from '@/lib/notifications'

const READ_KEY = 'findash.notifications.read'
const DISMISSED_KEY = 'findash.notifications.dismissed'

function readSet(key: string) {
  if (typeof window === 'undefined') return new Set<string>()

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return new Set(Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function writeSet(key: string, values: Set<string>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify([...values]))
}

export function useFinNotifications() {
  const { mes, ano } = getCurrentMonthYear()
  const { data: resumo } = useResumoMes(mes, ano)
  const { data: contas } = useContasPagar()
  const { data: metas } = useMetas()
  const { data: orcamentos } = useOrcamentos(mes, ano)
  const { data: gastos } = useGastosPorCategoria(mes, ano)
  const { data: cartoes } = useCartoesCredito()
  const { data: comprasCartao } = useComprasCartao(mes, ano)
  const { data: importBatches } = useImportBatches()
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    setReadIds(readSet(READ_KEY))
    setDismissedIds(readSet(DISMISSED_KEY))
  }, [])

  const allNotifications = useMemo(() => buildFinNotifications({
    resumo,
    contas,
    metas,
    orcamentos,
    gastos,
    cartoes,
    comprasCartao,
    importBatches,
  }), [resumo, contas, metas, orcamentos, gastos, cartoes, comprasCartao, importBatches])

  const notifications = useMemo(
    () => allNotifications.filter(notification => !dismissedIds.has(notification.id)),
    [allNotifications, dismissedIds],
  )

  const enrichedNotifications = useMemo(
    () => notifications.map(notification => ({
      ...notification,
      read: readIds.has(notification.id),
    })),
    [notifications, readIds],
  )

  const unreadCount = enrichedNotifications.filter(notification => !notification.read).length
  const criticalCount = enrichedNotifications.filter(notification => notification.priority === 'critical' && !notification.read).length

  function markAsRead(id: string) {
    setReadIds(current => {
      const next = new Set(current)
      next.add(id)
      writeSet(READ_KEY, next)
      return next
    })
  }

  function markAllAsRead() {
    const next = new Set(readIds)
    notifications.forEach(notification => next.add(notification.id))
    setReadIds(next)
    writeSet(READ_KEY, next)
  }

  function dismiss(id: string) {
    setDismissedIds(current => {
      const next = new Set(current)
      next.add(id)
      writeSet(DISMISSED_KEY, next)
      return next
    })
  }

  function clearAll() {
    const next = new Set(dismissedIds)
    notifications.forEach(notification => next.add(notification.id))
    setDismissedIds(next)
    writeSet(DISMISSED_KEY, next)
  }

  return {
    notifications: enrichedNotifications,
    unreadCount,
    criticalCount,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
  }
}
