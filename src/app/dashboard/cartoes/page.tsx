'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { useAdicionarCartao, useCartoesCredito, useComprasCartao, useFaturasCartao } from '@/hooks/useCartoes'
import { cn } from '@/lib/cn'
import { formatCurrencyBRL, formatMonth, getCurrentMonthYear, parseCurrencyBRLInput } from '@/lib/format'
import { ICONS } from '@/lib/iconography'
import type { CartaoBandeira, CartaoCredito, CompraCartao } from '@/types/database'

const bandeiras: { value: CartaoBandeira; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'amex', label: 'Amex' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'outro', label: 'Outro' },
]

const cores = ['#00E5FF', '#A855F7', '#22C55E', '#F59E0B', '#EF4444']

function usageColor(percentual: number) {
  if (percentual >= 90) return '#EF4444'
  if (percentual >= 60) return '#F59E0B'
  if (percentual >= 30) return '#A855F7'
  return '#00E5FF'
}

function usageLabel(percentual: number) {
  if (percentual >= 90) return 'Risco alto'
  if (percentual >= 60) return 'Uso elevado'
  if (percentual >= 30) return 'Acompanhar'
  return 'Confortável'
}

function LimitRing({ percentual, color }: { percentual: number; color: string }) {
  const radius = 44
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percentual, 100) / 100) * circumference

  return (
    <div className="relative h-28 w-28">
      <svg className="-rotate-90" width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
        <motion.circle
          cx="56"
          cy="56"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-white">{Math.round(percentual)}%</span>
        <span className="text-[10px] text-white/35">usado</span>
      </div>
    </div>
  )
}

function CardSkeleton() {
  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="mb-2 h-4 w-32 rounded skeleton" />
          <div className="h-3 w-20 rounded skeleton" />
        </div>
        <div className="h-12 w-12 rounded-2xl skeleton" />
      </div>
      <div className="h-24 rounded-2xl skeleton" />
    </Card>
  )
}

