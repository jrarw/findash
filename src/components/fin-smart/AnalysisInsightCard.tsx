'use client'

import { useId, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'

export interface AnalysisChartPoint {
  label: string
  value: number
}

export interface AnalysisInsight {
  title: string
  subtitle?: string
  summary: string
  interpretation: string
  details?: string[]
  actions?: string[]
  metricLabel?: string
  metricValue?: string
  status?: 'good' | 'attention' | 'danger' | 'neutral'
  color?: string
  chart?: AnalysisChartPoint[]
}

interface AnalysisInsightCardProps {
  insight: AnalysisInsight
  children: ReactNode
  className?: string
}

const STATUS_LABEL = {
  good: 'Saudável',
  attention: 'Atenção',
  danger: 'Risco',
  neutral: 'Leitura',
}

function statusColor(status: AnalysisInsight['status'], fallback?: string) {
  if (fallback) return fallback
  if (status === 'good') return '#22C55E'
  if (status === 'attention') return '#F59E0B'
  if (status === 'danger') return '#EF4444'
  return '#00E5FF'
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest('a, button, input, select, textarea, [data-no-insight]'))
}

export function AnalysisInsightCard({ insight, children, className }: AnalysisInsightCardProps) {
  const [open, setOpen] = useState(false)
  const gradientId = useId().replace(/:/g, '')
  const color = statusColor(insight.status, insight.color)
  const hasChart = (insight.chart?.length ?? 0) > 1

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={event => {
          if (!isInteractiveTarget(event.target)) setOpen(true)
        }}
        onKeyDown={event => {
          if ((event.key === 'Enter' || event.key === ' ') && !isInteractiveTarget(event.target)) {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className={cn('group/analysis relative cursor-pointer outline-none', className)}
        aria-label={`Abrir análise FinSmart: ${insight.title}`}
      >
        {children}
        <div className="pointer-events-none absolute right-3 top-3 z-10 flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--surface-glass)] px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] opacity-0 shadow-[0_10px_24px_rgba(15,23,42,0.06)] backdrop-blur-xl transition-opacity group-hover/analysis:opacity-100 group-focus-visible/analysis:opacity-100">
          <Icon name={ICONS.brand.ai} className="text-xs text-[#00E5FF]" />
          FinSmart
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center bg-[var(--bg-overlay)] px-2 pb-2 pt-8 backdrop-blur-xl md:items-center md:p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              onClick={event => event.stopPropagation()}
              className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[var(--radius-sheet)] border border-[var(--card-border)] bg-[var(--surface-glass)] p-4 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_30px_90px_rgba(15,23,42,0.18)] backdrop-blur-2xl md:max-h-[88dvh] md:rounded-[2rem] md:p-5"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--surface-muted)] md:hidden" />
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge variant="purple">FinSmart deep dive</Badge>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color, background: `${color}18` }}>
                      {STATUS_LABEL[insight.status ?? 'neutral']}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[var(--text-primary)] md:text-2xl">{insight.title}</h2>
                  {insight.subtitle && <p className="mt-1 text-sm text-[var(--text-muted)]">{insight.subtitle}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)]"
                  aria-label="Fechar análise"
                >
                  <Icon name={ICONS.action.close} />
                </button>
              </div>

              <Card className="mb-4 overflow-hidden p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl" style={{ background: `${color}18` }}>
                    <Icon name={ICONS.brand.ai} className="text-xl" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">Leitura FinSmart</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">{insight.summary}</p>
                  </div>
                </div>
              </Card>

              {(insight.metricLabel || insight.metricValue || hasChart) && (
                <div className="mb-4 grid gap-3 md:grid-cols-[0.75fr_1.25fr]">
                  {(insight.metricLabel || insight.metricValue) && (
                    <Card className="p-4">
                      <p className="text-xs text-[var(--text-muted)]">{insight.metricLabel ?? 'Métrica principal'}</p>
                      <p className="mt-2 text-2xl font-bold text-[var(--text-primary)]" style={{ color }}>{insight.metricValue}</p>
                      <p className="mt-2 text-xs leading-relaxed text-[var(--text-muted)]">{insight.interpretation}</p>
                    </Card>
                  )}

                  {hasChart && (
                    <Card className="p-4">
                      <p className="mb-3 text-xs font-semibold text-[var(--text-muted)]">Mini tendência</p>
                      <ResponsiveContainer width="100%" height={150}>
                        <AreaChart data={insight.chart}>
                          <defs>
                            <linearGradient id={`analysis-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                              <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="label" tick={{ fill: 'rgba(100,116,139,0.85)', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip
                            contentStyle={{
                              background: 'var(--surface-glass)',
                              border: '1px solid var(--card-border)',
                              borderRadius: '12px',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                            }}
                          />
                          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#analysis-${gradientId})`} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Card>
                  )}
                </div>
              )}

              {insight.details?.length ? (
                <Card className="mb-4 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Aprofundamento</p>
                  <div className="space-y-2">
                    {insight.details.map(detail => (
                      <div key={detail} className="flex gap-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: color }} />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}

              {insight.actions?.length ? (
                <Card className="p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-subtle)]">Próximos movimentos</p>
                  <div className="space-y-2">
                    {insight.actions.map(action => (
                      <div key={action} className="rounded-2xl border border-cyan-500/10 bg-cyan-500/[0.055] p-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                        {action}
                      </div>
                    ))}
                  </div>
                </Card>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
