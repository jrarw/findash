import { buildArwFinHealth, type ArwFinHealth } from '@/lib/finance/intelligence'
import { ICONS } from '@/lib/iconography'
import type { CartaoCredito, CompraCartao, ContaPagar, FinHealthScore, Orcamento, ResumoMes } from '@/types/database'

type Severity = 'critical' | 'warning' | 'info' | 'success'
type ProfileKey = 'controlado' | 'impulsivo' | 'sobrevivencia' | 'expansivo' | 'investidor' | 'endividado' | 'construtor' | 'instavel'

interface FluxoDiarioInput {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

interface GastoCategoriaInput {
  categoria_id: string
  nome: string
  total: number
  percentual: number
}

export interface CognitiveInsight {
  id: string
  title: string
  description: string
  category: 'risk' | 'behavior' | 'growth' | 'forecast' | 'discipline'
  severity: Severity
  scoreImpact: number
  action: string
  icon: string
  color: string
}

export interface FutureScenario {
  id: 'optimistic' | 'probable' | 'stress'
  label: string
  projectedBalance: number
  projectedSpend: number
  savingsTrend: number
  risk: number
  score: number
  description: string
}

export interface LifeArea {
  id: string
  name: string
  icon: string
  weight: number
  impact: number
  trend: 'up' | 'down' | 'stable'
  risk: number
  recommendation: string
  color: string
  amount: number
}

export interface FinancialTimelineEvent {
  id: string
  label: string
  title: string
  description: string
  type: 'milestone' | 'warning' | 'recovery' | 'insight' | 'risk'
  icon: string
  color: string
}

export interface FinancialProfile {
  key: ProfileKey
  label: string
  description: string
  tone: string
  strengths: string[]
  risks: string[]
  recommendations: string[]
}

export interface DecisionSimulation {
  score: number
  deltaScore: number
  projectedBalance: number
  deltaBalance: number
  risk: number
  recommendation: string
}

export interface FinancialOS {
  health: ArwFinHealth
  profile: FinancialProfile
  insights: CognitiveInsight[]
  scenarios: FutureScenario[]
  lifeMap: LifeArea[]
  timeline: FinancialTimelineEvent[]
  simulate: (input: SimulationInput) => DecisionSimulation
}

export interface SimulationInput {
  cutExpense: number
  extraIncome: number
  bigPurchase: number
  installments: number
  monthlyInvestment: number
  debtPayment: number
}

export interface BuildFinancialOSInput {
  mes: number
  ano: number
  resumo?: ResumoMes | null
  fluxo?: FluxoDiarioInput[]
  categorias?: GastoCategoriaInput[]
  contasProximas?: ContaPagar[]
  orcamentos?: Orcamento[]
  cartoes?: CartaoCredito[]
  comprasCartao?: CompraCartao[]
  health?: FinHealthScore | null
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function brl(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getProfile(health: ArwFinHealth, input: BuildFinancialOSInput): FinancialProfile {
  const entradas = Number(input.resumo?.entradas ?? 0)
  const saidas = Number(input.resumo?.saidas ?? 0)
  const topCategory = input.categorias?.[0]
  const cardLimit = (input.cartoes ?? []).reduce((sum, card) => sum + Number(card.limite_total), 0)
  const cardUsed = (input.comprasCartao ?? []).reduce((sum, purchase) => sum + Number(purchase.valor_total), 0)
  const cardUsage = cardLimit > 0 ? (cardUsed / cardLimit) * 100 : 0
  const margin = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0

  let key: ProfileKey = 'construtor'
  if (health.score < 40) key = 'sobrevivencia'
  else if (cardUsage > 75) key = 'endividado'
  else if ((topCategory?.percentual ?? 0) > 48 && margin < 8) key = 'impulsivo'
  else if (health.pressure > 65) key = 'instavel'
  else if (margin > 22 && health.score > 72) key = 'investidor'
  else if (margin > 12 && cardUsage < 40) key = 'controlado'
  else if (saidas > entradas * 0.92) key = 'expansivo'

  const profiles: Record<ProfileKey, FinancialProfile> = {
    controlado: {
      key,
      label: 'Controlado',
      description: 'Você tende a manter margem e evitar pressão desnecessária.',
      tone: 'O sistema pode ser mais ambicioso com metas e evolução.',
      strengths: ['Margem positiva', 'Crédito moderado', 'Boa previsibilidade'],
      risks: ['Conforto excessivo pode esconder desperdícios pequenos'],
      recommendations: ['Transforme margem em reserva ou investimento recorrente.'],
    },
    impulsivo: {
      key,
      label: 'Impulsivo',
      description: 'Uma área de consumo domina o mês e reduz sua margem de manobra.',
      tone: 'O app deve agir como freio contextual antes de compras não planejadas.',
      strengths: ['Há padrões detectáveis para corrigir'],
      risks: ['Categoria dominante', 'Gastos emocionais', 'Risco de recorrência'],
      recommendations: ['Defina limite semanal para a categoria dominante.'],
    },
    sobrevivencia: {
      key,
      label: 'Sobrevivência',
      description: 'A prioridade é proteger caixa e reduzir risco imediato.',
      tone: 'O sistema deve simplificar decisões e apontar a próxima ação mais importante.',
      strengths: ['Há espaço para recuperação guiada'],
      risks: ['Baixa liquidez', 'Pressão de vencimentos', 'Pouca margem'],
      recommendations: ['Congele gastos flexíveis e organize vencimentos dos próximos 7 dias.'],
    },
    expansivo: {
      key,
      label: 'Expansivo',
      description: 'Seu padrão indica gasto alto em relação à renda atual.',
      tone: 'O app deve mostrar trade-offs e custo futuro de escolhas presentes.',
      strengths: ['Boa atividade financeira para análise'],
      risks: ['Pouca sobra', 'Crescimento de gasto invisível'],
      recommendations: ['Crie teto por categoria antes de novas compras.'],
    },
    investidor: {
      key,
      label: 'Investidor',
      description: 'Você possui margem para construir patrimônio com consistência.',
      tone: 'O sistema pode sugerir metas mais sofisticadas e disciplina de longo prazo.',
      strengths: ['Margem forte', 'Score alto', 'Risco baixo'],
      risks: ['Falta de objetivo pode dispersar a sobra'],
      recommendations: ['Defina uma meta recorrente de investimento/reserva.'],
    },
    endividado: {
      key,
      label: 'Endividado',
      description: 'O crédito está pressionando a leitura e pode antecipar renda futura.',
      tone: 'O sistema deve priorizar redução de parcelas e controle de fatura.',
      strengths: ['O risco está mapeado e pode ser reduzido'],
      risks: ['Limite alto usado', 'Parcelamentos', 'Fatura futura'],
      recommendations: ['Pause novos parcelamentos e simule quitação parcial.'],
    },
    construtor: {
      key,
      label: 'Construtor',
      description: 'Você está criando base financeira, mas ainda precisa de consistência.',
      tone: 'O app deve reforçar hábitos pequenos e evolução contínua.',
      strengths: ['Base em formação', 'Potencial de melhora'],
      risks: ['Dados incompletos', 'Planejamento ainda irregular'],
      recommendations: ['Complete categorias, orçamento e metas para melhorar o diagnóstico.'],
    },
    instavel: {
      key,
      label: 'Instável',
      description: 'A leitura oscila por pressão simultânea em fluxo, cartão ou orçamento.',
      tone: 'O sistema deve detectar picos e sugerir contenção temporária.',
      strengths: ['Oscilações podem ser corrigidas com limites'],
      risks: ['Volatilidade', 'Baixa previsibilidade', 'Alertas simultâneos'],
      recommendations: ['Revise o maior pico de gasto e reduza compromissos variáveis.'],
    },
  }

  return profiles[key]
}

function buildInsights(health: ArwFinHealth, profile: FinancialProfile, input: BuildFinancialOSInput): CognitiveInsight[] {
  const topCategory = input.categorias?.[0]
  const entrada = Number(input.resumo?.entradas ?? 0)
  const saida = Number(input.resumo?.saidas ?? 0)
  const margin = entrada > 0 ? ((entrada - saida) / entrada) * 100 : 0
  const insights: CognitiveInsight[] = []

  insights.push({
    id: 'profile-reading',
    title: `Perfil detectado: ${profile.label}`,
    description: profile.description,
    category: 'behavior',
    severity: health.score < 45 ? 'warning' : 'info',
    scoreImpact: health.score < 45 ? -8 : 4,
    action: profile.recommendations[0],
    icon: ICONS.brand.user,
    color: '#8B5CF6',
  })

  if (health.projectedClosing < 0) {
    insights.push({
      id: 'negative-close',
      title: 'Risco de fechar o mês negativo aumentou',
      description: `Mantendo o ritmo atual, a projeção aponta ${brl(health.projectedClosing)} no fechamento.`,
      category: 'risk',
      severity: 'critical',
      scoreImpact: -14,
      action: 'Corte gastos variáveis e confira vencimentos dos próximos 7 dias.',
      icon: ICONS.status.warning,
      color: '#EF4444',
    })
  }

  if (topCategory && topCategory.percentual > 40) {
    insights.push({
      id: 'dominant-category',
      title: `${topCategory.nome} virou o centro do mês`,
      description: `${Math.round(topCategory.percentual)}% das saídas estão concentradas nessa área.`,
      category: 'behavior',
      severity: topCategory.percentual > 55 ? 'warning' : 'info',
      scoreImpact: topCategory.percentual > 55 ? -8 : -3,
      action: 'Defina um teto semanal para essa categoria e acompanhe a próxima semana.',
      icon: ICONS.finance.category,
      color: '#F59E0B',
    })
  }

  if (margin > 18) {
    insights.push({
      id: 'positive-margin',
      title: 'Você entrou em zona de construção',
      description: `Sua margem estimada está em ${Math.round(margin)}%, suficiente para fortalecer reserva ou metas.`,
      category: 'growth',
      severity: 'success',
      scoreImpact: 8,
      action: 'Automatize parte dessa sobra em uma meta recorrente.',
      icon: ICONS.finance.income,
      color: '#22C55E',
    })
  }

  insights.push(...health.focus.slice(0, 3).map((focus, index) => ({
    id: `focus-${index}`,
    title: `Maior alavanca: ${focus.pillar}`,
    description: focus.action,
    category: 'discipline' as const,
    severity: 'info' as const,
    scoreImpact: Number(focus.gain.toFixed(1)),
    action: focus.label ?? 'Abrir área relacionada',
    icon: focus.icon,
    color: focus.color,
  })))

  return insights.slice(0, 8)
}

function buildScenarios(health: ArwFinHealth, input: BuildFinancialOSInput): FutureScenario[] {
  const entradas = Number(input.resumo?.entradas ?? 0)
  const saidas = Number(input.resumo?.saidas ?? 0)
  const baseSpend = Math.max(saidas, 0)
  const baseBalance = health.projectedClosing

  return [
    {
      id: 'optimistic',
      label: 'Otimista',
      projectedBalance: baseBalance + baseSpend * 0.12 + entradas * 0.04,
      projectedSpend: baseSpend * 0.88,
      savingsTrend: Math.max(0, entradas - baseSpend * 0.88),
      risk: clamp(health.pressure - 24, 0, 100),
      score: clamp(health.score + 9, 0, 100),
      description: 'Você corta gastos flexíveis e mantém entradas no ritmo atual.',
    },
    {
      id: 'probable',
      label: 'Provável',
      projectedBalance: baseBalance,
      projectedSpend: baseSpend,
      savingsTrend: Math.max(0, entradas - baseSpend),
      risk: health.pressure,
      score: health.score,
      description: 'Seu comportamento continua como está hoje.',
    },
    {
      id: 'stress',
      label: 'Estresse',
      projectedBalance: baseBalance - baseSpend * 0.16,
      projectedSpend: baseSpend * 1.16,
      savingsTrend: Math.max(0, entradas - baseSpend * 1.16),
      risk: clamp(health.pressure + 22, 0, 100),
      score: clamp(health.score - 13, 0, 100),
      description: 'Gastos aceleram e surgem compromissos fora do previsto.',
    },
  ]
}

const LIFE_MAP_RULES = [
  { key: 'moradia', name: 'Moradia', icon: ICONS.category.home, match: ['moradia', 'casa', 'aluguel', 'condominio'] },
  { key: 'alimentacao', name: 'Alimentação', icon: ICONS.category.food, match: ['aliment', 'mercado', 'delivery', 'restaurante'] },
  { key: 'transporte', name: 'Transporte', icon: ICONS.category.transport, match: ['transporte', 'uber', 'carro', 'combustivel'] },
  { key: 'lazer', name: 'Lazer', icon: ICONS.category.leisure, match: ['lazer', 'entreten', 'bar', 'cinema'] },
  { key: 'saude', name: 'Saúde', icon: ICONS.category.health, match: ['saude', 'farmacia', 'medico'] },
  { key: 'assinaturas', name: 'Assinaturas', icon: ICONS.category.subscriptions, match: ['assinatura', 'netflix', 'spotify', 'recorrente'] },
  { key: 'dividas', name: 'Dívidas', icon: ICONS.finance.debt, match: ['divida', 'emprestimo', 'financiamento'] },
  { key: 'investimentos', name: 'Investimentos', icon: ICONS.finance.investment, match: ['invest', 'reserva', 'aporte'] },
]

function buildLifeMap(input: BuildFinancialOSInput): LifeArea[] {
  const categorias = input.categorias ?? []
  const total = categorias.reduce((sum, category) => sum + Number(category.total), 0)

  return LIFE_MAP_RULES.map((rule, index) => {
    const matched = categorias.filter(category => {
      const name = category.nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return rule.match.some(token => name.includes(token))
    })
    const amount = matched.reduce((sum, category) => sum + Number(category.total), 0)
    const weight = total > 0 ? (amount / total) * 100 : [28, 24, 16, 11, 9, 7, 4, 1][index]
    const risk = clamp(weight > 35 ? 72 : weight > 22 ? 48 : 24, 0, 100)
    const trend = weight > 28 ? 'up' : weight < 8 ? 'down' : 'stable'

    return {
      id: rule.key,
      name: rule.name,
      icon: rule.icon,
      weight,
      impact: clamp(100 - risk, 0, 100),
      trend,
      risk,
      recommendation: weight > 30 ? `Revise ${rule.name.toLowerCase()} porque ela pesa demais no mês.` : `Mantenha ${rule.name.toLowerCase()} monitorada sem ação urgente.`,
      color: ['#06B6D4', '#8B5CF6', '#10B981', '#F59E0B', '#F9735B', '#3B82F6', '#EF4444', '#22C55E'][index],
      amount,
    }
  })
}

function buildTimeline(health: ArwFinHealth, input: BuildFinancialOSInput): FinancialTimelineEvent[] {
  const topCategory = input.categorias?.[0]

  const events: FinancialTimelineEvent[] = [
    {
      id: 'now-health',
      label: 'Agora',
      title: `Fin Health em ${health.label}`,
      description: `Score atual ${health.score}/100, pressão em ${health.pressure}%.`,
      type: health.score >= 72 ? 'milestone' : health.score >= 52 ? 'warning' : 'risk',
      icon: ICONS.health.score,
      color: health.score >= 72 ? '#22C55E' : '#F59E0B',
    },
    {
      id: 'forecast',
      label: '+30d',
      title: 'Previsão de fechamento',
      description: `Cenário provável aponta ${brl(health.projectedClosing)} no fim do mês.`,
      type: health.projectedClosing >= 0 ? 'insight' : 'risk',
      icon: ICONS.health.forecast,
      color: health.projectedClosing >= 0 ? '#06B6D4' : '#EF4444',
    },
    {
      id: 'category',
      label: 'Padrão',
      title: topCategory ? `${topCategory.nome} domina o comportamento` : 'Padrão ainda em formação',
      description: topCategory ? `${Math.round(topCategory.percentual)}% das saídas estão concentradas aqui.` : 'Mais lançamentos vão revelar o mapa de vida financeira.',
      type: topCategory && topCategory.percentual > 45 ? 'warning' : 'insight',
      icon: ICONS.finance.category,
      color: '#8B5CF6',
    },
    ...health.timeline.map((item, index) => ({
      id: `health-${index}`,
      label: `S${index + 1}`,
      title: item.title,
      description: item.description,
      type: item.type === 'danger' ? 'risk' as const : item.type === 'warning' ? 'warning' as const : 'recovery' as const,
      icon: item.icon,
      color: item.type === 'danger' ? '#EF4444' : item.type === 'warning' ? '#F59E0B' : '#22C55E',
    })),
  ]

  return events.slice(0, 8)
}

function buildSimulation(health: ArwFinHealth, input: BuildFinancialOSInput) {
  const entradas = Number(input.resumo?.entradas ?? 0)

  return (simulation: SimulationInput): DecisionSimulation => {
    const installmentMonths = Math.max(simulation.installments, 1)
    const monthlyPurchasePressure = simulation.bigPurchase / installmentMonths
    const balanceDelta = simulation.cutExpense + simulation.extraIncome + simulation.debtPayment * 0.2 - monthlyPurchasePressure - simulation.monthlyInvestment
    const riskDelta = monthlyPurchasePressure > entradas * 0.12 ? 14 : simulation.cutExpense > 0 || simulation.debtPayment > 0 ? -10 : 0
    const scoreDelta = clamp(
      (simulation.cutExpense / Math.max(entradas, 1)) * 22 +
      (simulation.extraIncome / Math.max(entradas, 1)) * 16 +
      (simulation.debtPayment / Math.max(entradas, 1)) * 14 +
      (simulation.monthlyInvestment / Math.max(entradas, 1)) * 8 -
      (monthlyPurchasePressure / Math.max(entradas, 1)) * 28,
      -24,
      18,
    )

    return {
      score: Math.round(clamp(health.score + scoreDelta, 0, 100)),
      deltaScore: Math.round(scoreDelta),
      projectedBalance: health.projectedClosing + balanceDelta,
      deltaBalance: balanceDelta,
      risk: Math.round(clamp(health.pressure + riskDelta - scoreDelta * 0.35, 0, 100)),
      recommendation: scoreDelta >= 5
        ? 'Cenário melhora sua saúde financeira. Vale transformar em plano.'
        : scoreDelta <= -5
          ? 'Cenário pressiona seu futuro. O sistema recomenda adiar ou compensar com corte.'
          : 'Impacto moderado. Decisão possível, mas monitore o fluxo nos próximos dias.',
    }
  }
}

export function buildFinancialOS(input: BuildFinancialOSInput): FinancialOS {
  const health = buildArwFinHealth(input)
  const profile = getProfile(health, input)

  return {
    health,
    profile,
    insights: buildInsights(health, profile, input),
    scenarios: buildScenarios(health, input),
    lifeMap: buildLifeMap(input),
    timeline: buildTimeline(health, input),
    simulate: buildSimulation(health, input),
  }
} 
