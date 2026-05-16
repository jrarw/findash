'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { ChartEmptyOverlay } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { AnalysisInsightCard, type AnalysisInsight } from '@/components/fin-smart/AnalysisInsightCard'
import { DecisionSimulator, LifeMapView } from '@/components/finance-os/FinancialOSViews'
import { FinHealthRing } from '@/components/health/FinHealthRing'
import { useCartoesCredito, useComprasCartao } from '@/hooks/useCartoes'
import { useContasPagarProximas } from '@/hooks/useContasPagar'
import { useFinHealth, useFinHealthHistorico, useOrcamentos } from '@/hooks/useFinancas'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { useFluxoDiario, useGastosPorCategoria, useResumoMes } from '@/hooks/useTransacoes'
import { buildArwFinHealth } from '@/lib/finance/intelligence'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatMonth, getCurrentMonthYear } from '@/lib/format'
import { ICONS } from '@/lib/iconography'

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } },
}

const EMPTY_HISTORY = [
  { label: 'M-4', score: 0 },
  { label: 'M-3', score: 0 },
  { label: 'M-2', score: 0 },
  { label: 'M-1', score: 0 },
  { label: 'Agora', score: 0 },
]

function recoveryColor(recovery: 'verde' | 'amarelo' | 'vermelho') {
  if (recovery === 'verde') return '#22C55E'
  if (recovery === 'amarelo') return '#F59E0B'
  return '#EF4444'
}

function scoreColor(score: number) {
  if (score >= 85) return '#00E5FF'
  if (score >= 70) return '#22C55E'
  if (score >= 50) return '#EAB308'
  if (score >= 30) return '#F97316'
  return '#EF4444'
}

function clampScore(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)))
}

const scoreGradient = 'linear-gradient(to right, #EF4444 0%, #F97316 25%, #EAB308 50%, #22C55E 75%, #00E5FF 100%)'

type HealthModule = 'overview' | 'cognitive' | 'future' | 'journey' | 'impact' | 'biometric'

const HEALTH_MODULES: Array<{ key: HealthModule; label: string; icon: string; description: string }> = [
  { key: 'overview', label: 'Overview', icon: ICONS.nav.home, description: 'Estado atual' },
  { key: 'cognitive', label: 'Cognitivo', icon: ICONS.brand.ai, description: 'Insights' },
  { key: 'future', label: 'Futuro', icon: ICONS.health.forecast, description: 'Fluxo e previsão' },
  { key: 'journey', label: 'Jornada', icon: ICONS.health.trophy, description: 'Progressão' },
  { key: 'impact', label: 'Impacto', icon: ICONS.finance.adjustment, description: 'Simulador' },
  { key: 'biometric', label: 'Biométrico', icon: ICONS.health.radar, description: 'Pilares' },
]

function eventColor(type: 'positive' | 'warning' | 'danger' | 'neutral') {
  if (type === 'positive') return '#22C55E'
  if (type === 'warning') return '#F59E0B'
  if (type === 'danger') return '#EF4444'
  return '#00E5FF'
}

function pillarStatusLabel(classification: string) {
  if (classification === 'superando') return 'Superando'
  if (classification === 'no_caminho') return 'No caminho'
  if (classification === 'atencao') return 'Atenção'
  return 'Crítico'
}

function RangeBar({ score, color, range, ideal }: { score: number; color: string; range: string; ideal: string }) {
  const clampedScore = Math.min(Math.max(score, 0), 100)

  return (
    <div className="space-y-1.5">
      <div className="relative h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
        <div
          className="absolute inset-0 rounded-full opacity-90"
          style={{
            background: scoreGradient,
            clipPath: `inset(0 ${100 - clampedScore}% 0 0)`,
          }}
        />
        <motion.div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-[var(--surface)] shadow-lg"
          style={{ left: `${Math.min(Math.max(clampedScore, 2), 98)}%`, backgroundColor: color, transform: 'translate(-50%, -50%)' }}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] text-[var(--text-subtle)]">
        <span>{range}</span>
        <span>Ideal: {ideal}</span>
      </div>
    </div>
  )
}

function HealthMetricCard({
  label,
  value,
  hint,
  insight,
  color,
}: {
  label: string
  value: ReactNode
  hint: string
  insight: AnalysisInsight
  color?: string
}) {
  return (
    <AnalysisInsightCard insight={insight}>
      <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045]">
        <p className="text-xs text-white/40">{label}</p>
        <p className="mt-2 text-xl font-bold text-white" style={color ? { color } : undefined}>{value}</p>
        <p className="mt-1 text-xs text-white/35">{hint}</p>
      </Card>
    </AnalysisInsightCard>
  )
}

type Achievement = {
  id: string
  category: 'cash' | 'discipline' | 'credit' | 'growth'
  categoryLabel: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
}

type MedalRarity = 'comum' | 'incomum' | 'raro' | 'epico' | 'elite' | 'lendario'

type ProgressionMedal = Achievement & {
  rarity: MedalRarity
  xp: number
  sequence: number
  secret: boolean
  unlockedAt: string | null
}

type ProgressionTrack = {
  category: Achievement['category']
  title: string
  subtitle: string
  icon: string
  color: string
  medals: ProgressionMedal[]
  unlocked: number
  progress: number
  nextMedal?: ProgressionMedal
}

const ACHIEVEMENT_CATEGORY_STYLE: Record<Achievement['category'], { color: string; icon: string; title: string; subtitle: string }> = {
  cash: { color: '#06B6D4', icon: ICONS.finance.liquidity, title: 'Estabilidade', subtitle: 'Caixa, vencimentos e sobrevivência financeira' },
  discipline: { color: '#8B5CF6', icon: ICONS.finance.adjustment, title: 'Disciplina', subtitle: 'Orçamento, dados, consistência e planejamento' },
  credit: { color: '#F59E0B', icon: ICONS.finance.card, title: 'Crédito', subtitle: 'Cartão, parcelamentos e pressão futura' },
  growth: { color: '#22C55E', icon: ICONS.finance.savings, title: 'Evolução', subtitle: 'Reserva, score, crescimento e independência' },
}

const RARITY_STYLE: Record<MedalRarity, { label: string; color: string; glow: string; xp: number }> = {
  comum: { label: 'Comum', color: '#64748B', glow: 'rgba(100,116,139,0.10)', xp: 80 },
  incomum: { label: 'Incomum', color: '#06B6D4', glow: 'rgba(6,182,212,0.14)', xp: 130 },
  raro: { label: 'Raro', color: '#3B82F6', glow: 'rgba(59,130,246,0.16)', xp: 210 },
  epico: { label: 'Épico', color: '#8B5CF6', glow: 'rgba(139,92,246,0.20)', xp: 340 },
  elite: { label: 'Elite', color: '#22C55E', glow: 'rgba(34,197,94,0.18)', xp: 520 },
  lendario: { label: 'Lendário', color: '#F59E0B', glow: 'rgba(245,158,11,0.24)', xp: 800 },
}

const FIN_LEVELS = [
  { level: 1, label: 'Sobrevivência', min: 0 },
  { level: 2, label: 'Organização', min: 500 },
  { level: 3, label: 'Estabilidade', min: 1200 },
  { level: 4, label: 'Controle', min: 2200 },
  { level: 5, label: 'Evolução', min: 3600 },
  { level: 6, label: 'Expansão', min: 5400 },
  { level: 7, label: 'Elite', min: 7600 },
  { level: 8, label: 'Independência', min: 10400 },
  { level: 9, label: 'Master FinHealth', min: 14000 },
]

