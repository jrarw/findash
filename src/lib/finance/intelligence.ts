import type { CartaoCredito, ContaPagar, FinHealthScore, Orcamento } from '@/types/database'
import { ICONS } from '@/lib/iconography'

interface ResumoMesInput {
  entradas: number
  saidas: number
  saldo: number
}

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

interface CompraCartaoInput {
  cartao_id: string
  valor_total: number
  parcelas_total: number
  parcela_atual: number
}

export interface FinancialPulse {
  status: 'saudavel' | 'atencao' | 'risco'
  statusLabel: string
  score: number
  projectedClosing: number
  dailyBurn: number
  safeToSpend: number
  marginPercent: number
  budgetUsagePercent: number
  cardUsagePercent: number
  futureBillsTotal: number
  topCategoryName: string
  topCategoryTotal: number
  alerts: Array<{
    title: string
    description: string
    severity: 'info' | 'warning' | 'danger' | 'success'
    icon: string
  }>
  insights: string[]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function getDaysInMonth(mes: number, ano: number) {
  return new Date(ano, mes, 0).getDate()
}

function getCurrentDayForPeriod(mes: number, ano: number) {
  const now = new Date()
  const isCurrentMonth = now.getMonth() + 1 === mes && now.getFullYear() === ano
  return isCurrentMonth ? now.getDate() : getDaysInMonth(mes, ano)
}

export function buildFinancialPulse({
  mes,
  ano,
  resumo,
  fluxo,
  categorias,
  contasProximas,
  orcamentos,
  cartoes,
  comprasCartao,
  health,
}: {
  mes: number
  ano: number
  resumo?: ResumoMesInput | null
  fluxo?: FluxoDiarioInput[]
  categorias?: GastoCategoriaInput[]
  contasProximas?: ContaPagar[]
  orcamentos?: Orcamento[]
  cartoes?: CartaoCredito[]
  comprasCartao?: CompraCartaoInput[]
  health?: FinHealthScore | null
}): FinancialPulse {
  const entradas = Number(resumo?.entradas ?? 0)
  const saidas = Number(resumo?.saidas ?? 0)
  const saldo = Number(resumo?.saldo ?? 0)
  const day = getCurrentDayForPeriod(mes, ano)
  const daysInMonth = getDaysInMonth(mes, ano)
  const remainingDays = Math.max(daysInMonth - day, 0)
  const dailyBurn = day > 0 ? saidas / day : 0
  const projectedOut = dailyBurn * daysInMonth
  const futureBillsTotal = (contasProximas ?? []).reduce((sum, conta) => sum + Number(conta.valor), 0)
  const projectedClosing = entradas - projectedOut - futureBillsTotal
  const safeToSpend = Math.max(projectedClosing * 0.65, 0)
  const marginPercent = entradas > 0 ? ((entradas - saidas) / entradas) * 100 : 0
  const topCategory = categorias?.[0]

  const budgetLimit = (orcamentos ?? []).reduce((sum, item) => sum + Number(item.valor_ajustado ?? item.valor_limite ?? 0), 0)
  const budgetUsagePercent = budgetLimit > 0 ? (saidas / budgetLimit) * 100 : 0

  const cardLimit = (cartoes ?? []).reduce((sum, cartao) => sum + Number(cartao.limite_total), 0)
  const cardUsed = (comprasCartao ?? []).reduce((sum, compra) => sum + Number(compra.valor_total), 0)
  const cardUsagePercent = cardLimit > 0 ? (cardUsed / cardLimit) * 100 : 0

  // Score heurístico para dar sensação de leitura viva mesmo antes da IA externa.
  const marginScore = clamp(50 + marginPercent, 0, 100)
  const budgetScore = budgetLimit > 0 ? clamp(120 - budgetUsagePercent, 0, 100) : 62
  const cardScore = cardLimit > 0 ? clamp(115 - cardUsagePercent, 0, 100) : 72
  const flowScore = projectedClosing >= 0 ? 78 : 35
  const healthScore = Number(health?.score_geral ?? 0)
  const baseScore = healthScore > 0
    ? (healthScore * 0.35) + (marginScore * 0.25) + (budgetScore * 0.2) + (cardScore * 0.1) + (flowScore * 0.1)
    : (marginScore * 0.35) + (budgetScore * 0.25) + (cardScore * 0.2) + (flowScore * 0.2)
  const score = Math.round(clamp(baseScore, 0, 100))
  const status = score >= 72 ? 'saudavel' : score >= 48 ? 'atencao' : 'risco'
  const statusLabel = status === 'saudavel' ? 'Controle alto' : status === 'atencao' ? 'Atenção ativa' : 'Risco financeiro'

  const alerts: FinancialPulse['alerts'] = []

  if (projectedClosing < 0) {
    alerts.push({
      title: 'Fechamento projetado negativo',
      description: 'Seu ritmo atual indica risco de terminar o mês no vermelho.',
      severity: 'danger',
      icon: ICONS.status.warning,
    })
  }

  if (budgetUsagePercent >= 80) {
    alerts.push({
      title: budgetUsagePercent >= 100 ? 'Orçamento estourado' : 'Orçamento perto do limite',
      description: `${Math.round(budgetUsagePercent)}% do orçamento mensal já foi usado.`,
      severity: budgetUsagePercent >= 100 ? 'danger' : 'warning',
      icon: ICONS.finance.budget,
    })
  }

  if (cardUsagePercent >= 60) {
    alerts.push({
      title: 'Cartão pressionando o caixa',
      description: `${Math.round(cardUsagePercent)}% do limite dos cartões está comprometido neste mês.`,
      severity: cardUsagePercent >= 90 ? 'danger' : 'warning',
      icon: ICONS.finance.card,
    })
  }

  if (futureBillsTotal > 0) {
    alerts.push({
      title: 'Vencimentos próximos',
      description: `Existem contas futuras somando ${futureBillsTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      severity: 'info',
      icon: ICONS.finance.bill,
    })
  }

  if (alerts.length === 0 && (fluxo?.length ?? 0) > 0) {
    alerts.push({
      title: 'Mês sob controle',
      description: 'Seu fluxo atual não disparou nenhum alerta crítico.',
      severity: 'success',
      icon: ICONS.finance.reserve,
    })
  }

  const insights = [
    topCategory
      ? `${topCategory.nome} concentra ${Math.round(topCategory.percentual)}% das saídas do mês.`
      : 'Lance algumas despesas para revelar seus padrões de consumo.',
    projectedClosing >= 0
      ? `Mantendo o ritmo, a projeção de fechamento é positiva.`
      : `O ritmo diário de gastos está acima do confortável para este mês.`,
    cardLimit > 0
      ? `Cartões estão em ${Math.round(cardUsagePercent)}% de uso no ciclo atual.`
      : 'Cadastre cartões para medir dependência de crédito e faturas futuras.',
  ]

  return {
    status,
    statusLabel,
    score,
    projectedClosing,
    dailyBurn,
    safeToSpend,
    marginPercent,
    budgetUsagePercent,
    cardUsagePercent,
    futureBillsTotal,
    topCategoryName: topCategory?.nome ?? 'Sem categoria dominante',
    topCategoryTotal: Number(topCategory?.total ?? 0),
    alerts,
    insights,
  }
}

export interface ArwFinHealthPillar {
  key: string
  name: string
  score: number
  weight: number
  impact: number
  classification: 'superando' | 'no_caminho' | 'atencao' | 'critico'
  icon: string
  color: string
  description: string
  action: string
  formula: string
  subMetrics: Array<{
    name: string
    value: string
    score: number
    range: string
    ideal: string
  }>
  improvements: Array<{
    action: string
    gain: number
    href?: string
    label?: string
  }>
}

export interface ArwFinHealthTimelineEvent {
  title: string
  description: string
  type: 'positive' | 'warning' | 'danger' | 'neutral'
  icon: string
}

export interface ArwFinHealth {
  score: number
  label: string
  recovery: 'verde' | 'amarelo' | 'vermelho'
  recoveryLabel: string
  pressure: number
  survivalDays: number
  projectedClosing: number
  safeToSpend: number
  pillars: ArwFinHealthPillar[]
  riskRadar: Array<{ subject: string; value: number; fullMark: number }>
  timeline: ArwFinHealthTimelineEvent[]
  insights: string[]
  forecast: Array<{ label: string; saldo: number; risco: number }>
  potential: {
    score: number
    gain: number
    improvements: Array<{
      pillar: string
      action: string
      gain: number
      href?: string
      label?: string
    }>
  }
  achievements: Array<{
    id: string
    category: 'cash' | 'discipline' | 'credit' | 'growth'
    categoryLabel: string
    name: string
    description: string
    icon: string
    unlocked: boolean
    progress: number
  }>
  focus: Array<{
    pillar: string
    icon: string
    color: string
    action: string
    gain: number
    href?: string
    label?: string
  }>
}

function scoreColor(score: number) {
  if (score >= 85) return '#00E5FF'
  if (score >= 70) return '#22C55E'
  if (score >= 50) return '#EAB308'
  if (score >= 30) return '#F97316'
  return '#EF4444'
}

function pillarClassification(score: number): ArwFinHealthPillar['classification'] {
  if (score >= 80) return 'superando'
  if (score >= 60) return 'no_caminho'
  if (score >= 40) return 'atencao'
  return 'critico'
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function scoreRatio(value: number, ideal: number, floor = 0) {
  if (ideal <= 0) return 0
  return clamp((value / ideal) * 100, floor, 100)
}

function inverseScore(value: number, idealMax: number, critical: number) {
  if (value <= idealMax) return 100
  if (value >= critical) return 0
  return clamp(100 - ((value - idealMax) / (critical - idealMax)) * 100, 0, 100)
}

function weightedAverage(items: Array<{ score: number; weight: number }>) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  if (totalWeight <= 0) return 0
  return items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight
}

function daysUntilISO(date: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(`${date}T00:00:00`)
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000)
}

function dailyVolatilityScore(fluxo?: FluxoDiarioInput[]) {
  if (!fluxo || fluxo.length < 4) return 48
  const dailyNet = fluxo.map(item => Number(item.entradas) - Number(item.saidas))
  const avg = dailyNet.reduce((sum, value) => sum + value, 0) / dailyNet.length
  const variance = dailyNet.reduce((sum, value) => sum + Math.pow(value - avg, 2), 0) / dailyNet.length
  const stdev = Math.sqrt(variance)
  const avgAbs = dailyNet.reduce((sum, value) => sum + Math.abs(value), 0) / dailyNet.length
  const volatilityRatio = avgAbs > 0 ? (stdev / avgAbs) * 100 : 0
  return inverseScore(volatilityRatio, 45, 180)
}

export function buildArwFinHealth({
  mes,
  ano,
  resumo,
  fluxo,
  categorias,
  contasProximas,
  orcamentos,
  cartoes,
  comprasCartao,
  health,
}: {
  mes: number
  ano: number
  resumo?: ResumoMesInput | null
  fluxo?: FluxoDiarioInput[]
  categorias?: GastoCategoriaInput[]
  contasProximas?: ContaPagar[]
  orcamentos?: Orcamento[]
  cartoes?: CartaoCredito[]
  comprasCartao?: CompraCartaoInput[]
  health?: FinHealthScore | null
}): ArwFinHealth {
  const pulse = buildFinancialPulse({
    mes,
    ano,
    resumo,
    fluxo,
    categorias,
    contasProximas,
    orcamentos,
    cartoes,
    comprasCartao,
    health,
  })

  const entradas = Number(resumo?.entradas ?? 0)
  const saidas = Number(resumo?.saidas ?? 0)
  const saldo = Number(resumo?.saldo ?? 0)
  const futureBills = pulse.futureBillsTotal
  const budgetUsage = pulse.budgetUsagePercent
  const cardUsage = pulse.cardUsagePercent
  const recurringSignal = (contasProximas ?? []).filter(conta => conta.recorrente).length
  const topCategory = categorias?.[0]
  const cardInstallments = (comprasCartao ?? []).filter(compra => compra.parcelas_total > 1)
  const day = getCurrentDayForPeriod(mes, ano)
  const daysInMonth = getDaysInMonth(mes, ano)
  const dailyNet = day > 0 ? saldo / day : 0
  const survivalDays = pulse.dailyBurn > 0 ? Math.floor(Math.max(saldo, 0) / pulse.dailyBurn) : 90
  const reserveMonths = pulse.dailyBurn > 0 ? Math.max(saldo, 0) / (pulse.dailyBurn * 30) : 3
  const fluxoDays = fluxo?.length ?? 0
  const dataCoverage = clamp((fluxoDays / Math.max(day, 1)) * 100, 0, 100)
  const categoryConcentration = Number(topCategory?.percentual ?? 0)
  const overdueBills = (contasProximas ?? []).filter(conta => conta.status !== 'pago' && daysUntilISO(conta.vencimento) < 0)
  const dueSoonBills = (contasProximas ?? []).filter(conta => conta.status !== 'pago' && daysUntilISO(conta.vencimento) <= 7)
  const fixedCommitmentRatio = entradas > 0 ? (futureBills / entradas) * 100 : 0
  const installmentAmount = cardInstallments.reduce((sum, compra) => sum + Number(compra.valor_total), 0)
  const installmentPressure = entradas > 0 ? (installmentAmount / entradas) * 100 : 0
  const budgetCoverage = (categorias?.length ?? 0) > 0
    ? clamp(((orcamentos?.length ?? 0) / Math.max(categorias?.length ?? 1, 1)) * 100, 0, 100)
    : 0
  const volatilityScore = dailyVolatilityScore(fluxo)
  const marginScoreStrict = scoreRatio(pulse.marginPercent, 25, pulse.marginPercent > 0 ? 15 : 0)
  const projectionScore = pulse.projectedClosing >= 0
    ? scoreRatio(pulse.projectedClosing, Math.max(entradas * 0.18, 1), 35)
    : clamp(35 + (pulse.projectedClosing / Math.max(entradas, 1)) * 100, 0, 35)
  const overduePenalty = overdueBills.length * 18
  const concentrationPenalty = Math.max(0, categoryConcentration - 38) * 0.55
  const dataPenalty = dataCoverage < 45 ? 10 : dataCoverage < 70 ? 5 : 0

  const liquidity = clamp(weightedAverage([
    { score: scoreRatio(survivalDays, 60, 8), weight: 0.34 },
    { score: projectionScore, weight: 0.34 },
    { score: inverseScore(fixedCommitmentRatio, 22, 75), weight: 0.18 },
    { score: saldo > 0 ? scoreRatio(saldo, Math.max(entradas * 0.35, 1), 25) : 0, weight: 0.14 },
  ]) - overduePenalty, 0, 100)
  const stability = clamp(weightedAverage([
    { score: volatilityScore, weight: 0.34 },
    { score: marginScoreStrict, weight: 0.26 },
    { score: inverseScore(budgetUsage, 72, 115), weight: 0.24 },
    { score: inverseScore(categoryConcentration, 35, 70), weight: 0.16 },
  ]) - concentrationPenalty, 0, 100)
  const control = clamp(weightedAverage([
    { score: budgetCoverage, weight: 0.32 },
    { score: scoreRatio(categorias?.length ?? 0, 8, 10), weight: 0.22 },
    { score: dataCoverage, weight: 0.24 },
    { score: health ? 72 : 36, weight: 0.12 },
    { score: orcamentos?.length ? 66 : 28, weight: 0.10 },
  ]) - dataPenalty, 0, 100)
  const creditDependency = clamp(weightedAverage([
    { score: inverseScore(cardUsage, 28, 85), weight: 0.48 },
    { score: inverseScore(cardInstallments.length, 1, 8), weight: 0.24 },
    { score: inverseScore(installmentPressure, 8, 38), weight: 0.28 },
  ]), 0, 100)
  const security = clamp(weightedAverage([
    { score: scoreRatio(reserveMonths, 6, 5), weight: 0.45 },
    { score: saldo > futureBills * 1.5 ? 82 : saldo > futureBills ? 62 : 28, weight: 0.22 },
    { score: inverseScore(fixedCommitmentRatio, 20, 65), weight: 0.18 },
    { score: dueSoonBills.length === 0 ? 78 : inverseScore(dueSoonBills.length, 1, 6), weight: 0.15 },
  ]) - overduePenalty, 0, 100)
  const growth = clamp(weightedAverage([
    { score: marginScoreStrict, weight: 0.42 },
    { score: dailyNet > 0 ? scoreRatio(dailyNet, Math.max(entradas / daysInMonth * 0.18, 1), 35) : 8, weight: 0.28 },
    { score: pulse.safeToSpend > 0 ? scoreRatio(pulse.safeToSpend, Math.max(entradas * 0.12, 1), 25) : 0, weight: 0.18 },
    { score: reserveMonths >= 1 ? 62 : 24, weight: 0.12 },
  ]), 0, 100)
  const consistency = clamp(weightedAverage([
    { score: dataCoverage, weight: 0.38 },
    { score: volatilityScore, weight: 0.22 },
    { score: pulse.alerts.some(a => a.severity === 'danger') ? 28 : 76, weight: 0.20 },
    { score: fluxoDays >= Math.min(day, 12) ? 72 : scoreRatio(fluxoDays, Math.min(day, 12), 10), weight: 0.20 },
  ]) - overduePenalty * 0.4, 0, 100)
  const predictability = clamp(weightedAverage([
    { score: recurringSignal > 0 ? scoreRatio(recurringSignal, 4, 35) : 24, weight: 0.22 },
    { score: budgetCoverage, weight: 0.24 },
    { score: cartoes?.length ? 66 : 35, weight: 0.14 },
    { score: dueSoonBills.length ? 70 : 42, weight: 0.12 },
    { score: dataCoverage, weight: 0.18 },
    { score: health ? 72 : 38, weight: 0.10 },
  ]) - Math.max(0, cardInstallments.length - 3) * 3, 0, 100)
  const cashFlow = clamp(weightedAverage([
    { score: projectionScore, weight: 0.38 },
    { score: marginScoreStrict, weight: 0.24 },
    { score: volatilityScore, weight: 0.20 },
    { score: inverseScore(fixedCommitmentRatio, 20, 70), weight: 0.18 },
  ]) - overduePenalty, 0, 100)
  const reserve = clamp(weightedAverage([
    { score: scoreRatio(reserveMonths, 6, 0), weight: 0.55 },
    { score: pulse.safeToSpend > 0 ? scoreRatio(pulse.safeToSpend, Math.max(entradas * 0.15, 1), 20) : 0, weight: 0.20 },
    { score: saldo > futureBills * 2 ? 80 : saldo > futureBills ? 58 : 20, weight: 0.25 },
  ]), 0, 100)

  const atomicPillars: ArwFinHealthPillar[] = [
    {
      key: 'liquidez',
      name: 'Liquidez',
      score: liquidity,
      weight: 14,
      icon: ICONS.finance.liquidity,
      color: scoreColor(liquidity),
      description: 'Folga imediata para atravessar o mês sem sufocamento.',
      action: liquidity < 60 ? 'Reduza saídas variáveis e proteja caixa nos próximos dias.' : 'Sua liquidez atual dá margem para decisões mais conscientes.',
    },
    {
      key: 'estabilidade',
      name: 'Estabilidade',
      score: stability,
      weight: 10,
      icon: ICONS.health.pulse,
      color: scoreColor(stability),
      description: 'Regularidade do mês e risco de oscilações perigosas.',
      action: stability < 60 ? 'Defina limites por categoria para reduzir volatilidade.' : 'O padrão do mês está relativamente estável.',
    },
    {
      key: 'controle',
      name: 'Controle',
      score: control,
      weight: 10,
      icon: ICONS.finance.adjustment,
      color: scoreColor(control),
      description: 'Nível de organização: categorias, orçamento e leitura ativa.',
      action: control < 60 ? 'Cadastre orçamento e categorias para sair do modo reativo.' : 'Você já possui bons sinais de organização financeira.',
    },
    {
      key: 'credito',
      name: 'Dependência de crédito',
      score: creditDependency,
      weight: 12,
      icon: ICONS.finance.card,
      color: scoreColor(creditDependency),
      description: 'Pressão dos cartões e parcelamentos sobre renda futura.',
      action: creditDependency < 60 ? 'Evite novos parcelamentos até a pressão do cartão cair.' : 'Crédito ainda não domina sua leitura financeira.',
    },
    {
      key: 'seguranca',
      name: 'Segurança',
      score: security,
      weight: 10,
      icon: ICONS.finance.reserve,
      color: scoreColor(security),
      description: 'Capacidade de absorver imprevistos e contas futuras.',
      action: security < 60 ? 'Monte uma reserva mínima antes de aumentar gastos flexíveis.' : 'Sua margem de segurança está respirando melhor.',
    },
    {
      key: 'crescimento',
      name: 'Crescimento',
      score: growth,
      weight: 9,
      icon: ICONS.finance.income,
      color: scoreColor(growth),
      description: 'Tendência de evolução patrimonial no mês.',
      action: growth < 60 ? 'O mês está mais em sobrevivência que evolução.' : 'Há sinal de construção financeira positiva.',
    },
    {
      key: 'consistencia',
      name: 'Consistência',
      score: consistency,
      weight: 9,
      icon: ICONS.finance.recurring,
      color: scoreColor(consistency),
      description: 'Repetição de comportamento controlado e registro financeiro.',
      action: consistency < 60 ? 'Crie o hábito de revisar o app em dias alternados.' : 'Seu padrão já gera leitura suficiente para previsões.',
    },
    {
      key: 'previsibilidade',
      name: 'Previsibilidade',
      score: predictability,
      weight: 8,
      icon: ICONS.health.forecast,
      color: scoreColor(predictability),
      description: 'Quanto o sistema consegue prever do seu futuro financeiro.',
      action: predictability < 60 ? 'Cadastre recorrências, assinaturas e vencimentos fixos.' : 'Seu futuro financeiro está ficando mais legível.',
    },
    {
      key: 'fluxo',
      name: 'Saúde do fluxo',
      score: cashFlow,
      weight: 10,
      icon: ICONS.chart.wave,
      color: scoreColor(cashFlow),
      description: 'Velocidade de entrada, saída e risco de buracos no caixa.',
      action: cashFlow < 60 ? 'A curva de caixa pede contenção nos próximos dias.' : 'O fluxo atual sustenta uma leitura saudável.',
    },
    {
      key: 'reserva',
      name: 'Reserva',
      score: reserve,
      weight: 8,
      icon: ICONS.finance.savings,
      color: scoreColor(reserve),
      description: 'Proteção financeira estimada em meses de sobrevivência.',
      action: reserve < 60 ? 'Priorize reserva antes de metas de consumo.' : 'Sua reserva estimada reduz ansiedade financeira.',
    },
  ].map(pillar => {
    const base = {
      ...pillar,
      impact: Number((pillar.score * (pillar.weight / 100)).toFixed(2)),
      classification: pillarClassification(pillar.score),
    }

    if (pillar.key === 'liquidez') {
      return {
        ...base,
        formula: 'Combina saldo atual, fechamento projetado, contas futuras e dias de sobrevivência pelo ritmo de gasto.',
        subMetrics: [
          { name: 'Dias de sobrevivência', value: `${Math.min(survivalDays, 365)} dias`, score: liquidity, range: '0-90 dias', ideal: '30+ dias' },
          { name: 'Fechamento projetado', value: formatBRL(pulse.projectedClosing), score: pulse.projectedClosing >= 0 ? 82 : 28, range: 'negativo-positivo', ideal: 'positivo' },
          { name: 'Contas futuras', value: formatBRL(futureBills), score: futureBills <= Math.max(entradas * 0.25, 1) ? 76 : 42, range: '0-25% da renda', ideal: 'baixo impacto' },
        ],
        improvements: liquidity < 80 ? [
          { action: 'Reduzir gasto variável nos próximos 7 dias para proteger caixa.', gain: 4.2, href: '/dashboard/categorias', label: 'Ver categorias' },
          { action: 'Adicionar contas futuras para melhorar a previsão de sufocamento.', gain: 2.4, href: '/dashboard/contas', label: 'Abrir contas' },
        ] : [],
      }
    }

    if (pillar.key === 'estabilidade') {
      return {
        ...base,
        formula: 'Lê volatilidade de margem, pressão de orçamento e previsibilidade do padrão mensal.',
        subMetrics: [
          { name: 'Margem mensal', value: `${Math.round(pulse.marginPercent)}%`, score: stability, range: '-50% a +50%', ideal: '15%+' },
          { name: 'Uso do orçamento', value: `${Math.round(budgetUsage)}%`, score: budgetUsage > 0 ? clamp(120 - budgetUsage, 0, 100) : 55, range: '0-100%', ideal: 'até 80%' },
        ],
        improvements: stability < 80 ? [
          { action: 'Definir limites para as categorias mais voláteis do mês.', gain: 3.8, href: '/dashboard/orcamento', label: 'Ajustar orçamento' },
        ] : [],
      }
    }

    if (pillar.key === 'controle') {
      return {
        ...base,
        formula: 'Avalia se há orçamento, categorias, histórico e leitura ativa suficiente para sair do modo reativo.',
        subMetrics: [
          { name: 'Categorias detectadas', value: `${categorias?.length ?? 0}`, score: categorias?.length ? 78 : 30, range: '0-10+', ideal: '5+' },
          { name: 'Orçamentos ativos', value: `${orcamentos?.length ?? 0}`, score: orcamentos?.length ? 82 : 35, range: '0-10+', ideal: '3+' },
          { name: 'Score salvo', value: health ? 'Sim' : 'Não', score: health ? 80 : 40, range: 'não/sim', ideal: 'sim' },
        ],
        improvements: control < 80 ? [
          { action: 'Cadastrar orçamento por categoria para transformar gastos em plano.', gain: 5.1, href: '/dashboard/orcamento', label: 'Planejar' },
          { action: 'Importar histórico para aumentar profundidade analítica.', gain: 4.6, href: '/dashboard/importar', label: 'Importar' },
        ] : [],
      }
    }

    if (pillar.key === 'credito') {
      return {
        ...base,
        formula: 'Mede pressão de limite, uso do cartão e quantidade de parcelamentos que comprometem renda futura.',
        subMetrics: [
          { name: 'Uso de limite', value: `${Math.round(cardUsage)}%`, score: creditDependency, range: '0-100%', ideal: 'até 30%' },
          { name: 'Parcelamentos ativos', value: `${cardInstallments.length}`, score: clamp(100 - cardInstallments.length * 8, 0, 100), range: '0-10+', ideal: '0-2' },
        ],
        improvements: creditDependency < 80 ? [
          { action: 'Pausar novos parcelamentos até o uso do cartão voltar para zona segura.', gain: 4.8, href: '/dashboard/cartoes', label: 'Ver cartões' },
        ] : [],
      }
    }

    if (pillar.key === 'seguranca') {
      return {
        ...base,
        formula: 'Cruza reserva estimada, folga sobre vencimentos e margem de caixa contra imprevistos.',
        subMetrics: [
          { name: 'Meses de reserva estimada', value: `${reserveMonths.toFixed(1)} meses`, score: security, range: '0-6 meses', ideal: '3+ meses' },
          { name: 'Cobertura de vencimentos', value: saldo > futureBills ? 'Coberto' : 'Descoberto', score: saldo > futureBills ? 78 : 35, range: 'descoberto/coberto', ideal: 'coberto' },
        ],
        improvements: security < 80 ? [
          { action: 'Separar uma reserva mínima antes de ampliar consumo flexível.', gain: 4.4, href: '/dashboard/metas', label: 'Criar meta' },
        ] : [],
      }
    }

    if (pillar.key === 'crescimento') {
      return {
        ...base,
        formula: 'Observa margem, saldo diário líquido e tendência de construção patrimonial no mês.',
        subMetrics: [
          { name: 'Saldo do mês', value: formatBRL(saldo), score: growth, range: 'negativo-positivo', ideal: 'positivo' },
          { name: 'Saldo médio diário', value: formatBRL(dailyNet), score: dailyNet > 0 ? 76 : 38, range: 'negativo-positivo', ideal: 'positivo' },
        ],
        improvements: growth < 80 ? [
          { action: 'Criar uma meta de acumulação para transformar sobra em evolução patrimonial.', gain: 3.6, href: '/dashboard/metas', label: 'Ver metas' },
        ] : [],
      }
    }

    if (pillar.key === 'consistencia') {
      return {
        ...base,
        formula: 'Mede repetição de leitura financeira, dados no fluxo e ausência de alertas críticos.',
        subMetrics: [
          { name: 'Dias com fluxo', value: `${fluxo?.length ?? 0}`, score: consistency, range: '0-30', ideal: '15+' },
          { name: 'Alertas críticos', value: `${pulse.alerts.filter(a => a.severity === 'danger').length}`, score: pulse.alerts.some(a => a.severity === 'danger') ? 35 : 78, range: '0-3+', ideal: '0' },
        ],
        improvements: consistency < 80 ? [
          { action: 'Revisar o app em dias alternados para construir histórico comportamental.', gain: 2.7, href: '/dashboard', label: 'Home' },
        ] : [],
      }
    }

    if (pillar.key === 'previsibilidade') {
      return {
        ...base,
        formula: 'Quanto mais recorrências, orçamento, cartões e vencimentos cadastrados, mais o sistema consegue prever.',
        subMetrics: [
          { name: 'Recorrências próximas', value: `${recurringSignal}`, score: predictability, range: '0-10+', ideal: 'mapeadas' },
          { name: 'Parcelamentos mapeados', value: `${cardInstallments.length}`, score: cardInstallments.length ? 70 : 52, range: '0-10+', ideal: 'mapeados' },
        ],
        improvements: predictability < 80 ? [
          { action: 'Cadastrar recorrências e vencimentos fixos para melhorar previsão de caixa.', gain: 4.0, href: '/dashboard/contas', label: 'Mapear' },
        ] : [],
      }
    }

    if (pillar.key === 'fluxo') {
      return {
        ...base,
        formula: 'Compara velocidade de entradas e saídas, fechamento projetado e risco de buracos financeiros.',
        subMetrics: [
          { name: 'Queima diária', value: formatBRL(pulse.dailyBurn), score: cashFlow, range: '0-renda diária', ideal: 'controlada' },
          { name: 'Fechamento', value: formatBRL(pulse.projectedClosing), score: pulse.projectedClosing >= 0 ? 82 : 30, range: 'negativo-positivo', ideal: 'positivo' },
        ],
        improvements: cashFlow < 80 ? [
          { action: 'Reduzir a categoria dominante para suavizar a curva dos próximos dias.', gain: 4.9, href: '/dashboard/categorias', label: 'Analisar' },
        ] : [],
      }
    }

    return {
      ...base,
      formula: 'Estima proteção financeira a partir do caixa atual, ritmo de saídas e capacidade de atravessar meses sem renda.',
      subMetrics: [
        { name: 'Reserva estimada', value: `${reserveMonths.toFixed(1)} meses`, score: reserve, range: '0-6 meses', ideal: '3+ meses' },
        { name: 'Safe to spend', value: formatBRL(pulse.safeToSpend), score: pulse.safeToSpend > 0 ? 76 : 32, range: '0+', ideal: 'positivo' },
      ],
      improvements: reserve < 80 ? [
        { action: 'Criar ou reforçar uma meta de reserva financeira.', gain: 4.7, href: '/dashboard/metas', label: 'Criar reserva' },
      ] : [],
    }
  })

  const byKey = new Map(atomicPillars.map(pillar => [pillar.key, pillar]))
  const getAtomic = (key: string) => byKey.get(key)
  const makeCompositePillar = ({
    key,
    name,
    icon,
    weight,
    keys,
    description,
    formula,
    actionOk,
    actionBad,
  }: {
    key: string
    name: string
    icon: string
    weight: number
    keys: string[]
    description: string
    formula: string
    actionOk: string
    actionBad: string
  }): ArwFinHealthPillar => {
    const source = keys.map(getAtomic).filter(Boolean) as ArwFinHealthPillar[]
    const sourceScore = source.length
      ? weightedAverage(source.map((pillar, index) => ({
        score: pillar.score,
        weight: index === 0 ? 0.58 : 0.42,
      }))) - Math.max(0, 58 - Math.min(...source.map(pillar => pillar.score))) * 0.22
      : 0
    const score = Math.round(clamp(sourceScore, 0, 100))
    const color = scoreColor(score)

    return {
      key,
      name,
      score,
      weight,
      impact: Number((score * (weight / 100)).toFixed(2)),
      classification: pillarClassification(score),
      icon,
      color,
      description,
      action: score < 70 ? actionBad : actionOk,
      formula,
      subMetrics: source.flatMap(pillar => pillar.subMetrics),
      improvements: source.flatMap(pillar => pillar.improvements).sort((a, b) => b.gain - a.gain).slice(0, 3),
    }
  }

  const pillars: ArwFinHealthPillar[] = [
    makeCompositePillar({
      key: 'caixa',
      name: 'Caixa & Liquidez',
      icon: ICONS.finance.liquidity,
      weight: 24,
      keys: ['liquidez', 'fluxo'],
      description: 'Capacidade de atravessar o mês, manter caixa positivo e evitar buracos financeiros.',
      formula: 'Combina liquidez imediata, saúde do fluxo, fechamento projetado, queima diária e contas futuras.',
      actionOk: 'Seu caixa tem fôlego e o fluxo sustenta decisões com menos ansiedade.',
      actionBad: 'Proteja caixa agora: reduza saídas variáveis e revise vencimentos próximos.',
    }),
    makeCompositePillar({
      key: 'controle',
      name: 'Controle & Planejamento',
      icon: ICONS.finance.adjustment,
      weight: 22,
      keys: ['controle', 'estabilidade'],
      description: 'Qualidade do planejamento, orçamento, categorização e estabilidade do padrão mensal.',
      formula: 'Soma sinais de orçamento ativo, categorias, histórico, margem mensal e pressão de limites por categoria.',
      actionOk: 'Você está conduzindo o dinheiro com plano, não apenas reagindo aos gastos.',
      actionBad: 'Defina limites por categoria e organize o orçamento para reduzir volatilidade.',
    }),
    makeCompositePillar({
      key: 'credito',
      name: 'Crédito & Compromissos',
      icon: ICONS.finance.card,
      weight: 20,
      keys: ['credito', 'previsibilidade'],
      description: 'Pressão de cartão, parcelamentos, recorrências e previsibilidade de obrigações futuras.',
      formula: 'Combina uso de cartão, parcelamentos, recorrências, vencimentos fixos e capacidade de previsão.',
      actionOk: 'Crédito e compromissos estão legíveis e sob controle.',
      actionBad: 'Reduza novos parcelamentos e cadastre recorrências para antecipar sufocamento.',
    }),
    makeCompositePillar({
      key: 'seguranca',
      name: 'Segurança & Reserva',
      icon: ICONS.finance.reserve,
      weight: 18,
      keys: ['seguranca', 'reserva'],
      description: 'Proteção contra imprevistos, reserva estimada e cobertura de vencimentos.',
      formula: 'Avalia meses de reserva, cobertura de contas futuras, safe-to-spend e margem para emergências.',
      actionOk: 'Sua proteção financeira reduz risco emocional e dá margem para respirar.',
      actionBad: 'Priorize reserva e reduza exposição antes de ampliar consumo flexível.',
    }),
    makeCompositePillar({
      key: 'evolucao',
      name: 'Evolução & Consistência',
      icon: ICONS.finance.income,
      weight: 16,
      keys: ['crescimento', 'consistencia'],
      description: 'Tendência de evolução patrimonial e repetição de comportamento financeiro saudável.',
      formula: 'Lê saldo do mês, saldo médio diário, frequência de dados no fluxo e ausência de alertas críticos.',
      actionOk: 'Existe sinal de evolução e consistência no comportamento financeiro.',
      actionBad: 'Transforme sobra em meta e revise o app com frequência para criar consistência.',
    }),
  ]

  const rawScore = pillars.reduce((sum, pillar) => sum + pillar.score * (pillar.weight / 100), 0)
  const systemicPenalty = clamp(
    (pulse.projectedClosing < 0 ? 10 : 0) +
    overdueBills.length * 9 +
    Math.max(0, cardUsage - 55) * 0.16 +
    Math.max(0, budgetUsage - 85) * 0.14 +
    Math.max(0, categoryConcentration - 45) * 0.12 +
    (dataCoverage < 55 ? 6 : 0),
    0,
    28,
  )
  const weakestPillarDrag = Math.max(0, 52 - Math.min(...pillars.map(pillar => pillar.score))) * 0.18
  const score = Math.round(clamp(rawScore - systemicPenalty - weakestPillarDrag, 0, 100))
  const recovery = score >= 78 ? 'verde' : score >= 52 ? 'amarelo' : 'vermelho'
  const pressure = Math.round(clamp(100 - score + systemicPenalty + Math.max(cardUsage - 45, 0) * 0.25 + Math.max(budgetUsage - 75, 0) * 0.22, 0, 100))
  const focus = pillars
    .flatMap(pillar => pillar.improvements.map(improvement => ({
      pillar: pillar.name,
      icon: pillar.icon,
      color: pillar.color,
      ...improvement,
    })))
    .sort((a, b) => b.gain - a.gain)
    .slice(0, 4)
  const potentialGain = focus.reduce((sum, item) => sum + item.gain, 0)
  const potentialScore = Math.round(clamp(score + potentialGain * 0.72, 0, 96))
  const achievements: ArwFinHealth['achievements'] = [
    {
      id: 'cash-positive',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Caixa respirando',
      description: 'Fechamento projetado positivo, margem mínima e sem contas atrasadas.',
      icon: ICONS.health.survival,
      unlocked: pulse.projectedClosing > entradas * 0.08 && pulse.marginPercent >= 12 && overdueBills.length === 0,
      progress: clamp(weightedAverage([
        { score: projectionScore, weight: 0.45 },
        { score: marginScoreStrict, weight: 0.35 },
        { score: overdueBills.length === 0 ? 100 : 20, weight: 0.20 },
      ]), 0, 100),
    },
    {
      id: 'survival-60',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: '60 dias de fôlego',
      description: 'Liquidez estimada cobre dois meses de ritmo atual.',
      icon: ICONS.health.survival,
      unlocked: survivalDays >= 60 && pulse.projectedClosing > 0,
      progress: clamp(weightedAverage([
        { score: scoreRatio(survivalDays, 60, 0), weight: 0.72 },
        { score: projectionScore, weight: 0.28 },
      ]), 0, 100),
    },
    {
      id: 'no-overdue',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Sem atraso',
      description: 'Nenhuma conta vencida detectada no radar atual.',
      icon: ICONS.status.paid,
      unlocked: overdueBills.length === 0 && dueSoonBills.length > 0,
      progress: overdueBills.length === 0 ? 100 : 20,
    },
    {
      id: 'safe-to-spend-positive',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Margem livre positiva',
      description: 'Safe-to-spend positivo sem consumir toda a projeção.',
      icon: ICONS.finance.safeSpend,
      unlocked: pulse.safeToSpend >= entradas * 0.08 && pulse.projectedClosing > 0,
      progress: scoreRatio(pulse.safeToSpend, Math.max(entradas * 0.08, 1), 0),
    },
    {
      id: 'bills-covered',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Vencimentos cobertos',
      description: 'Saldo atual cobre vencimentos próximos com folga.',
      icon: ICONS.finance.bill,
      unlocked: futureBills > 0 && saldo >= futureBills * 1.5,
      progress: futureBills > 0 ? scoreRatio(saldo, futureBills * 1.5, 0) : 0,
    },
    {
      id: 'low-fixed-pressure',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Compromissos leves',
      description: 'Vencimentos futuros abaixo de 20% da renda do mês.',
      icon: ICONS.finance.liquidity,
      unlocked: entradas > 0 && fixedCommitmentRatio <= 20,
      progress: entradas > 0 ? inverseScore(fixedCommitmentRatio, 20, 65) : 0,
    },
    {
      id: 'survival-90',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: '90 dias blindados',
      description: 'Liquidez cobre três meses de ritmo atual.',
      icon: ICONS.finance.reserve,
      unlocked: survivalDays >= 90,
      progress: scoreRatio(survivalDays, 90, 0),
    },
    {
      id: 'positive-projection-buffer',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Projeção com folga',
      description: 'Fechamento projetado acima de 15% da renda.',
      icon: ICONS.finance.projection,
      unlocked: pulse.projectedClosing >= entradas * 0.15 && entradas > 0,
      progress: scoreRatio(pulse.projectedClosing, Math.max(entradas * 0.15, 1), 0),
    },
    {
      id: 'daily-burn-controlled',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Queima controlada',
      description: 'Saída diária abaixo de 75% da entrada diária estimada.',
      icon: ICONS.finance.dailyBurn,
      unlocked: entradas > 0 && pulse.dailyBurn <= (entradas / daysInMonth) * 0.75,
      progress: entradas > 0 ? inverseScore((pulse.dailyBurn / Math.max(entradas / daysInMonth, 1)) * 100, 75, 140) : 0,
    },
    {
      id: 'cash-no-critical-alerts',
      category: 'cash',
      categoryLabel: 'Caixa & Segurança',
      name: 'Sem alerta crítico',
      description: 'Nenhum alerta crítico ativo no radar financeiro.',
      icon: ICONS.status.success,
      unlocked: !pulse.alerts.some(alert => alert.severity === 'danger'),
      progress: pulse.alerts.some(alert => alert.severity === 'danger') ? 30 : 100,
    },
    {
      id: 'credit-safe',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Crédito sob controle',
      description: 'Uso de cartão baixo, poucos parcelamentos e baixa pressão sobre a renda.',
      icon: ICONS.finance.card,
      unlocked: cardUsage <= 35 && cardInstallments.length <= 2 && installmentPressure <= 12,
      progress: clamp(creditDependency, 0, 100),
    },
    {
      id: 'installment-light',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Parcelamento leve',
      description: 'Poucos parcelamentos e baixa pressão sobre a renda.',
      icon: ICONS.finance.recurring,
      unlocked: cardInstallments.length <= 1 && installmentPressure <= 8 && (comprasCartao?.length ?? 0) > 0,
      progress: clamp(weightedAverage([
        { score: inverseScore(cardInstallments.length, 1, 6), weight: 0.5 },
        { score: inverseScore(installmentPressure, 8, 30), weight: 0.5 },
      ]), 0, 100),
    },
    {
      id: 'limit-master',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Limite inteligente',
      description: 'Uso de cartão abaixo de 25% com fatura mapeada.',
      icon: ICONS.finance.card,
      unlocked: cardUsage > 0 && cardUsage <= 25 && (cartoes?.length ?? 0) > 0,
      progress: cardUsage > 0 ? inverseScore(cardUsage, 25, 75) : 0,
    },
    {
      id: 'no-installments',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Sem parcelamentos',
      description: 'Nenhuma compra parcelada pressionando meses futuros.',
      icon: ICONS.finance.recurring,
      unlocked: (comprasCartao?.length ?? 0) > 0 && cardInstallments.length === 0,
      progress: inverseScore(cardInstallments.length, 0, 5),
    },
    {
      id: 'card-under-50',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Uso abaixo de 50%',
      description: 'Limite usado permanece fora da zona de pressão.',
      icon: ICONS.finance.card,
      unlocked: cardUsage > 0 && cardUsage <= 50,
      progress: cardUsage > 0 ? inverseScore(cardUsage, 50, 95) : 0,
    },
    {
      id: 'installment-pressure-low',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Parcelas leves',
      description: 'Parcelamentos abaixo de 10% da renda do mês.',
      icon: ICONS.finance.adjustment,
      unlocked: entradas > 0 && installmentPressure <= 10 && cardInstallments.length > 0,
      progress: entradas > 0 ? inverseScore(installmentPressure, 10, 35) : 0,
    },
    {
      id: 'credit-mapped',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Crédito mapeado',
      description: 'Cartões cadastrados para leitura de fatura e limite.',
      icon: ICONS.finance.card,
      unlocked: (cartoes?.length ?? 0) >= 1,
      progress: scoreRatio(cartoes?.length ?? 0, 1, 0),
    },
    {
      id: 'credit-no-danger',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Fora da zona crítica',
      description: 'Uso de cartão abaixo de 80% e sem excesso de parcelas.',
      icon: ICONS.status.success,
      unlocked: cardUsage < 80 && cardInstallments.length <= 4,
      progress: weightedAverage([
        { score: inverseScore(cardUsage, 80, 100), weight: 0.6 },
        { score: inverseScore(cardInstallments.length, 4, 10), weight: 0.4 },
      ]),
    },
    {
      id: 'future-credit-light',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Futuro leve',
      description: 'Compras parceladas não dominam a renda futura.',
      icon: ICONS.health.forecast,
      unlocked: installmentPressure <= 15 && cardInstallments.length <= 3,
      progress: weightedAverage([
        { score: inverseScore(installmentPressure, 15, 45), weight: 0.65 },
        { score: inverseScore(cardInstallments.length, 3, 9), weight: 0.35 },
      ]),
    },
    {
      id: 'credit-discipline',
      category: 'credit',
      categoryLabel: 'Crédito & Dívida',
      name: 'Disciplina de crédito',
      description: 'Uso moderado com dados de cartão suficientes.',
      icon: ICONS.health.trophy,
      unlocked: cardUsage > 0 && cardUsage <= 40 && (comprasCartao?.length ?? 0) >= 2,
      progress: weightedAverage([
        { score: cardUsage > 0 ? inverseScore(cardUsage, 40, 85) : 0, weight: 0.7 },
        { score: scoreRatio(comprasCartao?.length ?? 0, 2, 0), weight: 0.3 },
      ]),
    },
    {
      id: 'budget-aware',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Plano financeiro',
      description: 'Orçamento cobre a maior parte das categorias e está dentro da zona saudável.',
      icon: ICONS.finance.budget,
      unlocked: budgetCoverage >= 70 && budgetUsage > 0 && budgetUsage <= 82,
      progress: clamp(weightedAverage([
        { score: budgetCoverage, weight: 0.55 },
        { score: budgetUsage > 0 ? inverseScore(budgetUsage, 70, 115) : 15, weight: 0.45 },
      ]), 0, 100),
    },
    {
      id: 'data-discipline',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Disciplina de dados',
      description: 'Cobertura de dados consistente para leituras confiáveis.',
      icon: ICONS.finance.adjustment,
      unlocked: dataCoverage >= 75 && fluxoDays >= 12 && (categorias?.length ?? 0) >= 5,
      progress: clamp(weightedAverage([
        { score: dataCoverage, weight: 0.55 },
        { score: scoreRatio(fluxoDays, 12, 0), weight: 0.25 },
        { score: scoreRatio(categorias?.length ?? 0, 5, 0), weight: 0.20 },
      ]), 0, 100),
    },
    {
      id: 'budget-coverage',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Cobertura de orçamento',
      description: 'Orçamento cobre pelo menos 85% das categorias relevantes.',
      icon: ICONS.finance.budget,
      unlocked: budgetCoverage >= 85 && (categorias?.length ?? 0) >= 5,
      progress: budgetCoverage,
    },
    {
      id: 'categories-5',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Mapa de hábitos',
      description: 'Pelo menos 5 categorias com dados para análise comportamental.',
      icon: ICONS.finance.category,
      unlocked: (categorias?.length ?? 0) >= 5,
      progress: scoreRatio(categorias?.length ?? 0, 5, 0),
    },
    {
      id: 'categories-8',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Mapa avançado',
      description: 'Pelo menos 8 categorias revelando nuances de consumo.',
      icon: ICONS.category.shopping,
      unlocked: (categorias?.length ?? 0) >= 8,
      progress: scoreRatio(categorias?.length ?? 0, 8, 0),
    },
    {
      id: 'flow-12-days',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: '12 dias rastreados',
      description: 'Fluxo com dados em 12 dias do mês.',
      icon: ICONS.chart.area,
      unlocked: fluxoDays >= 12,
      progress: scoreRatio(fluxoDays, 12, 0),
    },
    {
      id: 'flow-20-days',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: '20 dias rastreados',
      description: 'Histórico denso o suficiente para previsão mais confiável.',
      icon: ICONS.health.timeline,
      unlocked: fluxoDays >= 20,
      progress: scoreRatio(fluxoDays, 20, 0),
    },
    {
      id: 'budget-under-80',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Orçamento no trilho',
      description: 'Uso geral do orçamento abaixo de 80%.',
      icon: ICONS.finance.budget,
      unlocked: budgetUsage > 0 && budgetUsage <= 80,
      progress: budgetUsage > 0 ? inverseScore(budgetUsage, 80, 120) : 0,
    },
    {
      id: 'stable-flow',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Fluxo estável',
      description: 'Baixa volatilidade nos movimentos diários.',
      icon: ICONS.chart.wave,
      unlocked: volatilityScore >= 75 && fluxoDays >= 6,
      progress: volatilityScore,
    },
    {
      id: 'predictable-month',
      category: 'discipline',
      categoryLabel: 'Disciplina & Planejamento',
      name: 'Mês previsível',
      description: 'Recorrências, orçamento e dados suficientes para projeção.',
      icon: ICONS.health.forecast,
      unlocked: recurringSignal >= 2 && budgetCoverage >= 70 && dataCoverage >= 70,
      progress: weightedAverage([
        { score: scoreRatio(recurringSignal, 2, 0), weight: 0.3 },
        { score: budgetCoverage, weight: 0.35 },
        { score: dataCoverage, weight: 0.35 },
      ]),
    },
    {
      id: 'reserve-builder',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Reserva em construção',
      description: 'Reserva estimada acima de três meses e vencimentos cobertos.',
      icon: ICONS.finance.savings,
      unlocked: reserveMonths >= 3 && saldo > futureBills * 1.5,
      progress: clamp(weightedAverage([
        { score: scoreRatio(reserveMonths, 3, 0), weight: 0.7 },
        { score: saldo > futureBills * 1.5 ? 100 : saldo > futureBills ? 62 : 25, weight: 0.3 },
      ]), 0, 100),
    },
    {
      id: 'positive-margin',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Margem de evolução',
      description: 'Margem mensal acima de 20% com saldo positivo.',
      icon: ICONS.finance.income,
      unlocked: pulse.marginPercent >= 20 && saldo > 0,
      progress: clamp(weightedAverage([
        { score: scoreRatio(pulse.marginPercent, 20, 0), weight: 0.7 },
        { score: saldo > 0 ? 100 : 0, weight: 0.3 },
      ]), 0, 100),
    },
    {
      id: 'balanced-spending',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Consumo equilibrado',
      description: 'Gastos sem concentração excessiva em uma única categoria.',
      icon: ICONS.finance.category,
      unlocked: categoryConcentration > 0 && categoryConcentration <= 35 && (categorias?.length ?? 0) >= 4,
      progress: clamp(inverseScore(categoryConcentration, 35, 70), 0, 100),
    },
    {
      id: 'finhealth-elite',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Elite FinHealth',
      description: 'Score acima de 88 sem penalidade sistêmica relevante.',
      icon: ICONS.health.trophy,
      unlocked: score >= 88 && systemicPenalty <= 4,
      progress: clamp(weightedAverage([
        { score: scoreRatio(score, 88, 0), weight: 0.75 },
        { score: inverseScore(systemicPenalty, 4, 18), weight: 0.25 },
      ]), 0, 100),
    },
    {
      id: 'reserve-6-months',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Reserva robusta',
      description: 'Reserva estimada acima de seis meses.',
      icon: ICONS.finance.reserve,
      unlocked: reserveMonths >= 6,
      progress: scoreRatio(reserveMonths, 6, 0),
    },
    {
      id: 'score-72',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'FinHealth forte',
      description: 'Score acima de 72 com leitura consistente.',
      icon: ICONS.health.score,
      unlocked: score >= 72 && dataCoverage >= 60,
      progress: weightedAverage([
        { score: scoreRatio(score, 72, 0), weight: 0.7 },
        { score: dataCoverage, weight: 0.3 },
      ]),
    },
    {
      id: 'score-80',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Zona premium',
      description: 'Score acima de 80 sem depender de poucos dados.',
      icon: ICONS.brand.premium,
      unlocked: score >= 80 && dataCoverage >= 70,
      progress: weightedAverage([
        { score: scoreRatio(score, 80, 0), weight: 0.72 },
        { score: dataCoverage, weight: 0.28 },
      ]),
    },
    {
      id: 'low-systemic-risk',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Risco sistêmico baixo',
      description: 'Penalidades cruzadas quase inexistentes.',
      icon: ICONS.health.radar,
      unlocked: systemicPenalty <= 3 && score >= 60,
      progress: inverseScore(systemicPenalty, 3, 18),
    },
    {
      id: 'positive-safe-spend',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Gasto consciente',
      description: 'Safe-to-spend positivo e margem mensal saudável.',
      icon: ICONS.finance.safeSpend,
      unlocked: pulse.safeToSpend > entradas * 0.1 && pulse.marginPercent >= 15,
      progress: weightedAverage([
        { score: scoreRatio(pulse.safeToSpend, Math.max(entradas * 0.1, 1), 0), weight: 0.55 },
        { score: scoreRatio(pulse.marginPercent, 15, 0), weight: 0.45 },
      ]),
    },
    {
      id: 'growth-no-drag',
      category: 'growth',
      categoryLabel: 'Evolução & Reserva',
      name: 'Sem pilar âncora',
      description: 'Nenhum pilar vital abaixo de 55 pontos.',
      icon: ICONS.health.pulse,
      unlocked: Math.min(...pillars.map(pillar => pillar.score)) >= 55,
      progress: scoreRatio(Math.min(...pillars.map(pillar => pillar.score)), 55, 0),
    },
  ]

  const riskRadar = pillars.map(pillar => ({
    subject: pillar.name.split(' & ')[0],
    value: Math.round(pillar.score),
    fullMark: 100,
  }))

  const timeline: ArwFinHealthTimelineEvent[] = [
    {
      title: recovery === 'verde' ? 'Recovery financeiro saudável' : recovery === 'amarelo' ? 'Recovery em atenção' : 'Recovery crítico',
      description: recovery === 'verde'
        ? 'Os sinais vitais do mês indicam estabilidade e margem.'
        : recovery === 'amarelo'
          ? 'Há pressão suficiente para exigir revisão consciente.'
          : 'O sistema detectou risco de sufocamento financeiro.',
      type: recovery === 'verde' ? 'positive' : recovery === 'amarelo' ? 'warning' : 'danger',
      icon: ICONS.health.recovery,
    },
    {
      title: 'Previsão de fechamento',
      description: `Seu fechamento projetado está em ${pulse.projectedClosing.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
      type: pulse.projectedClosing >= 0 ? 'positive' : 'danger',
      icon: ICONS.health.timeline,
    },
    {
      title: topCategory ? `Categoria dominante: ${topCategory.nome}` : 'Padrão de consumo ainda invisível',
      description: topCategory
        ? `${Math.round(topCategory.percentual)}% das saídas estão concentradas nessa categoria.`
        : 'Lance mais despesas para revelar comportamento financeiro.',
      type: topCategory && topCategory.percentual > 45 ? 'warning' : 'neutral',
      icon: ICONS.finance.category,
    },
    {
      title: 'Pressão do cartão',
      description: cardUsage > 0 ? `Uso de crédito em ${Math.round(cardUsage)}% no ciclo atual.` : 'Cartões ainda não estão cadastrados no radar.',
      type: cardUsage >= 60 ? 'warning' : 'neutral',
      icon: ICONS.finance.card,
    },
  ]

  const insights = [
    survivalDays >= 30
      ? `Sua liquidez estimada cobre cerca de ${survivalDays} dias no ritmo atual.`
      : `Existe risco nos próximos ${Math.max(survivalDays, 1)} dias se o ritmo de saída continuar.`,
    cardInstallments.length > 0
      ? `${cardInstallments.length} compras parceladas já comprometem meses futuros.`
      : 'Sem parcelamentos detectados na fatura atual.',
    budgetUsage > 0
      ? `Você usou ${Math.round(budgetUsage)}% do orçamento mensal.`
      : 'Orçamentos deixam o score mais preciso e previsível.',
    topCategory
      ? `${topCategory.nome} é o principal batimento de gasto deste mês.`
      : 'O sistema ainda está coletando sinais de comportamento.',
    dataCoverage < 55
      ? `A leitura ainda tem baixa cobertura de dados (${Math.round(dataCoverage)}%), então o score fica mais conservador.`
      : `A cobertura de dados está em ${Math.round(dataCoverage)}%, melhorando a confiança da análise.`,
    systemicPenalty > 0
      ? `Penalidades cruzadas reduziram o score em ${Math.round(systemicPenalty + weakestPillarDrag)} pts por riscos simultâneos.`
      : 'Não há penalidade sistêmica relevante ativa neste momento.',
  ]

  const forecast = [0, 7, 14, 21, 30].map(days => {
    const saldoProjetado = saldo + (dailyNet * days) - (futureBills * (days / 30))
    return {
      label: days === 0 ? 'Hoje' : `+${days}d`,
      saldo: Math.round(saldoProjetado),
      risco: Math.round(clamp(100 - (saldoProjetado > 0 ? 70 : 30) + pressure * 0.3, 0, 100)),
    }
  })

  return {
    score,
    label: score >= 88 ? 'Excelente' : score >= 72 ? 'Forte' : score >= 52 ? 'Estável com atenção' : score >= 35 ? 'Pressionado' : 'Crítico',
    recovery,
    recoveryLabel: recovery === 'verde' ? 'Recovery verde' : recovery === 'amarelo' ? 'Recovery amarelo' : 'Recovery vermelho',
    pressure,
    survivalDays: Math.min(survivalDays, 365),
    projectedClosing: pulse.projectedClosing,
    safeToSpend: pulse.safeToSpend,
    pillars,
    riskRadar,
    timeline,
    insights,
    forecast,
    potential: {
      score: potentialScore,
      gain: Number((potentialScore - score).toFixed(2)),
      improvements: focus,
    },
    achievements,
    focus,
  }
}

