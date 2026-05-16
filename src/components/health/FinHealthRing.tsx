'use client'

import { useId } from 'react'
import { motion } from 'framer-motion'

interface FinHealthRingProps {
  score: number
  size?: number
  strokeWidth?: number
  showLabel?: boolean
}

const GRADIENT_STOPS = [
  { pos: 0, color: [239, 68, 68] },
  { pos: 20, color: [239, 68, 68] },
  { pos: 40, color: [249, 115, 22] },
  { pos: 60, color: [234, 179, 8] },
  { pos: 80, color: [34, 197, 94] },
  { pos: 95, color: [0, 229, 255] },
  { pos: 100, color: [0, 229, 255] },
]

function lerpColor(a: number[], b: number[], t: number): number[] {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

function getColorAt(score: number): number[] {
  const clamped = Math.min(100, Math.max(0, score))

  for (let i = 0; i < GRADIENT_STOPS.length - 1; i++) {
    const start = GRADIENT_STOPS[i]
    const end = GRADIENT_STOPS[i + 1]

    if (clamped >= start.pos && clamped <= end.pos) {
      const t = (clamped - start.pos) / (end.pos - start.pos)
      return lerpColor(start.color, end.color, t)
    }
  }

  return GRADIENT_STOPS[GRADIENT_STOPS.length - 1].color
}

function rgb(color: number[]): string {
  return `rgb(${color[0]}, ${color[1]}, ${color[2]})`
}

export function FinHealthRing({
  score,
  size = 160,
  strokeWidth = 10,
  showLabel = true,
}: FinHealthRingProps) {
  const radius = (size - strokeWidth) / 2
  const progress = Math.min(100, Math.max(0, score))
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const filled = (progress / 100) * circumference
  const uid = useId().replace(/:/g, '')
  const glowId = `${uid}_fin_health_glow`
  const segmentCount = Math.max(1, Math.ceil(progress * 1.4))
  const segmentArc = filled / segmentCount
  const segmentOverlap = Math.min(strokeWidth * 0.14, circumference * 0.002)

  const scoreColor = rgb(getColorAt(progress))
  const scoreLabel = score >= 85 ? 'Excelente' : score >= 70 ? 'Forte' : score >= 50 ? 'Regular' : score >= 30 ? 'Atenção' : 'Crítico'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <defs>
          <filter id={glowId} x="-45%" y="-45%" width="190%" height="190%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation={Math.max(2.5, strokeWidth * 0.5)} result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <motion.g
          filter={`url(#${glowId})`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
          style={{ transformOrigin: 'center' }}
        >
          {Array.from({ length: segmentCount }, (_, index) => {
            const start = index * segmentArc
            const isLast = index === segmentCount - 1
            const scoreAtSegment = ((index + 1) / segmentCount) * progress
            const segmentLength = Math.min(segmentArc + segmentOverlap, filled - start)

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={rgb(getColorAt(scoreAtSegment))}
                strokeWidth={strokeWidth}
                strokeLinecap={index === 0 || isLast ? 'round' : 'butt'}
                strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                strokeDashoffset={-start}
                transform={`rotate(-90 ${center} ${center})`}
              />
            )
          })}
        </motion.g>
      </motion.svg>

      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-3xl font-bold text-white"
            style={{ color: scoreColor }}
          >
            {Math.round(progress)}
          </motion.span>
          <span className="text-xs text-white/40 mt-0.5">{scoreLabel}</span>
        </div>
      )}
    </div>
  )
}
