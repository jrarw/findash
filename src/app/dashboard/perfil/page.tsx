'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { useAtualizarPerfil, useUsuario } from '@/hooks/useFinancas'
import { formatCurrencyPreviewBRL, parseCurrencyBRLInput } from '@/lib/format'
import { ICONS } from '@/lib/iconography'
import type { ObjetivoFinanceiro } from '@/types/database'

const objetivos: Array<{ value: ObjetivoFinanceiro; label: string; description: string; icon: string }> = [
  {
    value: 'organizar',
    label: 'Organizar minhas finanças',
    description: 'Clareza sobre entradas, saídas e comportamento.',
    icon: ICONS.finance.transaction,
  },
  {
    value: 'economizar',
    label: 'Economizar mais',
    description: 'Criar sobra, reserva e constância.',
    icon: ICONS.finance.savings,
  },
  {
    value: 'sair_dividas',
    label: 'Sair das dívidas',
    description: 'Reduzir pressão e priorizar compromissos.',
    icon: ICONS.finance.debt,
  },
]

export default function PerfilPage() {
  const { data: usuario, isLoading } = useUsuario()
  const atualizarPerfil = useAtualizarPerfil()
  const [nome, setNome] = useState('')
  const [objetivo, setObjetivo] = useState<ObjetivoFinanceiro | null>('organizar')
  const [renda, setRenda] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  useEffect(() => {
    if (!usuario) return
    setNome(usuario.nome ?? '')
    setObjetivo(usuario.objetivo ?? 'organizar')
    setRenda(usuario.renda_mensal_estimada ? String(usuario.renda_mensal_estimada) : '')
  }, [usuario])

  async function handleSalvar() {
    const rendaParsed = renda.trim() ? parseCurrencyBRLInput(renda) : null

    if (!nome.trim()) {
      setErro('Informe seu nome para atualizar o perfil.')
      return
    }

    if (renda.trim() && (!Number.isFinite(rendaParsed) || Number(rendaParsed) < 0)) {
      setErro('Informe uma renda mensal válida.')
      return
    }

    setErro('')
    setSucesso('')

    try {
      await atualizarPerfil.mutateAsync({
        nome,
        objetivo,
        rendaMensalEstimada: rendaParsed,
      })
      setSucesso('Perfil atualizado com sucesso.')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível atualizar seu perfil.')
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
        <Card className="relative overflow-hidden p-5 md:p-6">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge variant="cyan">Perfil financeiro</Badge>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
                Editar perfil
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                Ajuste seus dados pessoais e preferências para deixar as leituras do FinSmart mais relevantes.
              </p>
            </div>
            <Link href="/dashboard/config" className="text-sm font-semibold text-[var(--cyan)]">
              Voltar às configurações
            </Link>
          </div>
        </Card>

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <Card className="p-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-violet-500 to-cyan-400 text-3xl font-bold text-white shadow-[0_18px_45px_rgba(6,182,212,0.16)]">
                {usuario?.nome?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <p className="mt-4 text-lg font-bold text-[var(--text-primary)]">{usuario?.nome ?? 'Usuário'}</p>
              <p className="text-sm text-[var(--text-muted)]">{usuario?.email}</p>
              <Badge variant="purple" className="mt-3">Plano {usuario?.plano ?? 'free'}</Badge>
            </div>

            <div className="mt-6 space-y-3 rounded-3xl border border-[var(--card-border)] bg-[var(--surface-soft)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Objetivo</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {objetivos.find(item => item.value === objetivo)?.label ?? 'Não definido'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Renda estimada</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {renda ? formatCurrencyPreviewBRL(parseCurrencyBRLInput(renda)) : 'Não definida'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Nome</span>
                <input
                  value={nome}
                  onChange={event => setNome(event.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none"
                  placeholder="Seu nome"
                  style={{ fontSize: '16px' }}
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Renda mensal estimada</span>
                <input
                  value={renda}
                  onChange={event => setRenda(event.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] outline-none"
                  placeholder="Ex: 8.000,00"
                  style={{ fontSize: '16px' }}
                />
              </label>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Objetivo financeiro</span>
                <div className="grid gap-2">
                  {objetivos.map(item => {
                    const active = objetivo === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setObjetivo(item.value)}
                        className={`rounded-2xl border p-3 text-left transition-all ${
                          active
                            ? 'border-cyan-500/25 bg-cyan-500/10 shadow-[0_10px_24px_rgba(6,182,212,0.08)]'
                            : 'border-[var(--card-border)] bg-[var(--surface-soft)] hover:bg-[var(--surface-hover)]'
                        }`}
                      >
                        <div className="flex gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-glass)]">
                            <Icon name={item.icon} className="text-lg text-[var(--cyan)]" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">{item.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {erro && <p className="rounded-2xl border border-red-500/15 bg-red-500/10 p-3 text-sm text-red-600">{erro}</p>}
              {sucesso && <p className="rounded-2xl border border-emerald-500/15 bg-emerald-500/10 p-3 text-sm text-emerald-600">{sucesso}</p>}

              <Button type="button" onClick={handleSalvar} loading={atualizarPerfil.isPending} className="w-full">
                Salvar alterações
              </Button>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  )
}
