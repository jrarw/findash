'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { useUsuario } from '@/hooks/useFinancas'
import { useConcluirOnboarding } from '@/hooks/useOnboarding'
import { formatCurrencyPreviewBRL, parseCurrencyBRLInput } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ICONS, type IconClass } from '@/lib/iconography'
import type { ContaTipo, ObjetivoFinanceiro } from '@/types/database'

const objetivos: { value: ObjetivoFinanceiro; label: string; description: string; icon: IconClass }[] = [
  {
    value: 'economizar',
    label: 'Economizar mais',
    description: 'Criar folga no mês e guardar dinheiro com constância.',
    icon: ICONS.finance.savings,
  },
  {
    value: 'sair_dividas',
    label: 'Sair das dívidas',
    description: 'Organizar prioridades e acompanhar compromissos.',
    icon: ICONS.empty.noTransactions,
  },
  {
    value: 'organizar',
    label: 'Organizar minhas finanças',
    description: 'Entender entradas, saídas e hábitos de consumo.',
    icon: ICONS.finance.transaction,
  },
]

const tiposConta: { value: ContaTipo; label: string; icon: IconClass }[] = [
  { value: 'corrente', label: 'Conta corrente', icon: ICONS.finance.account },
  { value: 'poupanca', label: 'Poupança', icon: ICONS.finance.savings },
  { value: 'carteira', label: 'Carteira', icon: ICONS.finance.wallet },
  { value: 'investimento', label: 'Investimento', icon: ICONS.finance.investment },
  { value: 'outro', label: 'Outro', icon: ICONS.action.more },
]

const inputClass = 'w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-white placeholder-white/25 transition-all focus:border-[#00E5FF]/50 focus:outline-none'

