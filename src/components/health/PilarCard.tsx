'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'

interface PilarCardProps {
  nome: string
  score: number
  peso: number
  descricao: string
  detalhe: string
  icon: string
}

export function PilarCard({ nome, score, peso, descricao, detalhe, icon }: PilarCardProps) {
  const [expanded, setExpanded] = useState(false)
  const color = score >= 80 ? '#22C55E' : score >= 60 ? '#00E5FF' : score >= 40 ? '#EAB308' : '#EF4444'

  return (
    <Card className="p-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}
        >
          <Icon name={icon} className="text-lg" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-white/90">{nome}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">peso {peso}%</span>
              <span className="text-sm font-bold" style={{ color }}>{Math.round(score)}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>

        <Icon name={ICONS.action.expand} className={cn('text-sm text-white/30 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <p className="text-sm text-white/60">{descricao}</p>
              <p className="text-xs text-white/40 mt-1">{detalhe}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
