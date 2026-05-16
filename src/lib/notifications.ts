import { ICONS, type IconClass } from '@/lib/iconography'
import { formatCurrencyBRL, getDaysUntil } from '@/lib/format'
import type { CartaoCredito, CompraCartao, ContaPagar, ImportBatch, Meta, Orcamento, ResumoMes } from '@/types/database'

export type FinNotificationType =
  | 'bill'
  | 'budget'
  | 'card'
  | 'goal'
  | 'cashflow'
  | 'health'
  | 'import'
  | 'insight'

export type FinNotificationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface FinNotification {
  id: string
  type: FinNotificationType
  priority: FinNotificationPriority
  title: string
  description: string
  createdAt: string
  icon: IconClass
  color: string
  href?: string
  amount?: number
  meta?: string
  source: 'real' | 'mock'
}

interface GastoCategoria {
  categoria_id: string
  nome: string
  total: number
  percentual: number
}

export interface BuildNotificationsInput {
  resumo?: ResumoMes | null
  contas?: ContaPagar[]
  metas?: Meta[]
  orcamentos?: Orcamento[]
  gastos?: GastoCategoria[]
  cartoes?: CartaoCredito[]
  comprasCartao?: CompraCartao[]
  importBatches?: ImportBatch[]
}

function daysLabel(days: number) {
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  if (days < 0) return `${Math.abs(days)} dia(s) em atraso`
  return `vence em ${days} dias`
}

function nowIso() {
  return new Date().toISOString()
}

export const MOCK_FIN_NOTIFICATIONS: FinNotification[] = [
  {
    id: 'mock-bill-today',
    type: 'bill',
    priority: 'high',
    title: 'Conta vence hoje',
    description: 'Internet residencial vence hoje e pode impactar o caixa se não for paga.',
    createdAt: nowIso(),
    icon: ICONS.finance.bill,
    color: '#F59E0B',
    href: '/dashboard/contas',
    amount: 149.9,
    meta: 'Hoje',
    source: 'mock',
  },
  {
    id: 'mock-card-limit',
    type: 'card',
    priority: 'high',
    title: 'Cartão perto do limite confortável',
    description: 'Seu cartão principal está acima de 72% de uso. Evite novos parcelamentos neste ciclo.',
    createdAt: nowIso(),
    icon: ICONS.finance.card,
    color: '#A855F7',
    href: '/dashboard/cartoes',
    meta: '72%',
    source: 'mock',
  },
  {
    id: 'mock-budget-warning',
    type: 'budget',
    priority: 'medium',
    title: 'Orçamento de alimentação em atenção',
    description: 'A categoria Alimentação consumiu 84% do limite mensal antes do fim do mês.',
    createdAt: nowIso(),
    icon: ICONS.finance.budget,
    color: '#F59E0B',
    href: '/dashboard/orcamento',
    meta: '84%',
    source: 'mock',
  },
  {
    id: 'mock-health-insight',
    type: 'health',
    priority: 'low',
    title: 'Insight do FinHealth',
    description: 'Sua previsibilidade melhorou: recorrências e vencimentos estão deixando a projeção mais confiável.',
    createdAt: nowIso(),
    icon: ICONS.health.pulse,
    color: '#06B6D4',
    href: '/dashboard/health',
    meta: 'FinSmart',
    source: 'mock',
  },
]

