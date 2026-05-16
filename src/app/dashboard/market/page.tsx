'use client'

import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card } from '@/components/ui/card'
import { AnalysisInsightCard, type AnalysisInsight } from '@/components/fin-smart/AnalysisInsightCard'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL } from '@/lib/format'
import { ICONS } from '@/lib/iconography'
import {
  MARKET_TABS,
  cartIntelligence,
  getItem,
  getStore,
  marketAnalytics,
  marketCategories,
  marketImportSchema,
  marketItems,
  marketPrices,
  marketStores,
  normalizedUnitPrice,
  priceComparisonRows,
  searchComparisonRows,
  shoppingList,
  type MarketTab,
} from '@/lib/market'

const COLORS = ['#06B6D4', '#8B5CF6', '#10B981', '#F9735B', '#F59E0B', '#3B82F6']

function money(value: number) {
  return formatCurrencyBRL(Number.isFinite(value) ? value : 0)
}

function MarketTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-3 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur-xl">
      <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{label}</p>
      <div className="space-y-1">
        {payload.map(item => (
          <div key={item.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-[var(--text-muted)]">
              <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
              {item.name}
            </span>
            <span className="font-semibold text-[var(--text-primary)]">
              {item.name?.toLowerCase().includes('inflação') || item.name?.toLowerCase().includes('variação') ? `${Number(item.value).toFixed(1)}%` : money(Number(item.value))}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  hint,
  icon,
  color,
  insight,
}: {
  label: string
  value: string
  hint: string
  icon: string
  color: string
  insight?: AnalysisInsight
}) {
  const card = (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: `${color}16`, color }}>
          <Icon name={icon} className="text-xl" />
        </div>
        <span className="rounded-full bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">Fin Market</span>
      </div>
      <p className="text-xs font-semibold text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-black text-[var(--text-primary)]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{hint}</p>
    </Card>
  )

  return insight ? <AnalysisInsightCard insight={insight}>{card}</AnalysisInsightCard> : card
}

function SectionHeader({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-[var(--text-primary)]">
          <Icon name={icon} />
          Fin Market
        </div>
        <h2 className="mt-3 text-2xl font-black tracking-tight text-[var(--text-primary)]">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{description}</p>
      </div>
    </div>
  )
}

function ConfirmClearModal({
  scope,
  onClose,
}: {
  scope: 'month' | 'old' | 'all'
  onClose: () => void
}) {
  const details = {
    month: {
      title: 'Limpar último mês?',
      description: 'Remove os registros de preço lançados no último mês desta área.',
      impact: 'Analytics recentes, inflação pessoal do período e comparações mais novas serão recalculados.',
      count: marketPrices.filter(price => price.date >= '2025-08-01').length,
    },
    old: {
      title: 'Limpar registros antigos?',
      description: 'Remove registros mais antigos, mantendo dados recentes para comparação atual.',
      impact: 'Histórico longo e evolução de inflação ficarão mais curtos.',
      count: marketPrices.filter(price => price.date < '2025-06-01').length,
    },
    all: {
      title: 'Resetar histórico completo?',
      description: 'Remove todos os registros de preço do seu histórico de supermercado.',
      impact: 'Comparador, analytics, inflação pessoal e carrinho inteligente voltarão ao estado inicial até novos lançamentos.',
      count: marketPrices.length,
    },
  }[scope]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-overlay)] p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-[2rem] border border-[var(--card-border)] bg-[var(--surface)] p-5 shadow-[0_28px_80px_rgba(15,23,42,0.24)]">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
            <Icon name={ICONS.status.warning} className="text-2xl" />
          </div>
          <div>
            <p className="text-xl font-black text-[var(--text-primary)]">{details.title}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{details.description}</p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-subtle)]">Impacto da ação</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{details.impact}</p>
          <p className="mt-3 text-sm font-bold text-orange-500">{details.count} registros seriam removidos.</p>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button onClick={onClose} className="h-11 rounded-2xl border border-[var(--card-border)] px-5 text-sm font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
            Cancelar
          </button>
          <button onClick={onClose} className="h-11 rounded-2xl bg-orange-500 px-5 text-sm font-bold text-white hover:bg-orange-400">
            Confirmar limpeza
          </button>
        </div>
      </div>
    </div>
  )
}

