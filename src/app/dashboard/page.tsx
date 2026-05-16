'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChartEmptyOverlay, EmptyDataState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { FinSmartInput } from '@/components/fin-smart/FinSmartInput'
import { AnalysisInsightCard, type AnalysisInsight } from '@/components/fin-smart/AnalysisInsightCard'
import { FinancialOSModuleGrid } from '@/components/finance-os/FinancialOSViews'
import { FinHealthRing } from '@/components/health/FinHealthRing'
import { useResumoMes, useFluxoDiario, useGastosPorCategoria } from '@/hooks/useTransacoes'
import { useContasPagarProximas } from '@/hooks/useContasPagar'
import { useFinHealth, useOrcamentos, useUsuario } from '@/hooks/useFinancas'
import { useCartoesCredito, useComprasCartao } from '@/hooks/useCartoes'
import { useFinancialOS } from '@/hooks/useFinancialOS'
import { buildFinancialPulse } from '@/lib/finance/intelligence'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatMonth, getCurrentMonthYear, getDaysUntil, getGreeting } from '@/lib/format'
import { ICONS, type IconClass } from '@/lib/iconography'

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } },
}

const EMPTY_CASH_FLOW = [
  { data: '2026-01-01', saldo: 0, saldoProjetado: 0 },
  { data: '2026-01-08', saldo: 0, saldoProjetado: 0 },
  { data: '2026-01-15', saldo: 0, saldoProjetado: 0 },
  { data: '2026-01-22', saldo: 0, saldoProjetado: 0 },
  { data: '2026-01-30', saldo: 0, saldoProjetado: 0 },
]

const EMPTY_CATEGORIES = [
  { categoria_id: 'empty-1', nome: 'Alimentação', total: 0, percentual: 72, cor: '#00E5FF' },
  { categoria_id: 'empty-2', nome: 'Moradia', total: 0, percentual: 54, cor: '#A855F7' },
  { categoria_id: 'empty-3', nome: 'Transporte', total: 0, percentual: 38, cor: '#22C55E' },
  { categoria_id: 'empty-4', nome: 'Lazer', total: 0, percentual: 24, cor: '#F59E0B' },
]

function pulseColor(score: number) {
  if (score >= 72) return '#22C55E'
  if (score >= 48) return '#F59E0B'
  return '#EF4444'
}

function alertColor(severity: 'info' | 'warning' | 'danger' | 'success') {
  if (severity === 'danger') return '#EF4444'
  if (severity === 'warning') return '#F59E0B'
  if (severity === 'success') return '#22C55E'
  return '#00E5FF'
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  color = '#00E5FF',
  loading,
  insight,
}: {
  label: string
  value: string
  hint: string
  icon: IconClass
  color?: string
  loading?: boolean
  insight: AnalysisInsight
}) {
  return (
    <AnalysisInsightCard insight={insight}>
      <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045]">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs text-white/40">{label}</p>
          <Icon name={icon} className="text-xl" style={{ color }} />
        </div>
        {loading ? (
          <div className="mb-2 h-6 w-28 rounded-lg skeleton" />
        ) : (
          <p className="text-xl font-bold text-white">{value}</p>
        )}
        <p className="mt-1 text-xs text-white/35">{hint}</p>
      </Card>
    </AnalysisInsightCard>
  )
}