export default function CartoesPage() {
  const { mes, ano } = getCurrentMonthYear()
  const { data: cartoes, isLoading: loadingCartoes } = useCartoesCredito()
  const { data: compras, isLoading: loadingCompras } = useComprasCartao(mes, ano)
  const { data: faturas } = useFaturasCartao(mes, ano)
  const adicionarCartao = useAdicionarCartao()
  const [showForm, setShowForm] = useState(false)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [bandeira, setBandeira] = useState<CartaoBandeira>('visa')
  const [limite, setLimite] = useState('')
  const [diaFechamento, setDiaFechamento] = useState('5')
  const [diaVencimento, setDiaVencimento] = useState('12')
  const [cor, setCor] = useState('#00E5FF')

  const isLoading = loadingCartoes || loadingCompras

  const cartoesView = useMemo(() => {
    const comprasPorCartao = new Map<string, CompraCartao[]>()
    ;(compras ?? []).forEach(compra => {
      const atuais = comprasPorCartao.get(compra.cartao_id) ?? []
      comprasPorCartao.set(compra.cartao_id, [...atuais, compra])
    })

    return (cartoes ?? []).map(cartao => {
      const comprasCartao = comprasPorCartao.get(cartao.id) ?? []
      const fatura = faturas?.find(item => item.cartao_id === cartao.id)
      const usado = fatura ? Number(fatura.valor_total) : comprasCartao.reduce((sum, compra) => sum + Number(compra.valor_total), 0)
      const limiteTotal = Number(cartao.limite_total)
      const percentual = limiteTotal > 0 ? (usado / limiteTotal) * 100 : 0
      const disponivel = Math.max(limiteTotal - usado, 0)
      const parcelamentos = comprasCartao.filter(compra => compra.parcelas_total > 1)

      return {
        cartao,
        usado,
        percentual,
        disponivel,
        compras: comprasCartao,
        parcelamentos,
      }
    })
  }, [cartoes, compras, faturas])

  const limiteTotal = cartoesView.reduce((sum, item) => sum + Number(item.cartao.limite_total), 0)
  const utilizado = cartoesView.reduce((sum, item) => sum + item.usado, 0)
  const disponivel = Math.max(limiteTotal - utilizado, 0)
  const percentualGeral = limiteTotal > 0 ? (utilizado / limiteTotal) * 100 : 0

  async function handleAdicionarCartao() {
    const limiteTotalParsed = parseCurrencyBRLInput(limite)
    const fechamento = Number(diaFechamento)
    const vencimento = Number(diaVencimento)

    if (!nome.trim()) {
      setErro('Informe o nome do cartão.')
      return
    }

    if (!Number.isFinite(limiteTotalParsed) || limiteTotalParsed <= 0) {
      setErro('Informe um limite válido maior que zero.')
      return
    }

    if (fechamento < 1 || fechamento > 31 || vencimento < 1 || vencimento > 31) {
      setErro('Fechamento e vencimento precisam estar entre os dias 1 e 31.')
      return
    }

    setErro('')

    try {
      await adicionarCartao.mutateAsync({
        nome,
        bandeira,
        limiteTotal: limiteTotalParsed,
        diaFechamento: fechamento,
        diaVencimento: vencimento,
        cor,
      })
      setNome('')
      setLimite('')
      setShowForm(false)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível cadastrar o cartão.')
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
      >
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#00E5FF]">Crédito</p>
          <h1 className="text-2xl font-bold text-white">Cartões</h1>
          <p className="text-sm capitalize text-white/40">Fatura atual de {formatMonth(mes, ano)}</p>
        </div>
        <Button type="button" onClick={() => setShowForm(current => !current)} className="w-full md:w-auto">
          <Icon name={ICONS.finance.card} className="text-base" />
          Novo cartão
        </Button>
      </motion.div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-white/40">Limite total</p>
          <p className="mt-2 text-xl font-bold text-white">{formatCurrencyBRL(limiteTotal)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Utilizado</p>
          <p className="mt-2 text-xl font-bold" style={{ color: usageColor(percentualGeral) }}>{formatCurrencyBRL(utilizado)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-white/40">Disponível</p>
          <p className="mt-2 text-xl font-bold text-[#00E5FF]">{formatCurrencyBRL(disponivel)}</p>
        </Card>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="mb-4 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Cadastrar cartão</p>
                <p className="text-xs text-white/40">Crie uma entidade própria para limite, fatura e parcelamentos.</p>
              </div>
              <Icon name={ICONS.brand.ai} className="text-xl text-[#A855F7]" />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label>
                <span className="mb-1 block text-xs text-white/40">Nome do cartão</span>
                <input value={nome} onChange={event => setNome(event.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none" placeholder="Ex: Nubank Ultravioleta" style={{ fontSize: '16px' }} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-white/40">Limite</span>
                <input value={limite} onChange={event => setLimite(event.target.value)} inputMode="decimal" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none" placeholder="Ex: 8.000,00" style={{ fontSize: '16px' }} />
              </label>
              <label>
                <span className="mb-1 block text-xs text-white/40">Bandeira</span>
                <select value={bandeira} onChange={event => setBandeira(event.target.value as CartaoBandeira)} className="w-full rounded-xl border border-white/[0.08] bg-[#111119] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none" style={{ fontSize: '16px' }}>
                  {bandeiras.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label>
                  <span className="mb-1 block text-xs text-white/40">Fechamento</span>
                  <input value={diaFechamento} onChange={event => setDiaFechamento(event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none" style={{ fontSize: '16px' }} />
                </label>
                <label>
                  <span className="mb-1 block text-xs text-white/40">Vencimento</span>
                  <input value={diaVencimento} onChange={event => setDiaVencimento(event.target.value)} inputMode="numeric" className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-white focus:border-[#00E5FF]/50 focus:outline-none" style={{ fontSize: '16px' }} />
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {cores.map(item => (
                <button key={item} type="button" onClick={() => setCor(item)} className={cn('h-8 w-8 rounded-full border-2', cor === item ? 'border-white' : 'border-transparent')} style={{ background: item }} />
              ))}
            </div>

            {erro && <p className="mt-4 text-sm text-red-300"><Icon name={ICONS.status.danger} className="mr-2" />{erro}</p>}

            <Button type="button" loading={adicionarCartao.isPending} onClick={handleAdicionarCartao} className="mt-4 w-full">
              Salvar cartão
            </Button>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading && [1, 2].map(item => <CardSkeleton key={item} />)}

        {!isLoading && cartoesView.map(item => {
          const color = usageColor(item.percentual)
          const comprasRecentes = item.compras.slice(0, 3)

          return (
            <motion.div key={item.cartao.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="overflow-hidden p-4">
                <div className="mb-4 rounded-3xl border border-white/[0.08] p-4" style={{ background: `linear-gradient(135deg, ${item.cartao.cor}22, rgba(255,255,255,0.03))` }}>
                  <div className="mb-8 flex items-start justify-between">
                    <div>
                      <p className="text-lg font-bold text-white">{item.cartao.nome}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/40">{item.cartao.bandeira}</p>
                    </div>
                    <Icon name={ICONS.finance.card} className="text-3xl" style={{ color: item.cartao.cor }} />
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-white/35">Fecha dia {item.cartao.dia_fechamento}</p>
                      <p className="text-xs text-white/35">Vence dia {item.cartao.dia_vencimento}</p>
                    </div>
                    <p className="text-sm font-semibold text-white">{formatCurrencyBRL(Number(item.cartao.limite_total))}</p>
                  </div>
                </div>

                <div className="mb-4 flex items-center gap-4">
                  <LimitRing percentual={item.percentual} color={color} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{usageLabel(item.percentual)}</p>
                    <p className="mt-1 text-xs text-white/40">Fatura atual: {formatCurrencyBRL(item.usado)}</p>
                    <p className="text-xs text-white/40">Disponível: {formatCurrencyBRL(item.disponivel)}</p>
                    {item.percentual >= 90 && <p className="mt-2 text-xs text-red-300">Uso acima de 90% do limite. Risco de sufoco na próxima fatura.</p>}
                    {item.percentual >= 60 && item.percentual < 90 && <p className="mt-2 text-xs text-amber-300">Uso elevado. Vale revisar parcelamentos ativos.</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Parcelamentos</p>
                    <p className="mt-1 text-lg font-bold text-white">{item.parcelamentos.length}</p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
                    <p className="text-xs text-white/40">Compras na fatura</p>
                    <p className="mt-1 text-lg font-bold text-white">{item.compras.length}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-white/50">Últimas compras</p>
                  {comprasRecentes.length > 0 ? (
                    <div className="space-y-2">
                      {comprasRecentes.map(compra => (
                        <div key={compra.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/80">{compra.descricao}</p>
                            <p className="text-xs text-white/30">{compra.parcelas_total > 1 ? `${compra.parcela_atual}/${compra.parcelas_total}` : 'à vista'}</p>
                          </div>
                          <p className="text-sm font-semibold text-white">{formatCurrencyBRL(Number(compra.valor_total))}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl bg-white/[0.03] px-3 py-3 text-sm text-white/35">Nenhuma compra nessa fatura ainda.</p>
                  )}
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {!isLoading && cartoesView.length === 0 && (
        <Card className="p-8 text-center">
          <Icon name={ICONS.empty.noCards} className="text-4xl text-white/20" />
          <p className="mt-3 font-semibold text-white">Cadastre seu primeiro cartão</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-white/40">
            Cartão não é só despesa: aqui ele vira fatura, limite, previsão e risco de endividamento.
          </p>
          <Button type="button" onClick={() => setShowForm(true)} className="mx-auto mt-4">
            Começar
          </Button>
        </Card>
      )}
    </div>
  )
}

