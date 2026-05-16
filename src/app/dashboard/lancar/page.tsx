'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCategorias, useContas, useUsuario } from '@/hooks/useFinancas'
import { useAdicionarTransacao } from '@/hooks/useTransacoes'
import { cn } from '@/lib/cn'
import type { TransacaoTipo, Categoria, Conta } from '@/types/database'

export default function LancarPage() {
  const router = useRouter()
  const { data: usuario } = useUsuario()
  const { data: categorias } = useCategorias()
  const { data: contas } = useContas()
  const adicionar = useAdicionarTransacao()

  const [tipo, setTipo] = useState<TransacaoTipo>('saida')
  const [valor, setValor] = useState('')
  const [descricao, setDescricao] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [categoriaId, setCategoriaId] = useState('')
  const [contaId, setContaId] = useState('')
  const [efetivado, setEfetivado] = useState(true)
  const [recorrente, setRecorrente] = useState(false)
  const [obs, setObs] = useState('')

  const catsFiltradas = categorias?.filter(c =>
    c.tipo === tipo || c.tipo === 'ambos'
  ) ?? []

  async function handleSubmit() {
    if (!valor || !descricao || !usuario) return

    await adicionar.mutateAsync({
      usuario_id: usuario.id,
      tipo,
      valor: parseFloat(valor.replace(',', '.')),
      descricao,
      data,
      categoria_id: categoriaId || null,
      conta_id: contaId || null,
      efetivado,
      recorrente,
      observacoes: obs || null,
      data_competencia: null,
      recorrencia_id: null,
      recorrencia_tipo: null,
      tags: null,
    })

    router.push('/dashboard/extrato')
  }

  const inputClass = "min-h-[52px] w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface)] px-4 py-3 text-[var(--text-primary)] placeholder:text-[var(--text-subtle)] focus:border-[var(--cyan)] focus:outline-none focus:ring-4 focus:ring-cyan-500/10 transition-all"

  return (
    <div className="app-page max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Lançar Transação</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Registrar nova entrada ou saída</p>
      </div>

      <Card className="space-y-5 p-4 md:p-5">
        {/* Tipo */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Tipo</label>
          <div className="flex gap-2 rounded-2xl bg-[var(--surface-soft)] p-1">
            {(['saida', 'entrada'] as TransacaoTipo[]).map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className={cn(
                  'min-h-[52px] flex-1 rounded-xl px-3 text-sm font-bold transition-all active:scale-[0.98]',
                  tipo === t
                    ? t === 'entrada'
                      ? 'bg-green-500/15 text-green-600'
                      : 'bg-red-500/12 text-red-600'
                    : 'text-[var(--text-muted)]'
                )}
              >
                {t === 'entrada' ? '↓ Entrada' : '↑ Saída'}
              </button>
            ))}
          </div>
        </div>

        {/* Valor */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Valor</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-[var(--text-muted)]">R$</span>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={e => setValor(e.target.value)}
              placeholder="0,00"
              className={cn(inputClass, 'pl-11 text-[32px] font-black tracking-tight')}
              style={{ fontSize: '32px' }}
            />
          </div>
        </div>

        {/* Descrição */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Ex: Almoço, Salário, Aluguel..."
            className={inputClass}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Data */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className={inputClass}
            style={{ fontSize: '16px' }}
          />
        </div>

        {/* Categoria */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Categoria</label>
          <select
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className={inputClass}
            style={{ fontSize: '16px' }}
          >
            <option value="">Sem categoria</option>
            {catsFiltradas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Conta */}
        {contas && contas.length > 0 && (
          <div>
            <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Conta</label>
            <select
              value={contaId}
              onChange={e => setContaId(e.target.value)}
              className={inputClass}
              style={{ fontSize: '16px' }}
            >
              <option value="">Selecionar conta</option>
              {contas.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        )}

        {/* Toggles */}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3">
            <button
              onClick={() => setEfetivado(!efetivado)}
              className={cn(
                'relative h-8 w-12 rounded-full transition-all',
                efetivado ? 'bg-[#00E5FF]' : 'bg-white/10'
              )}
            >
              <span className={cn(
                'absolute top-1 h-6 w-6 rounded-full bg-white transition-all',
                efetivado ? 'left-5' : 'left-1'
              )} />
            </button>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Efetivado</span>
          </label>

          <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--surface-soft)] px-3">
            <button
              onClick={() => setRecorrente(!recorrente)}
              className={cn(
                'relative h-8 w-12 rounded-full transition-all',
                recorrente ? 'bg-[#A855F7]' : 'bg-white/10'
              )}
            >
              <span className={cn(
                'absolute top-1 h-6 w-6 rounded-full bg-white transition-all',
                recorrente ? 'left-5' : 'left-1'
              )} />
            </button>
            <span className="text-sm font-semibold text-[var(--text-secondary)]">Recorrente</span>
          </label>
        </div>

        {/* Observações */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-[var(--text-muted)]">Observações (opcional)</label>
          <textarea
            value={obs}
            onChange={e => setObs(e.target.value)}
            rows={2}
            placeholder="Detalhes adicionais..."
            className={cn(inputClass, 'resize-none')}
            style={{ fontSize: '16px' }}
          />
        </div>

        <div className="sticky bottom-[calc(84px+env(safe-area-inset-bottom))] -mx-1 rounded-2xl bg-[var(--surface-glass)] p-1 backdrop-blur-xl lg:static lg:bg-transparent lg:p-0">
          <Button
            onClick={handleSubmit}
            loading={adicionar.isPending}
            disabled={!valor || !descricao}
            className="w-full"
            size="lg"
          >
            Lançar {tipo === 'entrada' ? 'Entrada' : 'Saída'}
          </Button>
        </div>
      </Card>
    </div>
  )
}