export default function DashboardPage() {
  const { mes, ano } = getCurrentMonthYear()
  const { data: usuario } = useUsuario()
  const { data: resumo, isLoading: loadingResumo } = useResumoMes(mes, ano)
  const { data: fluxo } = useFluxoDiario(mes, ano)
  const { data: categorias } = useGastosPorCategoria(mes, ano)
  const { data: contasProximas } = useContasPagarProximas(14)
  const { data: health } = useFinHealth(mes, ano)
  const { data: orcamentos } = useOrcamentos(mes, ano)
  const { data: cartoes } = useCartoesCredito()
  const { data: comprasCartao } = useComprasCartao(mes, ano)
  const { data: financialOS } = useFinancialOS(mes, ano)

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

  const greeting = getGreeting(usuario?.nome ?? 'Usuário').replace('👋', '').trim()
  const periodo = formatMonth(mes, ano)
  const chartData = fluxo?.length
    ? fluxo.map(item => ({
      ...item,
      saldoProjetado: item.saldo,
    }))
    : EMPTY_CASH_FLOW
  const hasFluxoData = Boolean(fluxo?.length)
  const topCategorias = categorias?.length ? categorias.slice(0, 4) : EMPTY_CATEGORIES
  const hasCategoriasData = Boolean(categorias?.length)
  const proximas = contasProximas?.slice(0, 3) ?? []
  const creditLimit = (cartoes ?? []).reduce((sum, cartao) => sum + Number(cartao.limite_total), 0)
  const creditUsed = (comprasCartao ?? []).reduce((sum, compra) => sum + Number(compra.valor_total), 0)
  const cashTrend = chartData.map((item, index) => ({
    label: fluxo?.length ? String(item.data).slice(8) : `D${index + 1}`,
    value: Number(item.saldo ?? 0),
  }))
  const categoryTrend = topCategorias.map(item => ({ label: item.nome.slice(0, 8), value: Number(item.percentual ?? 0) }))
  const timelineTrend = proximas.length
    ? proximas.map(item => ({ label: String(item.vencimento).slice(8), value: Number(item.valor) }))
    : [{ label: 'Hoje', value: 0 }, { label: '7d', value: 0 }, { label: '14d', value: 0 }]

  return (
    <div className="app-page max-w-6xl">
      <motion.div
        variants={stagger.container}
        initial="initial"
        animate="animate"
        className="space-y-5"
      >
        <motion.section variants={stagger.item}>
          <AnalysisInsightCard
            insight={{
              title: 'Pulse score',
              subtitle: 'Leitura geral do mês',
              summary: 'O Pulse score consolida fluxo, orçamento, cartão, vencimentos e saúde financeira em uma leitura única.',
              interpretation: pulse.statusLabel,
              metricLabel: 'Score atual',
              metricValue: `${pulse.score}/100`,
              status: pulse.score >= 72 ? 'good' : pulse.score >= 48 ? 'attention' : 'danger',
              color: pulseColor(pulse.score),
              chart: [
                { label: 'Margem', value: Math.max(0, Math.min(100, 50 + pulse.marginPercent)) },
                { label: 'Orçam.', value: Math.max(0, Math.min(100, 120 - pulse.budgetUsagePercent)) },
                { label: 'Cartão', value: Math.max(0, Math.min(100, 115 - pulse.cardUsagePercent)) },
                { label: 'Pulse', value: pulse.score },
              ],
              details: [
                `Margem do mês: ${Math.round(pulse.marginPercent)}%.`,
                `Uso de orçamento: ${Math.round(pulse.budgetUsagePercent)}%.`,
                `Uso de cartão: ${Math.round(pulse.cardUsagePercent)}%.`,
              ],
              actions: pulse.alerts.map(alert => alert.description),
            }}
          >
          <Card className="relative overflow-hidden p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-6">
            <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#00E5FF]/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-60 w-60 rounded-full bg-[#A855F7]/10 blur-3xl" />

            <div className="relative z-10 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-xl">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <Badge variant="cyan" className="border-cyan-500/15 bg-cyan-500/10 text-[var(--text-primary)]">
                    Financial OS
                  </Badge>
                  <span className="text-xs capitalize text-white/35">{periodo}</span>
                </div>
                <p className="text-sm text-white/45">{greeting}</p>
                <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-white md:text-5xl">
                  Seu dinheiro está vivo.
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/50 md:text-base">
                  O FinDash está lendo seu fluxo, orçamento, cartões e vencimentos para antecipar riscos antes que virem ansiedade.
                </p>
              </div>

              <div className="flex min-w-0 items-center gap-4 rounded-3xl border border-white/[0.08] bg-black/20 p-4 backdrop-blur-xl">
                <FinHealthRing score={pulse.score} size={116} strokeWidth={9} />
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-white/30">Pulse score</p>
                  <p className="mt-1 text-lg font-bold text-white">{pulse.statusLabel}</p>
                  <p className="mt-1 text-sm" style={{ color: pulseColor(pulse.score) }}>
                    {pulse.score}/100
                  </p>
                  <p className="mt-3 max-w-[180px] text-xs text-white/40">
                    Leitura heurística baseada no ritmo do mês.
                  </p>
                </div>
              </div>
            </div>
          </Card>
          </AnalysisInsightCard>
        </motion.section>

        <motion.section variants={stagger.item} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Saldo do mês"
            value={formatCurrencyBRL(resumo?.saldo ?? 0)}
            hint="Entradas menos saídas efetivadas"
            icon={ICONS.finance.balance}
            color={(resumo?.saldo ?? 0) >= 0 ? '#00E5FF' : '#EF4444'}
            loading={loadingResumo}
            insight={{
              title: 'Saldo do mês',
              subtitle: periodo,
              summary: 'O saldo mostra a diferença entre entradas e saídas já efetivadas. Ele é o primeiro sinal de fôlego financeiro do mês.',
              interpretation: (resumo?.saldo ?? 0) >= 0 ? 'O mês está fechando positivo até aqui.' : 'As saídas já superaram as entradas efetivadas.',
              metricLabel: 'Saldo atual',
              metricValue: formatCurrencyBRL(resumo?.saldo ?? 0),
              status: (resumo?.saldo ?? 0) >= 0 ? 'good' : 'danger',
              color: (resumo?.saldo ?? 0) >= 0 ? '#00E5FF' : '#EF4444',
              chart: cashTrend,
              details: [
                `Entradas efetivadas: ${formatCurrencyBRL(resumo?.entradas ?? 0)}.`,
                `Saídas efetivadas: ${formatCurrencyBRL(resumo?.saidas ?? 0)}.`,
                'Esse valor ainda não considera todo comportamento futuro, por isso deve ser lido junto da projeção de fechamento.',
              ],
              actions: [
                (resumo?.saldo ?? 0) >= 0 ? 'Transforme parte da sobra em reserva ou meta antes que ela vire gasto invisível.' : 'Revise os maiores gastos do extrato e reduza categorias flexíveis nos próximos dias.',
              ],
            }}
          />
          <MetricCard
            label="Fechamento previsto"
            value={formatCurrencyBRL(pulse.projectedClosing)}
            hint="Projeção pelo ritmo diário"
            icon={ICONS.finance.projection}
            color={pulse.projectedClosing >= 0 ? '#22C55E' : '#EF4444'}
            loading={loadingResumo}
            insight={{
              title: 'Fechamento previsto',
              subtitle: 'Projeção pelo ritmo diário',
              summary: 'O FinSmart projeta o fechamento considerando o ritmo de saída atual e vencimentos próximos.',
              interpretation: pulse.projectedClosing >= 0 ? 'A projeção indica margem positiva no fim do mês.' : 'A projeção indica risco de terminar o mês negativo.',
              metricLabel: 'Fechamento estimado',
              metricValue: formatCurrencyBRL(pulse.projectedClosing),
              status: pulse.projectedClosing >= 0 ? 'good' : 'danger',
              color: pulse.projectedClosing >= 0 ? '#22C55E' : '#EF4444',
              chart: cashTrend,
              details: [
                `Queima diária atual: ${formatCurrencyBRL(pulse.dailyBurn)}.`,
                `Contas futuras no radar: ${formatCurrencyBRL(pulse.futureBillsTotal)}.`,
                'A projeção fica mais confiável quanto mais transações e contas recorrentes estiverem cadastradas.',
              ],
              actions: [
                pulse.projectedClosing >= 0 ? 'Mantenha o ritmo atual e reserve margem para gastos não previstos.' : 'Corte gastos variáveis e confira vencimentos antes de assumir novos compromissos.',
              ],
            }}
          />
          <MetricCard
            label="Pode gastar sem sufocar"
            value={formatCurrencyBRL(pulse.safeToSpend)}
            hint="Margem confortável estimada"
            icon={ICONS.finance.safeSpend}
            color="#A855F7"
            loading={loadingResumo}
            insight={{
              title: 'Pode gastar sem sufocar',
              subtitle: 'Margem confortável',
              summary: 'Essa faixa estima quanto ainda pode ser usado sem consumir toda a projeção positiva do mês.',
              interpretation: pulse.safeToSpend > 0 ? 'Existe uma margem de gasto flexível, mas ela deve ser usada com controle.' : 'No momento não há margem confortável detectada.',
              metricLabel: 'Margem segura',
              metricValue: formatCurrencyBRL(pulse.safeToSpend),
              status: pulse.safeToSpend > 0 ? 'good' : 'attention',
              color: '#A855F7',
              chart: cashTrend,
              details: [
                'A margem segura preserva parte do fechamento projetado para evitar sufoco emocional no fim do mês.',
                `Ela é derivada de uma projeção de ${formatCurrencyBRL(pulse.projectedClosing)}.`,
              ],
              actions: [
                pulse.safeToSpend > 0 ? 'Use essa faixa como teto para lazer e compras não essenciais.' : 'Priorize pagamentos e entradas antes de liberar gastos flexíveis.',
              ],
            }}
          />
          <MetricCard
            label="Queima diária"
            value={formatCurrencyBRL(pulse.dailyBurn)}
            hint="Média de saída por dia"
            icon={ICONS.finance.dailyBurn}
            color="#F59E0B"
            loading={loadingResumo}
            insight={{
              title: 'Queima diária',
              subtitle: 'Velocidade de saída',
              summary: 'A queima diária mostra quanto dinheiro sai, em média, por dia no mês atual.',
              interpretation: pulse.dailyBurn > 0 ? 'Esse é o ritmo que alimenta as projeções do FinSmart.' : 'Ainda não há saídas suficientes para calcular um ritmo real.',
              metricLabel: 'Média de saída',
              metricValue: formatCurrencyBRL(pulse.dailyBurn),
              status: pulse.dailyBurn > 0 ? 'attention' : 'neutral',
              color: '#F59E0B',
              chart: cashTrend,
              details: [
                'Quando esse número sobe rápido, a projeção de fechamento piora mesmo que o saldo atual pareça confortável.',
                'É uma métrica especialmente útil para detectar aceleração de consumo.',
              ],
              actions: [
                'Compare a queima diária desta semana com seus gastos essenciais e reduza compras impulsivas se ela estiver acima do normal.',
              ],
            }}
          />
        </motion.section>

        <motion.section variants={stagger.item} className="grid gap-3 lg:grid-cols-[0.8fr_1.2fr] lg:gap-5">
          <Card className="hidden p-5 md:p-6 lg:block">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-500">
              <Icon name={ICONS.brand.ai} className="text-2xl" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-subtle)]">Leitura do sistema</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-[var(--text-primary)]">
              {financialOS.insights[0]?.title ?? 'Seu Financial OS está observando o mês.'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {financialOS.insights[0]?.description ?? 'Conforme seus dados entram, o app cria diagnóstico, previsões e recomendações mais precisas.'}
            </p>
            <Link href="/dashboard/insights" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-400">
              Abrir Central Cognitiva
              <Icon name={ICONS.action.arrowRight} />
            </Link>
          </Card>
          <FinancialOSModuleGrid />
        </motion.section>

        <div className="grid gap-5 lg:grid-cols-[1.45fr_0.9fr]">
          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Curva viva de caixa',
                subtitle: 'Evolução diária do saldo',
                summary: 'A curva mostra se o dinheiro está ganhando ou perdendo fôlego ao longo do mês.',
                interpretation: hasFluxoData ? 'O gráfico já possui dados reais para leitura de tendência.' : 'Ainda é um placeholder até você lançar mais transações.',
                metricLabel: 'Fechamento projetado',
                metricValue: formatCurrencyBRL(pulse.projectedClosing),
                status: pulse.projectedClosing >= 0 ? 'good' : 'danger',
                color: pulse.projectedClosing >= 0 ? '#00E5FF' : '#EF4444',
                chart: cashTrend,
                details: [
                  'Quedas fortes indicam dias de gasto concentrado.',
                  'Uma curva estável ou ascendente reduz ansiedade de caixa.',
                  `O ritmo atual projeta ${formatCurrencyBRL(pulse.projectedClosing)} no fechamento.`,
                ],
                actions: [
                  'Use os dias de queda como ponto de partida para investigar compras, faturas ou vencimentos.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Curva viva de caixa</p>
                  <p className="text-xs text-white/40">Evolução diária do saldo acumulado</p>
                </div>
                <Link href="/dashboard/fluxo" className="text-xs text-[#00E5FF]">Abrir fluxo</Link>
              </div>

              <div className="relative">
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="cashGlow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="data" tickFormatter={value => String(value).slice(8)} tick={{ fill: 'rgba(255,255,255,0.28)', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: '#0d0d1a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        color: 'white',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => formatCurrencyBRL(value)}
                      labelFormatter={value => `Dia ${String(value).slice(8)}`}
                    />
                    <Area type="monotone" dataKey="saldo" stroke="#00E5FF" strokeWidth={2.5} fill="url(#cashGlow)" name="Saldo" />
                  </AreaChart>
                </ResponsiveContainer>
                {!hasFluxoData && (
                  <ChartEmptyOverlay
                    title="Fluxo ainda invisível"
                    description="O gráfico fica pronto; seus lançamentos vão preencher a curva."
                  />
                )}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Radar inteligente',
                subtitle: 'Alertas proativos',
                summary: 'O radar reúne sinais que merecem atenção antes de virarem problema no caixa.',
                interpretation: pulse.alerts.length > 0 ? `${pulse.alerts.length} sinais ativos no mês.` : 'Nenhum alerta crítico ativo.',
                metricLabel: 'Alertas ativos',
                metricValue: String(pulse.alerts.length),
                status: pulse.alerts.some(alert => alert.severity === 'danger') ? 'danger' : pulse.alerts.some(alert => alert.severity === 'warning') ? 'attention' : 'good',
                color: pulse.alerts.some(alert => alert.severity === 'danger') ? '#EF4444' : '#A855F7',
                chart: pulse.alerts.map((alert, index) => ({ label: `A${index + 1}`, value: alert.severity === 'danger' ? 100 : alert.severity === 'warning' ? 70 : 45 })),
                details: pulse.alerts.map(alert => `${alert.title}: ${alert.description}`),
                actions: [
                  'Abra os alertas com maior severidade primeiro e transforme cada um em uma ação concreta para os próximos 7 dias.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Radar inteligente</p>
                  <p className="text-xs text-white/40">Alertas proativos do mês</p>
                </div>
                <Icon name={ICONS.health.radar} className="text-xl text-[#A855F7]" />
              </div>

              <div className="space-y-3">
                {pulse.alerts.map(alert => {
                  const color = alertColor(alert.severity)
                  return (
                    <div key={alert.title} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <div className="flex gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18` }}>
                          <Icon name={alert.icon} className="text-base" style={{ color }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{alert.title}</p>
                          <p className="mt-1 text-xs leading-relaxed text-white/40">{alert.description}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <motion.section variants={stagger.item} className="lg:col-span-2">
            <AnalysisInsightCard
              insight={{
                title: 'Resumo inteligente',
                subtitle: 'Síntese FinSmart',
                summary: 'Esses insights traduzem os principais sinais financeiros do mês em linguagem humana.',
                interpretation: 'Cada insight aponta uma relação entre comportamento, risco e oportunidade.',
                metricLabel: 'Insights ativos',
                metricValue: String(pulse.insights.length),
                status: 'neutral',
                color: '#00E5FF',
                chart: pulse.insights.map((_, index) => ({ label: `I${index + 1}`, value: 65 + index * 8 })),
                details: pulse.insights,
                actions: [
                  'Escolha um insight para transformar em regra prática da semana.',
                  'Se o mesmo insight aparecer por vários dias, trate como padrão financeiro, não como evento isolado.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Resumo inteligente</p>
                  <p className="text-xs text-white/40">O que o sistema percebeu agora</p>
                </div>
                <Icon name={ICONS.brand.ai} className="text-xl text-[#00E5FF]" />
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {pulse.insights.map((insight, index) => (
                  <div key={insight} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
                    <p className="mb-3 text-xs text-white/25">Insight {index + 1}</p>
                    <p className="text-sm leading-relaxed text-white/70">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Dependência de cartão',
                subtitle: 'Uso do limite no ciclo atual',
                summary: 'O cartão vira risco quando antecipa consumo demais e pressiona meses futuros.',
                interpretation: creditLimit > 0 ? `${Math.round(pulse.cardUsagePercent)}% do limite está comprometido.` : 'Sem cartões cadastrados para leitura.',
                metricLabel: 'Uso do limite',
                metricValue: `${Math.round(pulse.cardUsagePercent)}%`,
                status: pulse.cardUsagePercent >= 90 ? 'danger' : pulse.cardUsagePercent >= 60 ? 'attention' : 'good',
                color: '#A855F7',
                chart: [
                  { label: 'Usado', value: creditUsed },
                  { label: 'Livre', value: Math.max(creditLimit - creditUsed, 0) },
                ],
                details: [
                  `Limite total: ${formatCurrencyBRL(creditLimit)}.`,
                  `Valor usado: ${formatCurrencyBRL(creditUsed)}.`,
                  'Parcelamentos e compras recorrentes aumentam pressão mesmo quando o saldo atual parece bom.',
                ],
                actions: [
                  pulse.cardUsagePercent >= 60 ? 'Evite novos parcelamentos até o percentual cair.' : 'Mantenha o cartão como ferramenta, não como extensão da renda.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Cartões</p>
                <Link href="/dashboard/cartoes" className="text-xs text-[#00E5FF]">Ver</Link>
              </div>
              <div className="mb-3 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className="h-full rounded-full bg-[#A855F7]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(pulse.cardUsagePercent, 100)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-white/40">
                <span>{formatCurrencyBRL(creditUsed)} usado</span>
                <span>{formatCurrencyBRL(creditLimit)} limite</span>
              </div>
              <p className="mt-4 text-sm text-white/60">
                {creditLimit > 0
                  ? `${Math.round(pulse.cardUsagePercent)}% do limite comprometido no ciclo atual.`
                  : 'Cadastre cartões para ativar leitura de dependência de crédito.'}
              </p>
            </Card>
            </AnalysisInsightCard>
          </motion.section>
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.section variants={stagger.item}>
            <AnalysisInsightCard
              insight={{
                title: 'Categorias quentes',
                subtitle: 'Concentração de gastos',
                summary: 'Categorias quentes mostram onde o dinheiro está indo e quais hábitos dominam o mês.',
                interpretation: hasCategoriasData ? `${topCategorias[0]?.nome ?? 'Uma categoria'} lidera os gastos.` : 'Ainda não há despesas suficientes para ranking real.',
                metricLabel: 'Categoria líder',
                metricValue: topCategorias[0]?.nome ?? 'Sem dados',
                status: hasCategoriasData && (topCategorias[0]?.percentual ?? 0) > 45 ? 'attention' : 'neutral',
                color: '#22C55E',
                chart: categoryTrend,
                details: topCategorias.map(cat => `${cat.nome}: ${Math.round(cat.percentual)}% das despesas, totalizando ${formatCurrencyBRL(cat.total)}.`),
                actions: [
                  'Se uma categoria passar de 40% das saídas, investigue se ela representa necessidade, sazonalidade ou vazamento.',
                ],
              }}
            >
            <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Categorias quentes</p>
                  <p className="text-xs text-white/40">Onde o dinheiro está indo</p>
                </div>
                <Link href="/dashboard/categorias" className="text-xs text-[#00E5FF]">Analisar</Link>
              </div>

              <div className="space-y-3">
                {topCategorias.map(cat => (
                  <div key={cat.categoria_id} className={cn(!hasCategoriasData && 'opacity-45')}>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: cat.cor }} />
                        <p className="truncate text-sm text-white/70">{cat.nome}</p>
                      </div>
                      <p className="text-sm font-semibold text-white">{formatCurrencyBRL(cat.total)}</p>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.cor }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(cat.percentual, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {!hasCategoriasData && (
                  <EmptyDataState
                    compact
                    icon={ICONS.finance.category}
                    title="Categorias aguardando dados"
                    description="Quando houver despesas, este ranking vira um mapa de comportamento."
                  />
                )}
              </div>
            </Card>
            </AnalysisInsightCard>
          </motion.section>

          <motion.section variants={stagger.item}>
            <Card className="p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">FinSmart</p>
                  <p className="text-xs text-white/40">Pergunte em português natural</p>
                </div>
                <Badge variant="purple">IA</Badge>
              </div>
              <FinSmartInput />
            </Card>
          </motion.section>
        </div>

        <motion.section variants={stagger.item}>
          <AnalysisInsightCard
            insight={{
              title: 'Timeline próxima',
              subtitle: 'Vencimentos no radar',
              summary: 'A timeline antecipa contas que podem mexer no caixa nos próximos dias.',
              interpretation: proximas.length > 0 ? `${proximas.length} vencimentos próximos detectados.` : 'Nenhum vencimento próximo relevante.',
              metricLabel: 'Total no radar',
              metricValue: formatCurrencyBRL(proximas.reduce((sum, conta) => sum + Number(conta.valor), 0)),
              status: proximas.some(conta => getDaysUntil(conta.vencimento) <= 2) ? 'attention' : 'neutral',
              color: '#F59E0B',
              chart: timelineTrend,
              details: proximas.length
                ? proximas.map(conta => `${conta.nome}: ${formatCurrencyBRL(Number(conta.valor))} vence em ${getDaysUntil(conta.vencimento)} dia(s).`)
                : ['Sem vencimentos próximos no período analisado.'],
              actions: [
                'Reserve caixa para vencimentos de até 7 dias antes de liberar gastos flexíveis.',
              ],
            }}
          >
          <Card className="p-4 transition-colors group-hover/analysis:border-white/[0.14] group-hover/analysis:bg-white/[0.045] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Timeline próxima</p>
                <p className="text-xs text-white/40">Vencimentos que podem mexer no caixa</p>
              </div>
              <Link href="/dashboard/contas" className="text-xs text-[#00E5FF]">Abrir contas</Link>
            </div>

            {proximas.length > 0 ? (
              <div className="grid gap-2 md:grid-cols-3">
                {proximas.map(conta => {
                  const dias = getDaysUntil(conta.vencimento)
                  const urgente = dias <= 2
                  return (
                    <div key={conta.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                      <div className="mb-3 flex items-center justify-between">
                        <Icon name={ICONS.finance.bill} className={cn('text-lg', urgente ? 'text-red-400' : 'text-amber-300')} />
                        <span className="text-xs text-white/35">
                          {dias === 0 ? 'hoje' : dias < 0 ? `${Math.abs(dias)}d atrás` : `${dias}d`}
                        </span>
                      </div>
                      <p className="truncate text-sm text-white/80">{conta.nome}</p>
                      <p className="mt-1 text-sm font-bold text-white">{formatCurrencyBRL(Number(conta.valor))}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyDataState
                compact
                icon={ICONS.finance.bill}
                title="Sem vencimentos no radar"
                description="Contas futuras aparecerão aqui como eventos financeiros."
              />
            )}
          </Card>
          </AnalysisInsightCard>
        </motion.section>
      </motion.div>
    </div>
  )
}

