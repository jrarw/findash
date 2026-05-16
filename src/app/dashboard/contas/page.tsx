'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyDataState } from '@/components/ui/empty-state'
import { Icon } from '@/components/ui/icon'
import { useContasPagar, useMarcarPaga } from '@/hooks/useContasPagar'
import { formatCurrencyBRL, formatDate, getDaysUntil } from '@/lib/format'
import { ICONS, type IconClass } from '@/lib/iconography'
import type { ContaPagar, Categoria } from '@/types/database'

type Grupo = 'vencidas' | 'hoje' | '7dias' | '30dias' | 'pagas'

function getGrupo(conta: ContaPagar): Grupo {
  if (conta.status === 'pago') return 'pagas'
  if (conta.status === 'cancelado') return 'pagas'
  const dias = getDaysUntil(conta.vencimento)
  if (dias < 0) return 'vencidas'
  if (dias === 0) return 'hoje'
  if (dias <= 7) return '7dias'
  return '30dias'
}

const GRUPOS_CONFIG: Record<Grupo, { label: string; color: string; icon: IconClass }> = {
  vencidas: { label: 'Vencidas', color: '#EF4444', icon: ICONS.status.danger },
  hoje: { label: 'Vence hoje', color: '#F97316', icon: ICONS.status.pending },
  '7dias': { label: 'Próximos 7 dias', color: '#EAB308', icon: ICONS.status.calendarWeek },
  '30dias': { label: 'Próximos 30 dias', color: '#00E5FF', icon: ICONS.status.calendarMonth },
  pagas: { label: 'Pagas', color: '#22C55E', icon: ICONS.status.paid },
}

export default function ContasPage() {
  const { data: contas, isLoading } = useContasPagar()
  const marcarPaga = useMarcarPaga()
  const [showPagas, setShowPagas] = useState(false)

  const grupos: Record<Grupo, ContaPagar[]> = {
    vencidas: [], hoje: [], '7dias': [], '30dias': [], pagas: []
  }

  contas?.forEach(c => {
    grupos[getGrupo(c)].push(c)
  })

  const totalVencido = grupos.vencidas.reduce((s, c) => s + Number(c.valor), 0)
  const totalMes = [...grupos.hoje, ...grupos['7dias'], ...grupos['30dias']].reduce((s, c) => s + Number(c.valor), 0)

  const ordensExibicao: Grupo[] = ['vencidas', 'hoje', '7dias', '30dias', ...(showPagas ? ['pagas' as Grupo] : [])]

  return (
    <div className="app-page max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Contas a Pagar</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Controle de vencimentos</p>
        </div>
        <Button size="sm" className="shrink-0">
          <Icon name={ICONS.action.add} className="text-sm" />
          Adicionar
        </Button>
      </div>

      {/* Resumo */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="min-h-[88px] p-4">
          <p className="mb-1 text-xs text-[var(--text-muted)]">Total vencido</p>
          <p className="text-lg font-bold text-red-400">{formatCurrencyBRL(totalVencido)}</p>
        </Card>
        <Card className="min-h-[88px] p-4">
          <p className="mb-1 text-xs text-[var(--text-muted)]">A vencer no mês</p>
          <p className="text-lg font-bold text-[#00E5FF]">{formatCurrencyBRL(totalMes)}</p>
        </Card>
      </div>

      {/* Grupos */}
      <div className="space-y-5">
        {ordensExibicao.map(grupo => {
          const itens = grupos[grupo]
          const config = GRUPOS_CONFIG[grupo]

          return (
            <div key={grupo}>
              <div className="sticky top-14 z-10 mb-2 flex items-center gap-2 bg-[var(--bg)]/90 py-2 backdrop-blur">
                <Icon name={config.icon} className="text-sm" style={{ color: config.color }} />
                <span className="text-sm font-medium" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-xs text-[var(--text-subtle)]">({itens.length})</span>
              </div>

              <div className="space-y-2">
                {itens.length > 0 ? itens.map(conta => {
                  const cat = conta.categoria as Categoria | null
                  const dias = getDaysUntil(conta.vencimento)

                  return (
                    <motion.div
                      key={conta.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="flex min-h-[60px] items-center gap-3 p-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${config.color}15` }}
                        >
                          <Icon name={cat?.icone ?? ICONS.finance.invoice} className="text-sm" style={{ color: config.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{conta.nome}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[var(--text-subtle)]">{formatDate(conta.vencimento)}</span>
                            {conta.recorrente && (
                              <Badge variant="purple" className="text-[10px] py-0">
                                <Icon name={ICONS.finance.recurring} className="text-[10px]" />
                                Recorrente
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-right text-sm font-bold text-[var(--text-primary)]">{formatCurrencyBRL(Number(conta.valor))}</p>
                          {conta.status === 'pendente' && (
                            <button
                              onClick={() => marcarPaga.mutate(conta.id)}
                              disabled={marcarPaga.isPending}
                              className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10 transition-colors hover:bg-green-500/20"
                              title="Marcar como paga"
                            >
                              <Icon name={ICONS.action.check} className="text-sm text-green-400" />
                            </button>
                          )}
                          {conta.status === 'pago' && (
                            <Icon name={ICONS.status.paid} className="text-lg text-green-400" />
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  )
                }) : (
                  <EmptyDataState
                    compact
                    icon={config.icon}
                    title={`Nada em "${config.label}"`}
                    description="Este grupo continua visível para manter a leitura do calendário financeiro."
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {grupos.pagas.length > 0 && (
        <button
          onClick={() => setShowPagas(!showPagas)}
          className="mt-4 text-sm text-white/30 hover:text-white/50 transition-colors"
        >
          {showPagas ? 'Ocultar pagas' : `Ver ${grupos.pagas.length} paga(s)`}
        </button>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <Card key={i} className="p-4">
              <div className="skeleton h-4 w-full rounded mb-2" />
              <div className="skeleton h-3 w-32 rounded" />
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