function medalRarity(sequence: number, achievement: Achievement): MedalRarity {
  if (achievement.id.includes('elite') || achievement.id.includes('master') || achievement.id.includes('legend')) return 'lendario'
  if (sequence >= 10) return 'lendario'
  if (sequence >= 9) return 'elite'
  if (sequence >= 7) return 'epico'
  if (sequence >= 5) return 'raro'
  if (sequence >= 3) return 'incomum'
  return 'comum'
}

function buildProgression(achievements: Achievement[], score: number, pressure: number, survivalDays: number) {
  const tracks = Array.from(
    achievements.reduce((map, achievement) => {
      const current = map.get(achievement.category) ?? []
      map.set(achievement.category, [...current, achievement])
      return map
    }, new Map<Achievement['category'], Achievement[]>()),
  ).map(([category, items]): ProgressionTrack => {
    const style = ACHIEVEMENT_CATEGORY_STYLE[category]
    const medals = items.map((achievement, index): ProgressionMedal => {
      const sequence = index + 1
      const rarity = medalRarity(sequence, achievement)
      const rarityXP = RARITY_STYLE[rarity].xp
      return {
        ...achievement,
        sequence,
        rarity,
        xp: Math.round(achievement.unlocked ? rarityXP : rarityXP * Math.min(achievement.progress, 100) * 0.0035),
        secret: !achievement.unlocked && rarity === 'lendario',
        unlockedAt: achievement.unlocked ? `${String(Math.max(1, sequence * 2)).padStart(2, '0')}/${String(new Date().getMonth() + 1).padStart(2, '0')}` : null,
      }
    })
    const unlocked = medals.filter(item => item.unlocked).length
    const progress = medals.length ? medals.reduce((sum, item) => sum + Math.min(item.progress, 100), 0) / medals.length : 0

    return {
      category,
      title: style.title,
      subtitle: style.subtitle,
      icon: style.icon,
      color: style.color,
      medals,
      unlocked,
      progress,
      nextMedal: medals.find(item => !item.unlocked),
    }
  })

  const medals = tracks.flatMap(track => track.medals)
  const unlocked = medals.filter(item => item.unlocked)
  const totalXP = medals.reduce((sum, item) => sum + item.xp, 0) + Math.round(score * 12) + Math.max(0, 100 - pressure) * 4
  const currentLevel = [...FIN_LEVELS].reverse().find(level => totalXP >= level.min) ?? FIN_LEVELS[0]
  const nextLevel = FIN_LEVELS.find(level => level.min > totalXP) ?? null
  const levelProgress = nextLevel ? ((totalXP - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100 : 100
  const nextMedal = medals
    .filter(item => !item.unlocked)
    .sort((a, b) => b.progress - a.progress || RARITY_STYLE[b.rarity].xp - RARITY_STYLE[a.rarity].xp)[0]
  const legendaryUnlocked = unlocked.filter(item => item.rarity === 'lendario' || item.rarity === 'elite')

  return {
    tracks,
    medals,
    unlocked,
    totalXP,
    currentLevel,
    nextLevel,
    levelProgress,
    nextMedal,
    legendaryUnlocked,
    completion: medals.length ? (unlocked.length / medals.length) * 100 : 0,
    streaks: [
      { label: 'Dias de fôlego', value: `${Math.max(0, survivalDays)}`, hint: 'liquidez estimada', icon: ICONS.health.survival, color: '#06B6D4' },
      { label: 'Score ativo', value: `${score}`, hint: 'nível de maturidade', icon: ICONS.health.score, color: scoreColor(score) },
      { label: 'Medalhas abertas', value: `${unlocked.length}`, hint: 'conquistas desbloqueadas', icon: ICONS.health.trophy, color: '#F59E0B' },
      { label: 'Pressão baixa', value: `${Math.max(0, 100 - pressure)}%`, hint: 'controle atual', icon: ICONS.health.pressure, color: '#22C55E' },
    ],
  }
}

function AchievementRail({ title, achievements }: { title: string; achievements: Achievement[] }) {
  const railRef = useRef<HTMLDivElement | null>(null)
  const dragState = useRef({ active: false, startX: 0, scrollLeft: 0 })
  const style = ACHIEVEMENT_CATEGORY_STYLE[achievements[0]?.category ?? 'cash']
  const unlocked = achievements.filter(item => item.unlocked).length

  return (
    <div className="rounded-[1.75rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: `${style.color}16` }}>
            <Icon name={style.icon} className="text-lg" style={{ color: style.color }} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[var(--text-primary)]">{title}</p>
            <p className="text-xs text-[var(--text-muted)]">Arraste para ver próximas conquistas</p>
          </div>
        </div>
        <Badge variant={unlocked === achievements.length ? 'success' : 'default'}>
          {unlocked}/{achievements.length}
        </Badge>
      </div>

      <div
        ref={railRef}
        className="no-scrollbar flex cursor-grab snap-x gap-3 overflow-x-auto pb-1 active:cursor-grabbing"
        onPointerDown={(event) => {
          const rail = railRef.current
          if (!rail) return
          dragState.current = { active: true, startX: event.clientX, scrollLeft: rail.scrollLeft }
          rail.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          const rail = railRef.current
          if (!rail || !dragState.current.active) return
          rail.scrollLeft = dragState.current.scrollLeft - (event.clientX - dragState.current.startX)
        }}
        onPointerUp={(event) => {
          dragState.current.active = false
          railRef.current?.releasePointerCapture(event.pointerId)
        }}
        onPointerCancel={() => {
          dragState.current.active = false
        }}
      >
        {achievements.map(achievement => (
          <div
            key={achievement.id}
            className={cn(
              'relative min-h-[178px] w-[220px] flex-shrink-0 snap-start rounded-3xl border p-4 transition-all',
              achievement.unlocked
                ? 'border-cyan-500/25 bg-cyan-500/[0.075] shadow-[0_16px_36px_rgba(6,182,212,0.08)]'
                : 'border-[var(--card-border)] bg-[var(--surface)]'
            )}
          >
            <span className={cn(
              'absolute right-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-semibold',
              achievement.unlocked ? 'bg-cyan-500/10 text-cyan-700' : 'bg-[var(--surface-muted)] text-[var(--text-subtle)]'
            )}>
              {achievement.unlocked ? 'Desbloqueada' : 'Próxima'}
            </span>
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)]">
              <Icon name={achievement.icon} className="text-xl" style={{ color: achievement.unlocked ? style.color : 'var(--text-subtle)' }} />
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">{achievement.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{achievement.description}</p>
            <div className="mt-4">
              <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--text-subtle)]">
                <span>Progresso</span>
                <span>{Math.round(achievement.progress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(achievement.progress, 100)}%`, background: achievement.unlocked ? style.color : 'linear-gradient(90deg, #94A3B8, #CBD5E1)' }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressionHero({ progression }: { progression: ReturnType<typeof buildProgression> }) {
  const next = progression.nextMedal
  const nextLevelXP = progression.nextLevel ? progression.nextLevel.min - progression.totalXP : 0

  return (
    <div className="relative overflow-hidden rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-cyan-400/12 blur-3xl" />
      <div className="relative grid gap-3 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--surface)] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.045)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-500">
              <Icon name={ICONS.health.trophy} className="text-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)]">Nível financeiro</p>
              <div className="mt-1 flex flex-wrap items-baseline gap-2">
                <h3 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Nível {progression.currentLevel.level}</h3>
                <span className="text-xs font-bold text-cyan-500">{progression.currentLevel.label}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text-muted)]">{progression.totalXP.toLocaleString('pt-BR')} pontos</span>
              <span className="text-[var(--text-subtle)]">
                {progression.nextLevel ? `${nextLevelXP.toLocaleString('pt-BR')} para ${progression.nextLevel.label}` : 'Nível máximo'}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progression.levelProgress, 100)}%` }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-[1.25rem] border border-[var(--card-border)] bg-[var(--surface)] p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_120px] md:items-center">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-subtle)]">Próximo desbloqueio</p>
              <h3 className="mt-1 truncate text-xl font-black text-[var(--text-primary)]">
                {next ? (next.secret ? 'Medalha secreta' : next.name) : 'Jornada completa'}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                {next ? (next.secret ? 'Continue evoluindo para revelar uma conquista lendária oculta.' : next.description) : 'Todas as medalhas disponíveis foram conquistadas.'}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-3 text-center">
              <p className="text-2xl font-black text-[var(--text-primary)]">{next ? `${Math.round(next.progress)}%` : '100%'}</p>
              <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">progresso</p>
            </div>
          </div>
          {next && (
            <div className="mt-3">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div className="h-full rounded-full" style={{ width: `${Math.min(next.progress, 100)}%`, background: RARITY_STYLE[next.rarity].color }} />
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[var(--text-muted)]">
                Faltam {Math.max(1, Math.round(100 - next.progress))}% para essa medalha.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CompactDecisionSimulator({
  score,
  pressure,
  projectedClosing,
  monthlyIncome,
}: {
  score: number
  pressure: number
  projectedClosing: number
  monthlyIncome: number
}) {
  const scenarios = [
    {
      id: 'cut',
      label: 'Cortar R$300',
      description: 'Reduzir gasto variável este mês',
      icon: ICONS.finance.safeSpend,
      balanceDelta: 300,
      scoreDelta: 4,
      pressureDelta: -6,
      recommendation: 'Boa decisão se vier de lazer, delivery ou compras não essenciais.',
      color: '#22C55E',
    },
    {
      id: 'income',
      label: '+R$1.000 renda',
      description: 'Entrada extra ou freela',
      icon: ICONS.finance.income,
      balanceDelta: 1000,
      scoreDelta: 5,
      pressureDelta: -8,
      recommendation: 'Direcione parte da entrada para reserva antes de liberar consumo.',
      color: '#06B6D4',
    },
    {
      id: 'purchase',
      label: 'Compra R$2.000',
      description: 'Parcelar em 6x',
      icon: ICONS.finance.card,
      balanceDelta: -334,
      scoreDelta: monthlyIncome > 0 && 334 > monthlyIncome * 0.12 ? -7 : -4,
      pressureDelta: 10,
      recommendation: 'Só faz sentido se houver compensação clara no fluxo dos próximos dias.',
      color: '#F9735B',
    },
    {
      id: 'debt',
      label: 'Quitar R$800',
      description: 'Reduzir dívida ou fatura',
      icon: ICONS.finance.debt,
      balanceDelta: -800,
      scoreDelta: 6,
      pressureDelta: -12,
      recommendation: 'Melhora o risco, mas preserve caixa mínimo para vencimentos próximos.',
      color: '#8B5CF6',
    },
  ]
  const [selectedId, setSelectedId] = useState(scenarios[0].id)
  const selected = scenarios.find(item => item.id === selectedId) ?? scenarios[0]
  const simulatedScore = clampScore(score + selected.scoreDelta)
  const simulatedPressure = clampScore(pressure + selected.pressureDelta)
  const simulatedClosing = projectedClosing + selected.balanceDelta

  return (
    <AnalysisInsightCard
      insight={{
        title: 'Simulador rápido',
        subtitle: 'Impacto no Fin Health',
        summary: 'Teste decisões comuns antes de assumir impacto no caixa, pressão e score.',
        interpretation: `${selected.label} levaria o score para ${simulatedScore}/100 e o fechamento para ${formatCurrencyBRL(simulatedClosing)}.`,
        metricLabel: 'Score simulado',
        metricValue: `${simulatedScore}/100`,
        status: simulatedScore >= score ? 'good' : 'attention',
        color: selected.color,
        chart: [
          { label: 'Atual', value: score },
          { label: 'Simulado', value: simulatedScore },
        ],
        details: [
          `Impacto no caixa: ${formatCurrencyBRL(selected.balanceDelta)}.`,
          `Pressão estimada: ${simulatedPressure}%.`,
          selected.recommendation,
        ],
        actions: [
          'Use como triagem rápida. Para uma decisão grande, compare também vencimentos e categorias do mês.',
        ],
      }}
    >
      <Card className="p-4 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-500">
                <Icon name={ICONS.finance.adjustment} className="text-lg" />
              </div>
              <div>
                <p className="text-sm font-black text-[var(--text-primary)]">Simulador rápido de decisão</p>
                <p className="text-xs text-[var(--text-muted)]">Teste impacto no score sem sair do Fin Health</p>
              </div>
            </div>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto lg:max-w-[520px]">
            {scenarios.map(scenario => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelectedId(scenario.id)}
                className={cn(
                  'min-w-[132px] rounded-2xl border px-3 py-2 text-left transition',
                  selectedId === scenario.id
                    ? 'border-cyan-400/30 bg-cyan-400/10 shadow-[0_10px_24px_rgba(6,182,212,0.10)]'
                    : 'border-[var(--card-border)] bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)]',
                )}
              >
                <Icon name={scenario.icon} className="text-base" style={{ color: scenario.color }} />
                <p className="mt-1 text-xs font-black text-[var(--text-primary)]">{scenario.label}</p>
                <p className="text-[10px] text-[var(--text-muted)]">{scenario.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[0.9fr_1.1fr] md:items-center">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-[var(--surface-soft)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Score</p>
              <p className="mt-1 text-lg font-black" style={{ color: scoreColor(simulatedScore) }}>{simulatedScore}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{selected.scoreDelta > 0 ? '+' : ''}{selected.scoreDelta} pts</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Caixa</p>
              <p className="mt-1 text-sm font-black text-[var(--text-primary)]">{formatCurrencyBRL(simulatedClosing)}</p>
              <p className="text-[10px] text-[var(--text-muted)]">{formatCurrencyBRL(selected.balanceDelta)}</p>
            </div>
            <div className="rounded-2xl bg-[var(--surface-soft)] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">Pressão</p>
              <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{simulatedPressure}%</p>
              <p className="text-[10px] text-[var(--text-muted)]">{selected.pressureDelta > 0 ? '+' : ''}{selected.pressureDelta}%</p>
            </div>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--text-subtle)]">Leitura do sistema</p>
            <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{selected.recommendation}</p>
          </div>
        </div>
      </Card>
    </AnalysisInsightCard>
  )
}

function ProgressSignalsGrid({ streaks }: { streaks: ReturnType<typeof buildProgression>['streaks'] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {streaks.map(streak => (
        <div key={streak.label} className="flex items-center gap-3 rounded-[1.15rem] border border-[var(--card-border)] bg-[var(--surface)] p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl" style={{ background: `${streak.color}16`, color: streak.color }}>
            <Icon name={streak.icon} className="text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-black text-[var(--text-primary)]">{streak.value}</p>
              <span className="rounded-full bg-[var(--surface-glass)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-[var(--text-subtle)]">ritmo</span>
            </div>
            <p className="truncate text-[11px] font-bold text-[var(--text-primary)]">{streak.label}</p>
            <p className="truncate text-[10px] text-[var(--text-muted)]">{streak.hint}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function MedalNode({ medal, color, last }: { medal: ProgressionMedal; color: string; last: boolean }) {
  const rarity = RARITY_STYLE[medal.rarity]
  const visibleName = medal.secret ? '???' : medal.name
  const visibleDescription = medal.secret ? 'Conquista oculta. Desbloqueie a etapa anterior para revelar.' : medal.description

  return (
    <div className="relative pl-14">
      {!last && <div className="absolute left-[22px] top-12 h-[calc(100%-1rem)] w-px bg-[var(--card-border)]" />}
      <div
        className={cn(
          'absolute left-0 top-0 flex h-11 w-11 items-center justify-center rounded-2xl border transition',
          medal.unlocked ? 'border-transparent text-white' : 'border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-subtle)]',
        )}
        style={medal.unlocked ? { background: `linear-gradient(135deg, ${color}, ${rarity.color})`, boxShadow: `0 14px 34px ${rarity.glow}` } : undefined}
      >
        <Icon name={medal.secret ? ICONS.status.pending : medal.icon} className="text-xl" />
      </div>
      <div className={cn(
        'rounded-[1.35rem] border p-4 transition',
        medal.unlocked
          ? 'border-cyan-400/20 bg-cyan-400/[0.055] shadow-[0_14px_35px_rgba(6,182,212,0.08)]'
          : 'border-[var(--card-border)] bg-[var(--surface)]',
      )}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text-subtle)]">Etapa {medal.sequence}</span>
              <span className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ background: rarity.glow, color: rarity.color }}>
                {rarity.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-black text-[var(--text-primary)]">{visibleName}</p>
          </div>
          <span className={cn(
            'rounded-full px-2.5 py-1 text-[10px] font-black',
            medal.unlocked ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[var(--surface-muted)] text-[var(--text-subtle)]',
          )}>
            {medal.unlocked ? `+${medal.xp} pts` : `${Math.round(medal.progress)}%`}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[var(--text-muted)]">{visibleDescription}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div className="h-full rounded-full" style={{ width: `${Math.min(medal.progress, 100)}%`, background: medal.unlocked ? rarity.color : 'linear-gradient(90deg, #94A3B8, #CBD5E1)' }} />
        </div>
      </div>
    </div>
  )
}

function ProgressionTrackView({ track, open, onToggle }: { track: ProgressionTrack; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full flex-col gap-4 rounded-[1.25rem] p-2 text-left transition hover:bg-[var(--surface-hover)] md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white" style={{ background: `linear-gradient(135deg, ${track.color}, ${track.color}99)` }}>
            <Icon name={track.icon} className="text-xl" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)]">{track.title}</h3>
            <p className="text-xs text-[var(--text-muted)]">{track.subtitle}</p>
            {track.nextMedal && (
              <p className="mt-1 text-[11px] font-semibold text-[var(--text-subtle)]">
                Próxima: {track.nextMedal.secret ? 'medalha especial' : track.nextMedal.name}
              </p>
            )}
          </div>
        </div>
        <div className="flex min-w-[170px] items-center gap-3">
          <div className="flex-1">
            <div className="mb-1 flex justify-between text-xs font-bold text-[var(--text-muted)]">
              <span>{track.unlocked}/{track.medals.length}</span>
              <span>{Math.round(track.progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
              <div className="h-full rounded-full" style={{ width: `${Math.min(track.progress, 100)}%`, background: track.color }} />
            </div>
          </div>
          <Icon name={ICONS.action.expand} className={cn('text-lg text-[var(--text-subtle)] transition-transform', open && 'rotate-180')} />
        </div>
      </button>
      {open && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {track.medals.map((medal, index) => (
            <MedalNode key={medal.id} medal={medal} color={track.color} last={index === track.medals.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function MedalVault({ progression }: { progression: ReturnType<typeof buildProgression> }) {
  const featured = progression.medals
    .filter(medal => medal.unlocked || medal.rarity === 'lendario' || medal.rarity === 'elite')
    .slice(0, 10)

  return (
    <div className="rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-[var(--text-primary)]">Hall da Evolução</p>
          <p className="text-xs text-[var(--text-muted)]">Galeria de medalhas raras, desbloqueadas e ocultas</p>
        </div>
        <Badge variant="cyan">{Math.round(progression.completion)}%</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {featured.map(medal => {
          const rarity = RARITY_STYLE[medal.rarity]
          return (
            <div
              key={medal.id}
              className={cn(
                'relative overflow-hidden rounded-3xl border p-4 text-center',
                medal.unlocked ? 'border-transparent bg-[var(--surface)]' : 'border-[var(--card-border)] bg-[var(--surface)] opacity-75',
              )}
              style={medal.unlocked ? { boxShadow: `0 18px 40px ${rarity.glow}` } : undefined}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: medal.unlocked ? `linear-gradient(135deg, ${rarity.color}, #06B6D4)` : 'var(--surface-muted)' }}>
                <Icon name={medal.secret ? ICONS.status.pending : medal.icon} className="text-2xl" />
              </div>
              <p className="mt-3 line-clamp-2 text-xs font-black text-[var(--text-primary)]">{medal.secret ? 'Medalha secreta' : medal.name}</p>
              <p className="mt-1 text-[10px] font-bold" style={{ color: rarity.color }}>{rarity.label}</p>
              <p className="mt-1 text-[10px] text-[var(--text-subtle)]">{medal.unlockedAt ?? `${Math.round(medal.progress)}%`}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function HealthPage() {
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null)
  const [expandedProgressTrack, setExpandedProgressTrack] = useState<Achievement['category'] | null>('cash')
  const [activeModule, setActiveModule] = useState<HealthModule>('overview')
  const { mes, ano } = getCurrentMonthYear()
  const { data: resumo, isLoading: loadingResumo } = useResumoMes(mes, ano)
  const { data: fluxo } = useFluxoDiario(mes, ano)
  const { data: categorias } = useGastosPorCategoria(mes, ano)
  const { data: contasProximas } = useContasPagarProximas(30)
  const { data: health } = useFinHealth(mes, ano)
  const { data: historico } = useFinHealthHistorico()
  const { data: orcamentos } = useOrcamentos(mes, ano)
  const { data: cartoes } = useCartoesCredito()
  const { data: comprasCartao } = useComprasCartao(mes, ano)
  const { data: financialOS } = useFinancialOS(mes, ano)

  const arwHealth = buildArwFinHealth({
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

  const historicoChart = historico?.length
    ? historico.map(h => ({
      label: `${h.mes}/${String(h.ano).slice(2)}`,
      score: Math.round(h.score_geral),
    }))
    : EMPTY_HISTORY
  const hasHistorico = (historico?.length ?? 0) > 1
  const recovery = recoveryColor(arwHealth.recovery)
  const forecastTrend = arwHealth.forecast.map(item => ({ label: item.label, value: Number(item.saldo) }))
  const radarTrend = arwHealth.riskRadar.map(item => ({ label: item.subject, value: item.value }))
  const pillarTrend = arwHealth.pillars.map(item => ({ label: item.name.split(' ')[0], value: Math.round(item.score) }))
  const historyTrend = historicoChart.map(item => ({ label: item.label, value: item.score }))
  const achievementGroups = Array.from(
    arwHealth.achievements.reduce((map, achievement) => {
      const current = map.get(achievement.categoryLabel) ?? []
      map.set(achievement.categoryLabel, [...current, achievement])
      return map
    }, new Map<string, Achievement[]>()),
  )
  const progression = buildProgression(arwHealth.achievements, arwHealth.score, arwHealth.pressure, arwHealth.survivalDays)

  return (
    <div className="app-page max-w-6xl">
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
        <motion.section variants={stagger.item}>
          <Card className="relative max-w-full overflow-hidden p-4 md:p-6">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#00E5FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-28 left-12 h-72 w-72 rounded-full bg-[#A855F7]/10 blur-3xl" />

            <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 max-w-xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="cyan">ARW Fin Health</Badge>
                  <span className="text-xs capitalize text-white/35">{formatMonth(mes, ano)}</span>
                </div>
                <h1 className="max-w-full text-2xl font-black leading-tight tracking-tight text-white md:text-5xl">
                  Sinais vitais do seu dinheiro.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/50 md:text-base">
                  Liquidez, fluxo, crédito, reserva e previsibilidade em um painel de saúde econômica vivo.
                </p>
                <div className="mt-5 grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/35">Recovery</p>
                    <p className="mt-1 text-sm font-bold" style={{ color: recovery }}>{arwHealth.recoveryLabel}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/35">Pressão</p>
                    <p className="mt-1 text-sm font-bold text-white">{arwHealth.pressure}%</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/35">Sobrevivência</p>
                    <p className="mt-1 text-sm font-bold text-white">{arwHealth.survivalDays} dias</p>
                  </div>
                </div>
              </div>

              <div className="flex w-full items-center justify-center rounded-[2rem] border border-white/[0.08] bg-black/25 p-4 backdrop-blur-xl lg:w-auto lg:p-5">
                <FinHealthRing score={arwHealth.score} size={154} strokeWidth={11} />
              </div>
            </div>
          </Card>
        </motion.section>

        <motion.section variants={stagger.item}>
          <div className="no-scrollbar flex max-w-full gap-2 overflow-x-auto rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-2">
            {HEALTH_MODULES.map(module => (
              <button
                key={module.key}
                type="button"
                onClick={() => setActiveModule(module.key)}
                className={cn(
                  'flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-3 py-2 text-left transition active:scale-[0.98] md:px-4',
                  activeModule === module.key
                    ? 'bg-cyan-500 text-white shadow-[0_12px_28px_rgba(6,182,212,0.18)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--surface)] hover:text-[var(--text-primary)]',
                )}
              >
                <Icon name={module.icon} className="text-base" />
                <span>
                  <span className="block text-xs font-black">{module.label}</span>
                  <span className={cn('hidden text-[10px] md:block', activeModule === module.key ? 'text-white/70' : 'text-[var(--text-subtle)]')}>{module.description}</span>
                </span>
              </button>
            ))}
          </div>
        </motion.section>

        <motion.section variants={stagger.item} className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', activeModule !== 'overview' && 'hidden')}>
          <HealthMetricCard
            label="Fechamento previsto"
            value={formatCurrencyBRL(arwHealth.projectedClosing)}
            hint="Tendência futura do mês"
            insight={{
              title: 'Fechamento previsto',
              subtitle: 'FinHealth projection',
              summary: 'Essa métrica projeta como o mês tende a fechar se o ritmo financeiro atual continuar.',
              interpretation: arwHealth.projectedClosing >= 0 ? 'O fechamento ainda respira positivo.' : 'A projeção aponta risco de fechar no negativo.',
              metricLabel: 'Projeção',
              metricValue: formatCurrencyBRL(arwHealth.projectedClosing),
              status: arwHealth.projectedClosing >= 0 ? 'good' : 'danger',
              color: arwHealth.projectedClosing >= 0 ? '#22C55E' : '#EF4444',
              chart: forecastTrend,
              details: [
                `Score geral atual: ${arwHealth.score}/100.`,
                `Pressão financeira: ${arwHealth.pressure}%.`,
                'A projeção melhora quando entradas futuras, recorrências e vencimentos estão bem mapeados.',
              ],
              actions: [
                arwHealth.projectedClosing >= 0 ? 'Proteja parte da projeção positiva antes de liberar consumo flexível.' : 'Use o radar de foco para atacar o pilar com maior ganho potencial.',
              ],
            }}
          />
          <HealthMetricCard
            label="Pode gastar"
            value={formatCurrencyBRL(arwHealth.safeToSpend)}
            hint="Faixa confortável estimada"
            color="#00E5FF"
            insight={{
              title: 'Faixa confortável para gastar',
              subtitle: 'Safe-to-spend',
              summary: 'O FinSmart calcula uma margem emocionalmente segura para gastos não essenciais.',
              interpretation: arwHealth.safeToSpend > 0 ? 'Existe uma faixa de gasto possível sem consumir todo o fôlego.' : 'Não há margem confortável no momento.',
              metricLabel: 'Pode gastar',
              metricValue: formatCurrencyBRL(arwHealth.safeToSpend),
              status: arwHealth.safeToSpend > 0 ? 'good' : 'attention',
              color: '#00E5FF',
              chart: forecastTrend,
              details: [
                'Essa faixa considera projeção, fluxo e pressão dos compromissos.',
                'Ela não deve ser tratada como dinheiro livre absoluto, mas como margem consciente.',
              ],
              actions: [
                'Separe essa margem por semana para evitar gastar tudo no início do ciclo.',
              ],
            }}
          />
          <HealthMetricCard
            label="Estado do dia"
            value={arwHealth.label}
            hint="Financial readiness"
            color={recovery}
            insight={{
              title: 'Estado financeiro do dia',
              subtitle: arwHealth.recoveryLabel,
              summary: 'Essa leitura transforma score, pressão e sobrevivência em um estado de prontidão financeira.',
              interpretation: arwHealth.label,
              metricLabel: 'Readiness',
              metricValue: arwHealth.recoveryLabel,
              status: arwHealth.recovery === 'verde' ? 'good' : arwHealth.recovery === 'amarelo' ? 'attention' : 'danger',
              color: recovery,
              chart: pillarTrend,
              details: [
                `Sobrevivência estimada: ${arwHealth.survivalDays} dias.`,
                `Pressão detectada: ${arwHealth.pressure}%.`,
                `Score biométrico: ${arwHealth.score}/100.`,
              ],
              actions: [
                'Use o estado do dia para decidir o nível de cautela antes de comprar, parcelar ou assumir nova conta.',
              ],
            }}
          />
          <HealthMetricCard
            label="Dados vivos"
            value={loadingResumo ? <span className="inline-block h-6 w-24 rounded skeleton" /> : arwHealth.timeline.length + arwHealth.insights.length}
            hint="sinais ativos no radar"
            insight={{
              title: 'Dados vivos no radar',
              subtitle: 'Sinais detectados automaticamente',
              summary: 'Essa contagem mostra quantos sinais o sistema está usando para explicar sua saúde financeira.',
              interpretation: `${arwHealth.timeline.length + arwHealth.insights.length} sinais alimentam a leitura atual.`,
              metricLabel: 'Sinais ativos',
              metricValue: String(arwHealth.timeline.length + arwHealth.insights.length),
              status: 'neutral',
              color: '#A855F7',
              chart: [
                { label: 'Timeline', value: arwHealth.timeline.length },
                { label: 'Insights', value: arwHealth.insights.length },
                { label: 'Focos', value: arwHealth.focus.length },
              ],
              details: [...arwHealth.insights, ...arwHealth.timeline.map(item => item.description)].slice(0, 6),
              actions: [
                'Quanto mais dados vivos, mais precisa fica a leitura. Complete cartões, contas e orçamento para enriquecer o radar.',
              ],
            }}
          />
        </motion.section>

        <motion.section variants={stagger.item} className={cn('grid gap-3 md:grid-cols-[1.35fr_1fr]', activeModule !== 'overview' && 'hidden')}>
          <AnalysisInsightCard
            insight={{
              title: 'Potencial de melhoria',
              subtitle: 'Ganho possível no score',
              summary: 'O potencial mostra quanto o score pode subir se você atacar os focos de maior impacto.',
              interpretation: `Há um ganho estimado de +${Math.round(arwHealth.potential.gain)} pontos.`,
              metricLabel: 'Potencial',
              metricValue: `${arwHealth.potential.score}/100`,
              status: arwHealth.potential.gain > 12 ? 'attention' : 'good',
              color: '#00E5FF',
              chart: [
                { label: 'Atual', value: arwHealth.score },
                { label: 'Potencial', value: arwHealth.potential.score },
              ],
              details: arwHealth.focus.map(item => `${item.pillar}: ${item.action} (+${item.gain.toFixed(1)} pts).`),
              actions: [
                'Comece pelo foco de maior impacto, porque ele melhora mais o score com menos dispersão.',
              ],
            }}
          >
          <Card className="overflow-hidden p-4 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Potencial de melhoria</p>
                <p className="text-xs text-[var(--text-muted)]">Caminho calculado pelo maior ganho possível</p>
              </div>
              <Icon name={ICONS.health.potential} className="text-2xl text-[#00E5FF]" />
            </div>
            <div className="flex items-center justify-center gap-5 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.07] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
              <div className="text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 bg-[var(--surface)] shadow-[0_14px_30px_rgba(15,23,42,0.08)]" style={{ borderColor: recovery }}>
                  <span className="text-xl font-bold text-[var(--text-primary)]">{arwHealth.score}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">Atual</p>
              </div>
              <Icon name={ICONS.action.arrowRight} className="text-2xl text-[var(--text-subtle)]" />
              <div className="text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-emerald-400 bg-[var(--surface)] shadow-[0_14px_30px_rgba(34,197,94,0.13)]">
                  <span className="text-xl font-bold text-emerald-500">{arwHealth.potential.score}</span>
                </div>
                <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">Potencial</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-secondary)]">
              Seguindo os focos de maior impacto, seu score pode ganhar aproximadamente{' '}
              <span className="font-semibold text-emerald-500">+{Math.round(arwHealth.potential.gain)} pts</span>.
            </p>
          </Card>
          </AnalysisInsightCard>

          <AnalysisInsightCard
            insight={{
              title: 'Ritmo financeiro',
              subtitle: 'Multiplicador de readiness',
              summary: 'O ritmo transforma o score em uma leitura rápida de energia financeira do momento.',
              interpretation: `${(arwHealth.score / 60).toFixed(2)}x indica o quanto seu mês está acima ou abaixo de uma base saudável.`,
              metricLabel: 'Multiplicador',
              metricValue: `${(arwHealth.score / 60).toFixed(2)}x`,
              status: arwHealth.recovery === 'verde' ? 'good' : arwHealth.recovery === 'amarelo' ? 'attention' : 'danger',
              color: recovery,
              chart: pillarTrend,
              details: [
                `Recovery: ${arwHealth.recoveryLabel}.`,
                `Score atual: ${arwHealth.score}/100.`,
                'O ideal é manter o ritmo acima de 1.0x com baixa pressão de crédito e fluxo previsível.',
              ],
              actions: [
                'Quando o ritmo cair, procure primeiro por cartão, vencimentos e categorias em aceleração.',
              ],
            }}
          >
          <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Ritmo financeiro</p>
                <p className="text-xs text-white/40">Multiplicador inspirado no ARW Health</p>
              </div>
              <Icon name={ICONS.health.rhythm} className="text-2xl text-[#A855F7]" />
            </div>
            <div className="flex flex-col items-center justify-center rounded-3xl border border-white/[0.08] bg-white/[0.03] p-5 text-center">
              <p className="text-4xl font-bold tabular-nums" style={{ color: recovery }}>
                {(arwHealth.score / 60).toFixed(2)}x
              </p>
              <Badge variant={arwHealth.recovery === 'verde' ? 'success' : arwHealth.recovery === 'amarelo' ? 'warning' : 'danger'} className="mt-3">
                {arwHealth.recoveryLabel}
              </Badge>
              <div className="mt-5 w-full">
                <RangeBar score={arwHealth.score} color={recovery} range="0x-1.6x" ideal="1.0x+" />
              </div>
            </div>
          </Card>
          </AnalysisInsightCard>
        </motion.section>

        <motion.section variants={stagger.item} className="hidden">
          <CompactDecisionSimulator
            score={arwHealth.score}
            pressure={arwHealth.pressure}
            projectedClosing={arwHealth.projectedClosing}
            monthlyIncome={resumo?.entradas ?? 0}
          />
        </motion.section>

        {activeModule === 'impact' && (
          <motion.section variants={stagger.item}>
            <DecisionSimulator os={financialOS} />
          </motion.section>
        )}

        {activeModule === 'biometric' && (
          <motion.section variants={stagger.item}>
            <Card className="mb-5 p-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
                <Icon name={ICONS.health.radar} />
                Mapa de Vida
              </div>
              <h2 className="mt-3 text-2xl font-black text-[var(--text-primary)]">Como cada área da vida mexe no seu Fin Health.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                Moradia, alimentação, transporte, lazer, saúde, assinaturas, dívidas e investimentos ganham leitura própria de peso, risco e recomendação.
              </p>
            </Card>
            <LifeMapView os={financialOS} />
          </motion.section>
        )}

        <div className={cn('grid gap-5 lg:grid-cols-[1.1fr_0.9fr]', !['overview', 'future'].includes(activeModule) && 'hidden')}>
          <motion.section variants={stagger.item} className={cn(activeModule !== 'overview' && 'hidden')}>
            <AnalysisInsightCard
              insight={{
                title: 'Radar de risco',
                subtitle: 'Distribuição dos pilares',
                summary: 'O radar mostra quais pilares estão sustentando ou puxando para baixo sua saúde financeira.',
                interpretation: 'Quanto mais cheio e equilibrado o radar, menor a chance de sufoco financeiro.',
                metricLabel: 'Score geral',
                metricValue: `${arwHealth.score}/100`,
                status: arwHealth.recovery === 'verde' ? 'good' : arwHealth.recovery === 'amarelo' ? 'attention' : 'danger',
                color: '#00E5FF',
                chart: radarTrend,
                details: arwHealth.pillars.map(pillar => `${pillar.name}: ${Math.round(pillar.score)} pontos. ${pillar.action}`),
                actions: [
                  'Procure o pilar mais baixo no radar e veja as submétricas antes de agir.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Radar de risco</p>
                  <p className="text-xs text-white/40">Quanto mais cheio, mais saudável</p>
                </div>
                <Icon name={ICONS.health.radar} className="text-2xl text-[#00E5FF]" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={arwHealth.riskRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.45)', fontSize: 11 }} />
                  <Radar dataKey="value" stroke="#00E5FF" fill="#00E5FF" fillOpacity={0.18} strokeWidth={2} />
                  <Tooltip
                    contentStyle={{
                      background: '#0d0d1a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item} className={cn(activeModule !== 'future' && 'hidden')}>
            <AnalysisInsightCard
              insight={{
                title: 'Previsão dos próximos dias',
                subtitle: 'Curva de recovery financeiro',
                summary: 'A previsão estima a direção do caixa e ajuda a antecipar mudanças de estado.',
                interpretation: arwHealth.projectedClosing >= 0 ? 'A curva indica fechamento com fôlego.' : 'A curva pede cautela nos próximos dias.',
                metricLabel: 'Fechamento previsto',
                metricValue: formatCurrencyBRL(arwHealth.projectedClosing),
                status: arwHealth.projectedClosing >= 0 ? 'good' : 'danger',
                color: '#A855F7',
                chart: forecastTrend,
                details: [
                  'Essa curva usa saldo, queima diária, vencimentos e comportamento recente.',
                  `Sobrevivência estimada: ${arwHealth.survivalDays} dias.`,
                ],
                actions: [
                  'Use a previsão para decidir se uma compra deve acontecer agora, ser adiada ou virar meta.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Previsão dos próximos dias</p>
                  <p className="text-xs text-white/40">Curva de recovery financeiro</p>
                </div>
                <Icon name={ICONS.health.forecast} className="text-2xl text-[#A855F7]" />
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={arwHealth.forecast}>
                  <defs>
                    <linearGradient id="forecastGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value: number, name) => name === 'saldo' ? formatCurrencyBRL(value) : `${value}%`}
                    contentStyle={{
                      background: '#0d0d1a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="saldo" stroke="#A855F7" fill="url(#forecastGradient)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </Card>
            </AnalysisInsightCard>
          </motion.section>
        </div>

        <motion.section variants={stagger.item} className={cn(activeModule !== 'biometric' && 'hidden')}>
          <AnalysisInsightCard
            insight={{
              title: '5 pilares vitais',
              subtitle: 'Arquitetura do score',
              summary: 'Os cinco pilares consolidam submétricas de caixa, controle, crédito, segurança e evolução.',
              interpretation: 'O score geral nasce da soma ponderada desses pilares.',
              metricLabel: 'Score geral',
              metricValue: `${arwHealth.score}/100`,
              status: arwHealth.recovery === 'verde' ? 'good' : arwHealth.recovery === 'amarelo' ? 'attention' : 'danger',
              color: recovery,
              chart: pillarTrend,
              details: arwHealth.pillars.map(pillar => `${pillar.name}: peso ${pillar.weight}%, score ${Math.round(pillar.score)}. ${pillar.formula}`),
              actions: arwHealth.focus.map(item => item.action).slice(0, 3),
            }}
          >
          <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">5 pilares vitais</p>
                <p className="text-xs text-white/40">Cada pilar soma submétricas internas e outros sinais financeiros</p>
              </div>
              <Badge variant="purple">biométrico</Badge>
            </div>
            <div className="space-y-3">
              {arwHealth.pillars.map(pillar => {
                const isExpanded = expandedPillar === pillar.key
                return (
                <Card key={pillar.key} className="overflow-hidden p-0">
                  <button
                    type="button"
                    onClick={() => setExpandedPillar(isExpanded ? null : pillar.key)}
                    className="w-full p-4 text-left"
                  >
                    <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${pillar.color}18` }}>
                      <Icon name={pillar.icon} className="text-lg" style={{ color: pillar.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">{pillar.name}</p>
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: pillar.color, background: `${pillar.color}18` }}>
                            {pillarStatusLabel(pillar.classification)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: pillar.color }}>{Math.round(pillar.score)}</span>
                          <Icon name={ICONS.action.expand} className={cn('text-white/30 transition-transform', isExpanded && 'rotate-180')} />
                        </div>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-white/40">{pillar.description}</p>
                      <p className="mt-1 text-[11px] text-white/30">Contribui {pillar.impact.toFixed(2)} pts no score geral</p>
                    </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: scoreGradient }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(pillar.score, 100)}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                    </div>
                  </button>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-white/[0.06] px-4 pb-4"
                    >
                      <div className="pt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Como é calculado</p>
                        <p className="mt-2 text-xs leading-relaxed text-white/50">{pillar.formula}</p>
                      </div>

                      <div className="mt-4 space-y-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">Submétricas</p>
                        {pillar.subMetrics.map(metric => (
                          <div key={metric.name} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-xs font-medium text-white/80">{metric.name}</p>
                              <div className="text-right">
                                <p className="text-xs font-semibold text-white">{metric.value}</p>
                                <p className="text-[10px]" style={{ color: scoreColor(metric.score) }}>{Math.round(metric.score)} pts</p>
                              </div>
                            </div>
                            <RangeBar score={metric.score} color={scoreColor(metric.score)} range={metric.range} ideal={metric.ideal} />
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">O que melhoraria</p>
                        {pillar.improvements.length > 0 ? (
                          <div className="mt-2 space-y-2">
                            {pillar.improvements.map(item => (
                              <div key={item.action} className="rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3">
                                <p className="text-xs leading-relaxed text-white/70">{item.action}</p>
                                <span className="mt-2 inline-flex rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  +{item.gain.toFixed(1)} pts
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 rounded-2xl border border-emerald-500/10 bg-emerald-500/[0.04] p-3 text-xs text-emerald-300">
                            Este pilar está em ótima forma.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              )})}
            </div>
          </Card>
          </AnalysisInsightCard>
        </motion.section>

        <motion.section variants={stagger.item} className={cn(activeModule !== 'journey' && 'hidden')}>
          <AnalysisInsightCard
            insight={{
              title: 'Progressão FinHealth',
              subtitle: 'Jornada de maturidade financeira',
              summary: 'A progressão transforma medalhas em trilhas, pontos, raridades e próximos passos conectados.',
              interpretation: `Você está no nível ${progression.currentLevel.level} · ${progression.currentLevel.label}, com ${progression.totalXP.toLocaleString('pt-BR')} pontos.`,
              metricLabel: 'Nível',
              metricValue: `${progression.currentLevel.level}`,
              status: progression.completion > 70 ? 'good' : 'attention',
              color: '#00E5FF',
              chart: progression.tracks.map(track => ({ label: track.title.slice(0, 8), value: track.progress })),
              details: progression.tracks.map(track => `${track.title}: ${track.unlocked}/${track.medals.length} medalhas · ${Math.round(track.progress)}% da trilha.`),
              actions: [
                progression.nextMedal ? `Próximo passo: ${progression.nextMedal.secret ? 'revele uma medalha secreta' : progression.nextMedal.name}.` : 'Mantenha consistência para sustentar o nível máximo.',
              ],
            }}
          >
          <Card className="p-4 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035] md:p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[var(--text-primary)]">
                  <Icon name={ICONS.health.trophy} />
                  Jornada FinHealth
                </div>
                <h2 className="mt-3 text-xl font-black tracking-tight text-[var(--text-primary)] md:text-2xl">
                  Sua evolução financeira em trilhas.
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-6 text-[var(--text-muted)] md:text-sm">
                  Trilhas, medalhas, pontos e raridades mostram onde você está, o que já conquistou e qual hábito destrava o próximo nível.
                </p>
              </div>
              <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-5 py-4 text-center">
                <p className="text-3xl font-black text-[var(--text-primary)]">{progression.unlocked.length}/{progression.medals.length}</p>
                <p className="mt-1 text-xs font-semibold text-[var(--text-muted)]">medalhas</p>
              </div>
            </div>

            <div className="space-y-3">
              <ProgressionHero progression={progression} />
              <ProgressSignalsGrid streaks={progression.streaks} />
              <MedalVault progression={progression} />
              <div className="space-y-3">
                {progression.tracks.map(track => (
                  <ProgressionTrackView
                    key={track.category}
                    track={track}
                    open={expandedProgressTrack === track.category}
                    onToggle={() => setExpandedProgressTrack(current => current === track.category ? null : track.category)}
                  />
                ))}
              </div>
            </div>
          </Card>
          </AnalysisInsightCard>
        </motion.section>

        {arwHealth.focus.length > 0 && (
          <motion.section variants={stagger.item} className={cn(activeModule !== 'cognitive' && 'hidden')}>
            <AnalysisInsightCard
              insight={{
                title: 'Onde focar agora',
                subtitle: 'Ações por ganho potencial',
                summary: 'Essa lista prioriza ações que mais aumentam seu score com base nos pilares mais sensíveis.',
                interpretation: `Maior ganho individual: +${arwHealth.focus[0]?.gain.toFixed(1)} pts.`,
                metricLabel: 'Ganho potencial',
                metricValue: `+${arwHealth.potential.gain.toFixed(1)} pts`,
                status: 'attention',
                color: '#00E5FF',
                chart: arwHealth.focus.map(item => ({ label: item.pillar.slice(0, 8), value: item.gain })),
                details: arwHealth.focus.map(item => `${item.pillar}: ${item.action}`),
                actions: [
                  'Execute primeiro a ação com maior ganho e reavalie o score depois de alguns lançamentos.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center gap-2">
                <Icon name={ICONS.health.focus} className="text-xl text-[#00E5FF]" />
                <div>
                  <p className="text-sm font-semibold text-white">Onde focar agora</p>
                  <p className="text-xs text-white/40">Ordenado pelo maior ganho potencial</p>
                </div>
              </div>
              <div className="space-y-2">
                {arwHealth.focus.map((item, index) => (
                  <div key={item.action} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4" style={{ borderLeftColor: item.color, borderLeftWidth: 3 }}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/[0.04]">
                        <Icon name={item.icon} className="text-base" style={{ color: item.color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-semibold text-white">{item.pillar}</p>
                          {index === 0 && <Badge variant="warning">Maior impacto</Badge>}
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">+{item.gain.toFixed(1)} pts</span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-white/50">{item.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>
        )}

        <div className={cn('grid gap-5 lg:grid-cols-[0.95fr_1.05fr]', !['overview', 'cognitive'].includes(activeModule) && 'hidden')}>
          <motion.section variants={stagger.item} className={cn(activeModule !== 'overview' && 'hidden')}>
            <AnalysisInsightCard
              insight={{
                title: 'Timeline viva',
                subtitle: 'Eventos financeiros detectados',
                summary: 'A timeline organiza sinais importantes em uma narrativa do que está acontecendo com seu dinheiro.',
                interpretation: `${arwHealth.timeline.length} eventos explicam a leitura atual.`,
                metricLabel: 'Eventos',
                metricValue: String(arwHealth.timeline.length),
                status: arwHealth.timeline.some(item => item.type === 'danger') ? 'danger' : arwHealth.timeline.some(item => item.type === 'warning') ? 'attention' : 'good',
                color: '#00E5FF',
                chart: arwHealth.timeline.map((item, index) => ({ label: `E${index + 1}`, value: item.type === 'danger' ? 100 : item.type === 'warning' ? 70 : item.type === 'positive' ? 35 : 50 })),
                details: arwHealth.timeline.map(item => `${item.title}: ${item.description}`),
                actions: [
                  'Leia a timeline de cima para baixo e trate eventos de risco antes dos neutros.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Timeline viva</p>
                  <p className="text-xs text-white/40">Batimentos financeiros detectados</p>
                </div>
                <Icon name={ICONS.health.pulse} className="text-2xl text-[#00E5FF]" />
              </div>
              <div className="space-y-3">
                {arwHealth.timeline.map(event => {
                  const color = eventColor(event.type)
                  return (
                    <div key={event.title} className="relative rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                          <Icon name={event.icon} className="text-base" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{event.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-white/45">{event.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item} className={cn(activeModule !== 'cognitive' && 'hidden')}>
            <AnalysisInsightCard
              insight={{
                title: 'Insights automáticos',
                subtitle: 'Explicação em linguagem humana',
                summary: 'Os insights traduzem cálculos e sinais do FinHealth para decisões mais claras.',
                interpretation: `${arwHealth.insights.length} insights ativos no momento.`,
                metricLabel: 'Insights',
                metricValue: String(arwHealth.insights.length),
                status: 'neutral',
                color: '#A855F7',
                chart: arwHealth.insights.map((_, index) => ({ label: `I${index + 1}`, value: 60 + index * 10 })),
                details: arwHealth.insights,
                actions: [
                  'Transforme o insight mais incômodo em uma ação pequena hoje.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Insights automáticos</p>
                  <p className="text-xs text-white/40">Linguagem humana para sinais complexos</p>
                </div>
                <Icon name={ICONS.brand.ai} className="text-2xl text-[#A855F7]" />
              </div>
              <div className="grid gap-3">
                {arwHealth.insights.map((insight, index) => (
                  <div key={insight} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <p className="mb-2 text-xs text-white/25">Insight {index + 1}</p>
                    <p className="text-sm leading-relaxed text-white/70">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>
        </div>

        <motion.section variants={stagger.item} className={cn(activeModule !== 'overview' && 'hidden')}>
          <AnalysisInsightCard
            insight={{
              title: 'Evolução temporal',
              subtitle: 'Histórico do FinHealth',
              summary: 'A evolução mostra se a saúde financeira está melhorando, estagnada ou perdendo qualidade ao longo dos meses.',
              interpretation: hasHistorico ? 'Há histórico suficiente para acompanhar tendência.' : 'O histórico ainda está em formação.',
              metricLabel: 'Score atual',
              metricValue: `${arwHealth.score}/100`,
              status: arwHealth.recovery === 'verde' ? 'good' : arwHealth.recovery === 'amarelo' ? 'attention' : 'danger',
              color: '#00E5FF',
              chart: historyTrend,
              details: [
                'A tendência mensal é mais importante que uma nota isolada.',
                'Oscilações pequenas são normais; quedas repetidas pedem revisão de comportamento.',
              ],
              actions: [
                'Compare o mês atual com os últimos registros e procure o pilar que mais mudou.',
              ],
            }}
          >
          <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Evolução temporal</p>
                <p className="text-xs text-white/40">Histórico mensal do score salvo</p>
              </div>
              <Icon name={ICONS.chart.area} className="text-2xl text-[#00E5FF]" />
            </div>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={historicoChart}>
                  <defs>
                    <linearGradient id="healthHistory" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#0d0d1a',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '12px',
                    }}
                  />
                  <Area type="monotone" dataKey="score" stroke="#00E5FF" fill="url(#healthHistory)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              {!hasHistorico && (
                <ChartEmptyOverlay
                  title="Histórico em formação"
                  description="Quando houver mais meses salvos, a evolução aparece aqui."
                />
              )}
            </div>
          </Card>
          </AnalysisInsightCard>
        </motion.section>
      </motion.div>
    </div>
  )
}