function OverviewTab() {
  const analytics = useMemo(() => marketAnalytics(), [])
  const cart = analytics.cart
  const categoryData = analytics.categoryRows.slice(0, 5)
  const priceCurve = analytics.itemInflation.slice(0, 7).map(row => ({
    item: row.item.name,
    inflação: Number(row.variation.toFixed(1)),
  }))

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Gasto estimado"
          value={money(analytics.estimatedMonthlySpend)}
          hint={`Teto mensal: ${money(analytics.monthlyCeiling)}`}
          icon={ICONS.finance.expense}
          color="#06B6D4"
          insight={{
            title: 'Gasto estimado de supermercado',
            subtitle: 'Cesta mensal da casa',
            summary: 'Este valor estima o peso atual da cesta de supermercado em relação ao teto mensal configurado.',
            interpretation: `${money(analytics.estimatedMonthlySpend)} consumidos de um teto de ${money(analytics.monthlyCeiling)}.`,
            metricLabel: 'Uso do teto',
            metricValue: `${Math.round((analytics.estimatedMonthlySpend / analytics.monthlyCeiling) * 100)}%`,
            status: analytics.estimatedMonthlySpend <= analytics.monthlyCeiling ? 'good' : 'attention',
            color: '#06B6D4',
            chart: categoryData.map(item => ({ label: item.category.slice(0, 8), value: item.total })),
            details: categoryData.map(item => `${item.category}: ${money(item.total)} em menor preço encontrado.`),
            actions: ['Revise as categorias mais pesadas antes de montar a próxima lista.'],
          }}
        />
        <MetricCard
          label="Economia possível"
          value={money(Math.max(analytics.possibleEconomy, 0))}
          hint="Dividindo a lista entre mercados"
          icon={ICONS.finance.safeSpend}
          color="#22C55E"
          insight={{
            title: 'Economia possível no carrinho',
            subtitle: 'Compra dividida por menor preço',
            summary: 'A economia compara comprar tudo no melhor mercado único versus dividir os itens pelos menores preços disponíveis.',
            interpretation: `Dividir a lista reduz o total em ${money(Math.max(analytics.possibleEconomy, 0))}.`,
            metricLabel: 'Economia estimada',
            metricValue: money(Math.max(analytics.possibleEconomy, 0)),
            status: analytics.possibleEconomy > 0 ? 'good' : 'neutral',
            color: '#22C55E',
            chart: [
              { label: 'Mercado único', value: cart.bestSingle?.total ?? 0 },
              { label: 'Dividido', value: cart.splitTotal },
            ],
            details: cart.storeTotals.map(item => `${item.store.name}: ${money(item.total)} para a lista atual.`),
            actions: ['Use a divisão inteligente quando a economia compensar deslocamento/frete.'],
          }}
        />
        <MetricCard
          label="Melhor mercado"
          value={analytics.bestStore?.name ?? 'Em análise'}
          hint="Ranking por menor preço e cobertura"
          icon={ICONS.finance.account}
          color="#8B5CF6"
          insight={{
            title: 'Mercado mais vantajoso',
            subtitle: 'Ranking de custo-benefício',
            summary: 'O ranking cruza quantidade de menores preços com cobertura de registros para evitar escolher um mercado por poucos itens.',
            interpretation: `${analytics.bestStore?.name ?? 'Mercado em análise'} lidera a leitura atual.`,
            metricLabel: 'Líder atual',
            metricValue: analytics.bestStore?.name ?? '—',
            status: 'neutral',
            color: '#8B5CF6',
            chart: analytics.storeRanking.map(row => ({ label: row.store.name.slice(0, 8), value: row.score })),
            details: analytics.storeRanking.map(row => `${row.store.name}: ${row.wins} menores preços e ${row.coverage} registros.`),
            actions: ['Cadastre mais preços para aumentar a confiabilidade do ranking.'],
          }}
        />
        <MetricCard
          label="Inflação pessoal"
          value={`${analytics.personalInflation.toFixed(1)}%`}
          hint="Variação média da sua cesta recorrente"
          icon={ICONS.chart.trendUp}
          color="#F9735B"
          insight={{
            title: 'Inflação pessoal da cesta',
            subtitle: 'Não é inflação oficial',
            summary: 'Esta leitura mede a variação dos itens recorrentes da sua casa, usando os registros que você cadastrou ou importou.',
            interpretation: `Sua cesta recorrente variou ${analytics.personalInflation.toFixed(1)}% no histórico demonstrativo.`,
            metricLabel: 'Inflação pessoal',
            metricValue: `${analytics.personalInflation.toFixed(1)}%`,
            status: analytics.personalInflation > 8 ? 'attention' : 'good',
            color: '#F9735B',
            chart: priceCurve.map(item => ({ label: item.item.slice(0, 8), value: item.inflação })),
            details: analytics.itemInflation.slice(0, 5).map(item => `${item.item.name}: ${item.variation.toFixed(1)}% de variação.`),
            actions: ['Acompanhe os itens recorrentes para separar aumento real de troca de embalagem ou marca.'],
          }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_0.9fr]">
        <Card className="p-5">
          <SectionHeader title="Central inteligente da casa" description="Resumo do que mudou na sua cesta, onde comprar melhor e quais categorias merecem atenção." icon={ICONS.brand.ai} />
          <div className="grid gap-3 md:grid-cols-3">
            {[
              `Você economizaria ${money(Math.max(cart.economy, 0))} dividindo parte da lista entre mercados.`,
              `${analytics.bestStore?.name ?? 'Mercado mais barato'} está mais vantajoso no conjunto de itens analisados.`,
              analytics.mostUp ? `${analytics.mostUp.item.name} foi o item com maior alta relativa.` : 'Ainda faltam registros para detectar altas relevantes.',
            ].map((insight, index) => (
              <div key={insight} className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--text-subtle)]">Insight {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">{insight}</p>
              </div>
            ))}
          </div>
        </Card>

        <AnalysisInsightCard
          insight={{
            title: 'Peso por categoria',
            subtitle: 'Distribuição da cesta',
            summary: 'Mostra quais grupos concentram mais custo no menor preço disponível, ajudando a priorizar comparação.',
            interpretation: categoryData[0] ? `${categoryData[0].category} é a categoria mais pesada.` : 'Ainda sem categorias suficientes.',
            metricLabel: 'Categorias',
            metricValue: String(categoryData.length),
            status: 'neutral',
            color: '#8B5CF6',
            chart: categoryData.map(item => ({ label: item.category.slice(0, 8), value: item.total })),
            details: categoryData.map(item => `${item.category}: ${money(item.total)}.`),
            actions: ['Comece comparando os itens das categorias mais pesadas.'],
          }}
        >
          <Card className="p-5 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035]">
            <p className="text-sm font-black text-[var(--text-primary)]">Categorias com maior peso</p>
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={categoryData} dataKey="total" nameKey="category" innerRadius={58} outerRadius={86} paddingAngle={4}>
                  {categoryData.map((entry, index) => <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<MarketTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </AnalysisInsightCard>
      </div>

      <AnalysisInsightCard
        insight={{
          title: 'Itens que mais mudaram',
          subtitle: 'Inflação pessoal por produto',
          summary: 'Esta análise destaca a variação proporcional de cada item recorrente, evitando olhar apenas o preço final.',
          interpretation: analytics.mostUp ? `${analytics.mostUp.item.name} teve a maior alta.` : 'Sem alta detectada.',
          metricLabel: 'Maior alta',
          metricValue: analytics.mostUp ? `${analytics.mostUp.variation.toFixed(1)}%` : '—',
          status: (analytics.mostUp?.variation ?? 0) > 10 ? 'attention' : 'neutral',
          color: '#F9735B',
          chart: priceCurve.map(item => ({ label: item.item.slice(0, 8), value: item.inflação })),
          details: analytics.itemInflation.slice(0, 7).map(item => `${item.item.name}: ${item.variation.toFixed(1)}%.`),
          actions: ['Quando um item sobe muito, compare marcas e embalagens antes de trocar de mercado.'],
        }}
      >
        <Card className="p-5 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035]">
          <p className="text-sm font-black text-[var(--text-primary)]">Inflação por item recorrente</p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Leitura própria, baseada no histórico da sua cesta.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={priceCurve} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="rgba(100,116,139,0.10)" vertical={false} />
              <XAxis dataKey="item" tick={{ fill: 'rgba(100,116,139,0.82)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={<MarketTooltip />} />
              <Bar dataKey="inflação" name="Inflação pessoal" radius={[8, 8, 0, 0]} fill="#F9735B" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </AnalysisInsightCard>
    </div>
  )
}

function ListTab() {
  const cart = useMemo(() => cartIntelligence(), [])

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard
          label="Total previsto"
          value={money(cart.bestSingle?.total ?? 0)}
          hint={`Melhor mercado único: ${cart.bestSingle?.store.name ?? '—'}`}
          icon={ICONS.category.groceries}
          color="#06B6D4"
          insight={{
            title: 'Total previsto da lista',
            subtitle: 'Compra em um único mercado',
            summary: 'Calcula quanto custaria comprar a lista inteira no mercado único mais vantajoso.',
            interpretation: `${cart.bestSingle?.store.name ?? '—'} fecha em ${money(cart.bestSingle?.total ?? 0)}.`,
            metricLabel: 'Total único',
            metricValue: money(cart.bestSingle?.total ?? 0),
            status: 'neutral',
            color: '#06B6D4',
            chart: cart.storeTotals.map(item => ({ label: item.store.name.slice(0, 8), value: item.total })),
            details: cart.storeTotals.map(item => `${item.store.name}: ${money(item.total)}.`),
            actions: ['Compare com a divisão inteligente antes de decidir deslocamento ou frete.'],
          }}
        />
        <MetricCard
          label="Divisão inteligente"
          value={money(cart.splitTotal)}
          hint="Menor preço por item"
          icon={ICONS.finance.adjustment}
          color="#22C55E"
          insight={{
            title: 'Divisão inteligente da compra',
            subtitle: 'Menor preço por item',
            summary: 'Seleciona o menor preço proporcional de cada item, mesmo que esteja em mercados diferentes.',
            interpretation: `A compra otimizada fica em ${money(cart.splitTotal)}.`,
            metricLabel: 'Total otimizado',
            metricValue: money(cart.splitTotal),
            status: 'good',
            color: '#22C55E',
            chart: cart.rows.map(row => ({ label: row.item?.name.slice(0, 8) ?? 'Item', value: row.best ? normalizedUnitPrice(row.best) : 0 })),
            details: cart.rows.map(row => `${row.item?.name}: melhor em ${getStore(row.best?.storeId ?? '')?.name ?? '—'}.`),
            actions: ['Use quando a economia superar tempo, frete ou deslocamento.'],
          }}
        />
        <MetricCard
          label="Economia potencial"
          value={money(Math.max(cart.economy, 0))}
          hint="Diferença entre compra única e compra otimizada"
          icon={ICONS.finance.safeSpend}
          color="#8B5CF6"
          insight={{
            title: 'Economia potencial da lista',
            subtitle: 'Compra única vs. otimizada',
            summary: 'Mostra o ganho financeiro se você dividir a compra pelo menor preço proporcional de cada item.',
            interpretation: `Economia estimada de ${money(Math.max(cart.economy, 0))}.`,
            metricLabel: 'Economia',
            metricValue: money(Math.max(cart.economy, 0)),
            status: cart.economy > 0 ? 'good' : 'neutral',
            color: '#8B5CF6',
            chart: [
              { label: 'Único', value: cart.bestSingle?.total ?? 0 },
              { label: 'Otimizado', value: cart.splitTotal },
            ],
            details: ['A economia considera preço proporcional, quantidade da lista e melhor preço cadastrado por item.'],
            actions: ['Atualize preços antes de compras grandes para evitar decisão com dado antigo.'],
          }}
        />
      </div>

      <Card className="p-5">
        <SectionHeader title="Lista de compras inteligente" description="Cada item aponta prioridade, melhor mercado e custo estimado proporcional." icon={ICONS.category.groceries} />
        <div className="grid gap-3">
          {cart.rows.map(row => {
            const store = getStore(row.best?.storeId ?? '')
            return (
              <div key={row.listItem.id} className={cn('rounded-3xl border p-4', row.listItem.checked ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-[var(--card-border)] bg-[var(--surface-soft)]')}>
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className={cn('mt-1 flex h-6 w-6 items-center justify-center rounded-full border', row.listItem.checked ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-[var(--card-border)]')}>
                      {row.listItem.checked && <Icon name={ICONS.action.check} className="text-sm" />}
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-primary)]">{row.item?.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{row.item?.brand ?? row.item?.category} · qtd. {row.listItem.quantity} · prioridade {row.listItem.priority}</p>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-sm font-black text-[var(--text-primary)]">{money((row.best ? normalizedUnitPrice(row.best) : 0) * (row.item?.quantity ?? 1) * row.listItem.quantity)}</p>
                    <p className="text-xs text-[var(--text-muted)]">comprar em {store?.name ?? '—'}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function CompareTab() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | undefined>()
  const categories = useMemo(() => marketCategories(), [])
  const rows = useMemo(() => searchComparisonRows(query, category), [query, category])
  const suggestions = useMemo(() => priceComparisonRows().slice(0, 5).map(row => row.item.name), [])

  return (
    <Card className="p-5">
      <SectionHeader title="Comparador de preços reais" description="Compara preço final e preço proporcional por kg, litro ou unidade equivalente." icon={ICONS.chart.bar} />
      <div className="mb-4 rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Icon name={ICONS.action.search} className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[var(--text-subtle)]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por item, marca, categoria ou mercado..."
              className="h-12 w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-cyan-400/45 focus:ring-4 focus:ring-cyan-400/10"
            />
          </label>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategory(undefined)}
              className={cn('h-12 shrink-0 rounded-2xl px-4 text-xs font-bold transition', !category ? 'bg-cyan-500 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
            >
              Todos
            </button>
            {categories.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn('h-12 shrink-0 rounded-2xl px-4 text-xs font-bold transition', category === item ? 'bg-cyan-500 text-white' : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-primary)]')}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[var(--text-subtle)]">Sugestões:</span>
          {suggestions.map(item => (
            <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-full bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              {item}
            </button>
          ))}
          <span className="ml-auto text-xs font-semibold text-[var(--text-muted)]">{rows.length} resultados</span>
        </div>
      </div>
      <div className="grid gap-3">
        {rows.slice(0, 10).map(row => {
          const bestStore = getStore(row.best?.storeId ?? '')
          const worstStore = getStore(row.worst?.storeId ?? '')
          return (
            <AnalysisInsightCard
              key={row.item.id}
              insight={{
                title: `Comparação: ${row.item.name}`,
                subtitle: `${row.item.category} · ${row.item.brand ?? 'sem marca'}`,
                summary: 'Compara o menor preço proporcional, maior preço proporcional e economia relativa para este item.',
                interpretation: `${bestStore?.name ?? '—'} está mais barato que ${worstStore?.name ?? '—'} neste item.`,
                metricLabel: 'Menor preço proporcional',
                metricValue: money(normalizedUnitPrice(row.best!)),
                status: row.savingsPct > 15 ? 'good' : 'neutral',
                color: '#06B6D4',
                chart: row.prices.map(price => ({ label: getStore(price.storeId)?.name.slice(0, 8) ?? 'Mercado', value: normalizedUnitPrice(price) })),
                details: row.prices.map(price => `${getStore(price.storeId)?.name ?? 'Mercado'}: ${money(price.price)} (${money(normalizedUnitPrice(price))} proporcional).`),
                actions: ['Antes de comprar, confira se embalagem, peso e marca são realmente equivalentes.'],
              }}
            >
              <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4 transition-colors group-hover/analysis:border-cyan-400/20 group-hover/analysis:bg-cyan-400/[0.035]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-black text-[var(--text-primary)]">{row.item.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{row.item.category} · {row.item.brand ?? 'sem marca'} · base proporcional</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[560px]">
                    <div className="rounded-2xl bg-emerald-500/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-600">Menor preço</p>
                      <p className="mt-1 text-sm font-black text-[var(--text-primary)]">{money(normalizedUnitPrice(row.best!))}</p>
                      <p className="text-xs text-[var(--text-muted)]">{bestStore?.name}</p>
                    </div>
                    <div className="rounded-2xl bg-orange-500/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">Maior preço</p>
                      <p className="mt-1 text-sm font-black text-[var(--text-primary)]">{money(normalizedUnitPrice(row.worst!))}</p>
                      <p className="text-xs text-[var(--text-muted)]">{worstStore?.name}</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-500/10 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-600">Economia</p>
                      <p className="mt-1 text-sm font-black text-[var(--text-primary)]">{row.savingsPct.toFixed(1)}%</p>
                      <p className="text-xs text-[var(--text-muted)]">vs maior preço</p>
                    </div>
                  </div>
                </div>
              </div>
            </AnalysisInsightCard>
          )
        })}
        {rows.length === 0 && (
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-8 text-center">
            <Icon name={ICONS.empty.noData} className="mx-auto text-3xl text-[var(--text-subtle)]" />
            <p className="mt-3 font-black text-[var(--text-primary)]">Nenhum item encontrado</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Tente buscar por categoria, marca, mercado ou parte do nome.</p>
          </div>
        )}
      </div>
    </Card>
  )
}

function ItemsTab() {
  return (
    <Card className="p-5">
      <SectionHeader title="Cadastro de itens" description="Estrutura pronta para editar, duplicar, filtrar e manter itens recorrentes ativos." icon={ICONS.finance.category} />
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input className="h-11 flex-1 rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 text-sm text-[var(--text-primary)] outline-none focus:border-cyan-400/40" placeholder="Buscar item, marca ou categoria" />
        <button className="h-11 rounded-2xl bg-cyan-500 px-5 text-sm font-bold text-white">Novo item</button>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {marketItems.map(item => (
          <div key={item.id} className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[var(--text-primary)]">{item.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.brand ?? 'Sem marca'} · {item.quantity}{item.unit} · {item.category}</p>
              </div>
              <span className={cn('rounded-full px-2 py-1 text-[10px] font-bold', item.recurring ? 'bg-cyan-500/10 text-cyan-600' : 'bg-[var(--surface-muted)] text-[var(--text-subtle)]')}>
                {item.recurring ? 'recorrente' : 'eventual'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function StoresTab() {
  const analytics = useMemo(() => marketAnalytics(), [])

  return (
    <Card className="p-5">
      <SectionHeader title="Mercados cadastrados" description="Veja score de custo-benefício, cobertura de itens e categorias onde cada mercado vence." icon={ICONS.finance.account} />
      <div className="grid gap-3 md:grid-cols-2">
        {analytics.storeRanking.map(row => (
          <div key={row.store.id} className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-black text-[var(--text-primary)]">{row.store.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{row.store.location} · {row.store.kind}</p>
              </div>
              <span className="rounded-full bg-cyan-500/10 px-2 py-1 text-xs font-black text-cyan-600">{row.score} pts</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{row.store.notes}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Menores preços</p>
                <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{row.wins}</p>
              </div>
              <div className="rounded-2xl bg-[var(--surface)] p-3">
                <p className="text-xs text-[var(--text-muted)]">Registros</p>
                <p className="mt-1 text-lg font-black text-[var(--text-primary)]">{row.coverage}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function AnalyticsTab() {
  const analytics = useMemo(() => marketAnalytics(), [])
  const storeData = analytics.storeRanking.map(row => ({ mercado: row.store.name, score: row.score, vitórias: row.wins }))
  const categoryData = analytics.categoryRows.map(row => ({ categoria: row.category, total: row.total }))

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <p className="text-sm font-black text-[var(--text-primary)]">Ranking de mercados</p>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={storeData}>
            <CartesianGrid stroke="rgba(100,116,139,0.10)" vertical={false} />
            <XAxis dataKey="mercado" tick={{ fill: 'rgba(100,116,139,0.82)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<MarketTooltip />} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]} fill="#06B6D4" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-5">
        <p className="text-sm font-black text-[var(--text-primary)]">Curva de custo da cesta</p>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={categoryData}>
            <defs>
              <linearGradient id="marketCost" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(100,116,139,0.10)" vertical={false} />
            <XAxis dataKey="categoria" tick={{ fill: 'rgba(100,116,139,0.82)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<MarketTooltip />} />
            <Area type="monotone" dataKey="total" name="Custo" stroke="#8B5CF6" fill="url(#marketCost)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}

function HistoryTab() {
  const [clearScope, setClearScope] = useState<'month' | 'old' | 'all' | null>(null)

  return (
    <>
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader title="Histórico de preços" description="Base preparada para edição, exclusão, filtros por item, mercado, categoria e período." icon={ICONS.health.timeline} />
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setClearScope('month')} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
              Limpar último mês
            </button>
            <button onClick={() => setClearScope('old')} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3 py-2 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
              Limpar antigos
            </button>
            <button onClick={() => setClearScope('all')} className="rounded-2xl bg-orange-500 px-3 py-2 text-xs font-bold text-white hover:bg-orange-400">
              Resetar histórico
            </button>
          </div>
        </div>
        <div className="mb-4 rounded-3xl border border-orange-400/20 bg-orange-400/[0.055] p-4">
          <div className="flex gap-3">
            <Icon name={ICONS.status.info} className="mt-0.5 text-lg text-orange-500" />
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              A limpeza deve ser isolada por usuário. Na versão com Supabase, essas ações filtram por `usuario_id` antes de apagar qualquer registro.
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-[var(--card-border)]">
          <div className="grid grid-cols-[1.2fr_1fr_0.9fr_0.8fr] bg-[var(--surface-soft)] px-4 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)]">
            <span>Item</span>
            <span>Mercado</span>
            <span>Preço</span>
            <span>Data</span>
          </div>
          {marketPrices.slice(0, 14).map(price => {
            const item = getItem(price.itemId)
            const store = getStore(price.storeId)
            return (
              <div key={price.id} className="grid grid-cols-[1.2fr_1fr_0.9fr_0.8fr] border-t border-[var(--card-border)] px-4 py-3 text-sm">
                <span className="font-semibold text-[var(--text-primary)]">{item?.name}</span>
                <span className="text-[var(--text-muted)]">{store?.name}</span>
                <span className="font-bold text-[var(--text-primary)]">{money(price.price)}</span>
                <span className="text-[var(--text-muted)]">{price.date.slice(0, 7)}</span>
              </div>
            )
          })}
        </div>
      </Card>
      {clearScope && <ConfirmClearModal scope={clearScope} onClose={() => setClearScope(null)} />}
    </>
  )
}

function SettingsTab() {
  const schema = useMemo(() => marketImportSchema(), [])

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="p-5">
        <SectionHeader title="Importar planilha própria" description="Importação individual, isolada por usuário e preparada para formatos diferentes de planilha." icon={ICONS.import.file} />
        <div className="rounded-3xl border border-dashed border-cyan-400/35 bg-cyan-400/[0.055] p-6 text-center">
          <Icon name={ICONS.import.upload} className="mx-auto text-4xl text-cyan-500" />
          <p className="mt-3 font-black text-[var(--text-primary)]">Solte sua planilha aqui</p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            O arquivo de exemplo serviu apenas para entender campos e fluxo. O sistema final deve salvar apenas dados importados pelo próprio usuário.
          </p>
        </div>
        <div className="mt-4 grid gap-2">
          {['1. Upload seguro', '2. Preview dos dados', '3. Mapeamento de colunas', '4. Validação de erros', '5. Confirmação antes de importar'].map(step => (
            <div key={step} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-[var(--text-primary)]">
              {step}
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <SectionHeader title="Mapeamento flexível" description="Campos esperados, aliases e obrigatoriedade para aceitar planilhas em formatos diferentes." icon={ICONS.import.mapping} />
        <div className="grid gap-2">
          {schema.map(field => (
            <div key={field.key} className="rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-[var(--text-primary)]">{field.label}</p>
                <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-bold', field.required ? 'bg-orange-500/10 text-orange-500' : 'bg-cyan-500/10 text-cyan-600')}>
                  {field.required ? 'obrigatório' : 'opcional'}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Aceita: {field.aliases.join(', ')}</p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <SectionHeader title="Preferências da área" description="Configurações futuras para cesta recorrente, mercados favoritos, unidade padrão e alertas de aumento." icon={ICONS.nav.settings} />
        <div className="space-y-3">
          {['Alertar quando item subir acima de 10%', 'Preferir menor preço unitário', 'Separar farmácia de supermercado', 'Considerar compra online no comparador'].map(setting => (
            <div key={setting} className="flex items-center justify-between rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-3">
              <span className="text-sm font-semibold text-[var(--text-primary)]">{setting}</span>
              <span className="h-6 w-11 rounded-full bg-cyan-500/20 p-1"><span className="block h-4 w-4 rounded-full bg-cyan-500" /></span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default function MarketPage() {
  const [activeTab, setActiveTab] = useState<MarketTab>('overview')

  const content = {
    overview: <OverviewTab />,
    list: <ListTab />,
    compare: <CompareTab />,
    items: <ItemsTab />,
    stores: <StoresTab />,
    analytics: <AnalyticsTab />,
    history: <HistoryTab />,
    settings: <SettingsTab />,
  }[activeTab]

  return (
    <div className="app-page">
      <div className="app-stack">
        <Card className="relative overflow-hidden p-5 md:p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-12 h-64 w-64 rounded-full bg-cyan-400/14 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.22em] text-[var(--text-primary)]">
                <Icon name={ICONS.category.groceries} />
                Supermercado Inteligente
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">Fin Market</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)] md:text-base">
                Um mini app dentro do Fin App para comparar mercados, montar listas, acompanhar inflação pessoal e transformar dados próprios de compra em inteligência da casa.
              </p>
            </div>
            <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--surface-glass)] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Dados demonstrativos</p>
              <p className="mt-1 text-xl font-black text-[var(--text-primary)]">{marketItems.length} itens · {marketStores.length} mercados</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{marketPrices.length} registros de preço</p>
            </div>
          </div>
        </Card>

        <div className="no-scrollbar flex gap-2 overflow-x-auto rounded-[1.5rem] border border-[var(--card-border)] bg-[var(--surface-soft)] p-2">
          {MARKET_TABS.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex min-h-11 shrink-0 items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition duration-150',
                activeTab === tab.key
                  ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_10px_24px_rgba(15,23,42,0.06)]'
                  : 'text-[rgba(0,0,0,0.40)] hover:bg-[var(--surface)]/60',
              )}
            >
              <Icon name={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        {content}
      </div>
    </div>
  )
}
