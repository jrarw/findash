'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { analisarQuery } from '@/lib/ai/smart/analisador-smart'
import type { FinSmartResposta } from '@/lib/ai/smart/analisador-smart'
import { SUGESTOES_INICIAIS } from '@/lib/ai/smart/intent-engine'
import { formatCurrencyBRL } from '@/lib/format'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'

export function FinSmartInput() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [resposta, setResposta] = useState<FinSmartResposta | null>(null)
  const supabase = createClient()

  async function handleSubmit(q: string) {
    if (!q.trim()) return
    setLoading(true)
    setResposta(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const result = await analisarQuery(q, supabase, user.id)
      setResposta(result)
      setQuery('')
    } catch (err) {
      console.error('FinSmart error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Badge fin.smart */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-cyan-500/15 bg-cyan-500/10">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#A855F7] animate-pulse" />
          <span className="text-xs font-semibold text-[var(--text-primary)] tracking-wider">fin.smart</span>
        </div>
        <span className="text-xs text-white/30">IA em linguagem natural</span>
      </div>

      {/* Input */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit(query)}
          placeholder="Pergunte sobre suas finanças..."
          className="min-h-[52px] w-full bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-3.5 pr-12 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#00E5FF]/40 focus:bg-white/[0.06] transition-all"
          style={{ fontSize: '16px' }}
        />
        <button
          onClick={() => handleSubmit(query)}
          disabled={loading || !query.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#00E5FF] to-[#A855F7] disabled:opacity-30 transition-opacity"
        >
          {loading
            ? <Icon name={ICONS.status.loading} className="animate-spin text-sm text-white" />
            : <Icon name={ICONS.action.send} className="text-sm text-white" />
          }
        </button>
      </div>

      {/* Sugestões iniciais */}
      {!resposta && (
        <div className="flex flex-wrap gap-2">
          {SUGESTOES_INICIAIS.map(s => (
            <button
              key={s}
              onClick={() => handleSubmit(s)}
              className="text-xs px-3 py-1.5 rounded-full border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Resposta */}
      <AnimatePresence>
        {resposta && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#00E5FF] to-[#A855F7]" />
              <span className="text-sm font-semibold text-white">{resposta.titulo}</span>
            </div>

            <p className="text-sm text-white/70 leading-relaxed">{resposta.resposta}</p>

            {resposta.metricas.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {resposta.metricas.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      'rounded-xl p-3 border',
                      m.destaque
                        ? 'bg-red-500/5 border-red-500/20'
                        : 'bg-white/[0.03] border-white/[0.06]'
                    )}
                  >
                    <p className="text-xs text-white/40">{m.label}</p>
                    <p className={cn('text-sm font-bold mt-0.5', m.destaque ? 'text-red-400' : 'text-white')}>
                      {m.valor}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {resposta.followUps.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {resposta.followUps.map(f => (
                  <button
                    key={f}
                    onClick={() => handleSubmit(f)}
                    className="text-xs px-3 py-1.5 rounded-full bg-[#00E5FF]/5 border border-[#00E5FF]/20 text-[#00E5FF] hover:bg-[#00E5FF]/10 transition-all"
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setResposta(null)}
              className="text-xs text-white/25 hover:text-white/50 transition-colors"
            >
              Fechar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
