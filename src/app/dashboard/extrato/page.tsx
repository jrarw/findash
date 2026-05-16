'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useTransacoesAll } from '@/hooks/useTransacoes'
import { useCategorias } from '@/hooks/useFinancas'
import { formatCurrencyBRL, formatDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'
import Link from 'next/link'
import type { Transacao, Categoria } from '@/types/database'

function groupByDay(transacoes: Transacao[]) {
  const groups: Record<string, Transacao[]> = {}
  transacoes.forEach(t => {
    if (!groups[t.data]) groups[t.data] = []
    groups[t.data].push(t)
  })
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
}

export default function ExtratoPage() {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entrada' | 'saida'>('todos')
  const { data: transacoes, isLoading } = useTransacoesAll(100)

  const filtradas = (transacoes ?? []).filter(t => {
    const matchBusca = !busca || t.descricao.toLowerCase().includes(busca.toLowerCase())
    const matchTipo = tipoFiltro === 'todos' || t.tipo === tipoFiltro
    return matchBusca && matchTipo
  })

  const grupos = groupByDay(filtradas)
  const totalPeriodo = filtradas.reduce((s, t) => {
    return t.tipo === 'entrada' ? s + t.valor : s - t.valor
  }, 0)

  return (
    <div className="app-page max-w-2xl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Extrato</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Todas as transações</p>
        </div>
        <Link href="/dashboard/lancar">
          <Button size="sm">
            <Icon name={ICONS.action.add} className="text-sm" />
            Lançar
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Icon name={ICONS.action.search} className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-subtle)]" />
          <input
            type="text"
            placeholder="Buscar por descrição..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="min-h-[52px] w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] py-2.5 pl-11 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--cyan)] focus:outline-none focus:ring-4 focus:ring-cyan-500/10"
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          {(['todos', 'entrada', 'saida'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipoFiltro(t)}
              className={cn(
                'min-h-11 shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all',
                tipoFiltro === t
                  ? 'bg-[var(--surface-muted)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              )}
            >
              {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
            </button>
          ))}

          <div className="flex-1" />
          <span className="shrink-0 self-center text-xs text-[var(--text-muted)]">
            Saldo: <span className={totalPeriodo >= 0 ? 'text-green-400' : 'text-red-400'}>
              {formatCurrencyBRL(totalPeriodo)}
            </span>
          </span>
        </div>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-4 w-48 rounded mb-2" />
              <div className="skeleton h-3 w-24 rounded" />
            </Card>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <Card className="p-8 text-center">
          <Icon name={ICONS.empty.noTransactions} className="mb-3 text-3xl text-[var(--text-subtle)]" />
          <p className="text-[var(--text-muted)]">Nenhuma transação encontrada</p>
          <Link href="/dashboard/lancar" className="mt-3 inline-block text-sm text-[#00E5FF]">
            Lançar primeira transação
          </Link>
        </Card>
      ) : (
        <div className="space-y-4">
          {grupos.map(([data, txs]) => (
            <div key={data}>
              <p className="sticky top-14 z-10 mb-2 bg-[var(--bg)]/90 py-2 text-xs font-medium text-[var(--text-subtle)] backdrop-blur">{formatDate(data)}</p>
              <div className="space-y-1.5">
                {txs.map(t => {
                  const cat = t.categoria as Categoria | null
                  return (
                    <motion.div
                      key={t.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className="flex min-h-[60px] items-center gap-3 p-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${cat?.cor ?? '#6B7280'}20` }}
                        >
                          <Icon
                            name={cat?.icone ?? ICONS.category.other}
                            className="text-sm"
                            style={{ color: cat?.cor ?? '#6B7280' }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{t.descricao}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[var(--text-subtle)]">{cat?.nome ?? 'Sem categoria'}</span>
                            {!t.efetivado && (
                              <Badge variant="warning" className="text-[10px] py-0">Pendente</Badge>
                            )}
                          </div>
                        </div>

                        <p className={cn(
                          'text-sm font-bold',
                          t.tipo === 'entrada' ? 'text-green-500' : 'text-[var(--text-primary)]'
                        )}>
                          {t.tipo === 'entrada' ? '+' : '-'}
                          {formatCurrencyBRL(t.valor)}
                        </p>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