export function buildFinNotifications(input: BuildNotificationsInput): FinNotification[] {
  const notifications: FinNotification[] = []
  const createdAt = nowIso()

  ;(input.contas ?? []).forEach(conta => {
    if (conta.status === 'pago' || conta.status === 'cancelado') return

    const days = getDaysUntil(conta.vencimento)
    if (days > 7) return

    const overdue = days < 0
    const dueToday = days === 0
    notifications.push({
      id: `bill-${conta.id}-${conta.vencimento}`,
      type: 'bill',
      priority: overdue ? 'critical' : dueToday ? 'high' : 'medium',
      title: overdue ? 'Conta em atraso' : dueToday ? 'Conta vence hoje' : 'Vencimento próximo',
      description: `${conta.nome} ${daysLabel(days)} no valor de ${formatCurrencyBRL(Number(conta.valor))}.`,
      createdAt,
      icon: overdue ? ICONS.status.danger : ICONS.finance.bill,
      color: overdue ? '#EF4444' : dueToday ? '#F59E0B' : '#06B6D4',
      href: '/dashboard/contas',
      amount: Number(conta.valor),
      meta: daysLabel(days),
      source: 'real',
    })
  })

  const gastosMap = new Map((input.gastos ?? []).map(gasto => [gasto.categoria_id, gasto]))
  ;(input.orcamentos ?? []).forEach(orcamento => {
    const gasto = gastosMap.get(orcamento.categoria_id)
    const limite = Number(orcamento.valor_ajustado ?? orcamento.valor_limite ?? 0)
    if (!gasto || limite <= 0) return

    const usage = (gasto.total / limite) * 100
    if (usage < 80) return

    notifications.push({
      id: `budget-${orcamento.id}-${Math.round(usage)}`,
      type: 'budget',
      priority: usage >= 100 ? 'critical' : 'high',
      title: usage >= 100 ? 'Orçamento estourado' : 'Orçamento quase no limite',
      description: `${gasto.nome} já consumiu ${Math.round(usage)}% do orçamento mensal.`,
      createdAt,
      icon: usage >= 100 ? ICONS.finance.overBudget : ICONS.finance.budget,
      color: usage >= 100 ? '#EF4444' : '#F59E0B',
      href: '/dashboard/orcamento',
      amount: gasto.total,
      meta: `${Math.round(usage)}%`,
      source: 'real',
    })
  })

  const cardUsage = (input.cartoes ?? []).map(cartao => {
    const used = (input.comprasCartao ?? [])
      .filter(compra => compra.cartao_id === cartao.id)
      .reduce((sum, compra) => sum + Number(compra.valor_total), 0)
    const limit = Number(cartao.limite_total)
    return { cartao, used, usage: limit > 0 ? (used / limit) * 100 : 0 }
  })

  cardUsage.forEach(({ cartao, used, usage }) => {
    if (usage < 65) return

    notifications.push({
      id: `card-${cartao.id}-${Math.round(usage)}`,
      type: 'card',
      priority: usage >= 90 ? 'critical' : 'high',
      title: usage >= 90 ? 'Cartão em zona crítica' : 'Cartão perto do limite confortável',
      description: `${cartao.nome} está com ${Math.round(usage)}% do limite usado (${formatCurrencyBRL(used)}).`,
      createdAt,
      icon: ICONS.finance.card,
      color: usage >= 90 ? '#EF4444' : '#A855F7',
      href: '/dashboard/cartoes',
      amount: used,
      meta: `${Math.round(usage)}%`,
      source: 'real',
    })
  })

  ;(input.metas ?? []).forEach(meta => {
    const progress = Number(meta.valor_alvo) > 0 ? (Number(meta.valor_atual) / Number(meta.valor_alvo)) * 100 : 0
    if (progress >= 100) {
      notifications.push({
        id: `goal-done-${meta.id}`,
        type: 'goal',
        priority: 'medium',
        title: 'Meta financeira alcançada',
        description: `${meta.titulo} chegou a ${Math.round(progress)}% do alvo.`,
        createdAt,
        icon: ICONS.finance.goal,
        color: '#22C55E',
        href: '/dashboard/metas',
        meta: 'Concluída',
        source: 'real',
      })
      return
    }

    if (meta.data_fim) {
      const totalDays = Math.max(1, getDaysUntil(meta.data_fim) + 30)
      const expectedProgress = Math.max(25, Math.min(90, 100 - (getDaysUntil(meta.data_fim) / totalDays) * 100))
      if (getDaysUntil(meta.data_fim) <= 30 && progress + 12 < expectedProgress) {
        notifications.push({
          id: `goal-risk-${meta.id}`,
          type: 'goal',
          priority: 'medium',
          title: 'Meta pode ficar para trás',
          description: `${meta.titulo} está em ${Math.round(progress)}% e precisa de atenção nos próximos dias.`,
          createdAt,
          icon: ICONS.finance.goal,
          color: '#F59E0B',
          href: '/dashboard/metas',
          meta: `${Math.round(progress)}%`,
          source: 'real',
        })
      }
    }
  })

  const saldo = Number(input.resumo?.saldo ?? 0)
  if (input.resumo && saldo < 0) {
    notifications.push({
      id: `cashflow-negative-${Math.round(Math.abs(saldo))}`,
      type: 'cashflow',
      priority: 'critical',
      title: 'Saldo do mês negativo',
      description: `As saídas superaram as entradas em ${formatCurrencyBRL(Math.abs(saldo))}.`,
      createdAt,
      icon: ICONS.finance.balance,
      color: '#EF4444',
      href: '/dashboard/extrato',
      amount: saldo,
      meta: 'Saldo baixo',
      source: 'real',
    })
  }

  ;(input.importBatches ?? []).slice(0, 2).forEach(batch => {
    notifications.push({
      id: `import-${batch.id}-${batch.status}`,
      type: 'import',
      priority: batch.error_rows > 0 ? 'medium' : 'low',
      title: batch.error_rows > 0 ? 'Importação com inconsistências' : 'Importação de planilha concluída',
      description: `${batch.imported_rows} transações importadas de ${batch.file_name}.${batch.error_rows > 0 ? ` ${batch.error_rows} linhas tiveram erro.` : ''}`,
      createdAt: batch.created_at,
      icon: ICONS.import.table,
      color: batch.error_rows > 0 ? '#F59E0B' : '#06B6D4',
      href: '/dashboard/importar',
      meta: `${batch.imported_rows} linhas`,
      source: 'real',
    })
  })

  const sorted = notifications.sort((a, b) => {
    const priorityOrder: Record<FinNotificationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return sorted.length > 0 ? sorted : MOCK_FIN_NOTIFICATIONS
}