function OnboardingSkeleton() {
  return (
    <div className="min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-md space-y-4">
        <div className="h-8 w-40 rounded-lg skeleton" />
        <Card className="space-y-4 p-5">
          <div className="h-5 w-28 rounded-lg skeleton" />
          <div className="h-12 rounded-xl skeleton" />
          <div className="h-20 rounded-xl skeleton" />
          <div className="h-12 rounded-xl skeleton" />
        </Card>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { data: usuario, isLoading } = useUsuario()
  const concluirOnboarding = useConcluirOnboarding()
  const [step, setStep] = useState(1)
  const [erro, setErro] = useState('')
  const [nome, setNome] = useState('')
  const [objetivo, setObjetivo] = useState<ObjetivoFinanceiro>('organizar')
  const [contaNome, setContaNome] = useState('Conta principal')
  const [contaTipo, setContaTipo] = useState<ContaTipo>('corrente')
  const [saldoInicial, setSaldoInicial] = useState('')
  const [rendaMensal, setRendaMensal] = useState('')
  const [metaTitulo, setMetaTitulo] = useState('Reserva de emergência')
  const [metaValor, setMetaValor] = useState('')

  const nomeAtual = nome || usuario?.nome || ''
  const saldoNumero = parseCurrencyBRLInput(saldoInicial)
  const rendaNumero = parseCurrencyBRLInput(rendaMensal)
  const metaNumero = parseCurrencyBRLInput(metaValor)

  const stepTitle = useMemo(() => {
    if (step === 1) return 'Vamos personalizar sua experiência'
    if (step === 2) return 'Cadastre sua primeira conta'
    return 'Defina renda e primeira meta'
  }, [step])

  if (isLoading) return <OnboardingSkeleton />

  function validarEtapaAtual() {
    if (step === 1 && !nomeAtual.trim()) return 'Informe seu nome para continuar.'
    if (step === 2 && !contaNome.trim()) return 'Informe o nome da sua primeira conta.'
    if (step === 2 && (!Number.isFinite(saldoNumero) || saldoNumero < 0)) return 'Informe um saldo inicial válido.'
    if (step === 3 && (!Number.isFinite(rendaNumero) || rendaNumero <= 0)) return 'Informe uma renda mensal estimada maior que zero.'
    if (step === 3 && !metaTitulo.trim()) return 'Dê um nome para sua meta inicial.'
    if (step === 3 && (!Number.isFinite(metaNumero) || metaNumero <= 0)) return 'Informe um valor de meta maior que zero.'
    return ''
  }

  function avancar() {
    const mensagem = validarEtapaAtual()
    if (mensagem) {
      setErro(mensagem)
      return
    }

    setErro('')
    setStep(current => Math.min(current + 1, 3))
  }

  async function finalizar() {
    const mensagem = validarEtapaAtual()
    if (mensagem) {
      setErro(mensagem)
      return
    }

    setErro('')

    try {
      await concluirOnboarding.mutateAsync({
        nome: nomeAtual,
        objetivo,
        conta: {
          nome: contaNome,
          tipo: contaTipo,
          saldoInicial: saldoNumero,
        },
        rendaMensalEstimada: rendaNumero,
        meta: {
          titulo: metaTitulo,
          valorAlvo: metaNumero,
        },
      })
      router.push('/dashboard')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível concluir o onboarding. Tente novamente.')
    }
  }

  return (
    <div className="min-h-dvh px-4 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5 md:max-w-2xl">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-4"
        >
          <div className="mb-5 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#A855F7]">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-bold text-white">FinDash</span>
          </div>
          <p className="text-sm text-white/40">Etapa {step} de 3</p>
          <h1 className="mt-1 text-2xl font-bold text-white">{stepTitle}</h1>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[1, 2, 3].map(item => (
              <div
                key={item}
                className={cn(
                  'h-1.5 rounded-full transition-all',
                  item <= step ? 'bg-[#00E5FF]' : 'bg-white/[0.08]'
                )}
              />
            ))}
          </div>
        </motion.header>

        <Card className="overflow-hidden p-5">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs text-white/40">Como podemos te chamar?</label>
                  <input
                    value={nome || usuario?.nome || ''}
                    onChange={event => setNome(event.target.value)}
                    className={inputClass}
                    placeholder="Seu nome"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-white/70">Qual seu principal objetivo?</p>
                  {objetivos.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setObjetivo(item.value)}
                      className={cn(
                        'w-full rounded-2xl border p-4 text-left transition-all',
                        objetivo === item.value
                          ? 'border-[#00E5FF]/50 bg-[#00E5FF]/10'
                          : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
                      )}
                    >
                      <div className="flex gap-3">
                        <Icon name={item.icon} className="mt-0.5 text-xl text-[#00E5FF]" />
                        <div>
                          <p className="font-medium text-white">{item.label}</p>
                          <p className="mt-1 text-sm text-white/40">{item.description}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs text-white/40">Nome da conta</label>
                  <input
                    value={contaNome}
                    onChange={event => setContaNome(event.target.value)}
                    className={inputClass}
                    placeholder="Ex: Nubank, Itaú, Carteira"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/40">Tipo de conta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposConta.map(item => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setContaTipo(item.value)}
                        className={cn(
                          'rounded-xl border px-3 py-3 text-left text-sm transition-all',
                          contaTipo === item.value
                            ? 'border-[#A855F7]/60 bg-[#A855F7]/10 text-white'
                            : 'border-white/[0.08] bg-white/[0.03] text-white/60'
                        )}
                      >
                        <Icon name={item.icon} className="mb-1 block text-lg" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/40">Saldo inicial</label>
                  <input
                    value={saldoInicial}
                    onChange={event => setSaldoInicial(event.target.value)}
                    className={inputClass}
                    inputMode="decimal"
                    type="text"
                    placeholder="0,00"
                    style={{ fontSize: '16px' }}
                  />
                  <p className="mt-2 text-xs text-white/35">
                    Vamos começar com {formatCurrencyPreviewBRL(saldoNumero)} nessa conta.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div>
                  <label className="mb-2 block text-xs text-white/40">Renda mensal estimada</label>
                  <input
                    value={rendaMensal}
                    onChange={event => setRendaMensal(event.target.value)}
                    className={inputClass}
                    inputMode="decimal"
                    type="text"
                    placeholder="Ex: 5.000,00"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/40">Meta inicial</label>
                  <input
                    value={metaTitulo}
                    onChange={event => setMetaTitulo(event.target.value)}
                    className={inputClass}
                    placeholder="Ex: Reserva de emergência"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs text-white/40">Valor da meta</label>
                  <input
                    value={metaValor}
                    onChange={event => setMetaValor(event.target.value)}
                    className={inputClass}
                    inputMode="decimal"
                    type="text"
                    placeholder="Ex: 10.000,00"
                    style={{ fontSize: '16px' }}
                  />
                </div>

                <div className="rounded-2xl border border-[#00E5FF]/20 bg-[#00E5FF]/5 p-4">
                  <p className="text-sm font-medium text-white">Resumo inicial</p>
                  <p className="mt-1 text-xs text-white/45">
                    Renda de {formatCurrencyPreviewBRL(rendaNumero)} e meta de {formatCurrencyPreviewBRL(metaNumero)}.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {erro && (
            <p className="mt-5 flex items-center gap-2 text-sm text-red-400">
              <Icon name={ICONS.status.danger} className="text-base" />
              {erro}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            {step > 1 && (
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setErro('')
                  setStep(current => Math.max(current - 1, 1))
                }}
              >
                Voltar
              </Button>
            )}
            <Button
              type="button"
              className="flex-1"
              size="lg"
              loading={concluirOnboarding.isPending}
              onClick={step === 3 ? finalizar : avancar}
            >
              {step === 3 ? 'Concluir' : 'Continuar'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}

