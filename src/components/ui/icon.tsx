import { cn } from '@/lib/cn'
import type { IconClass } from '@/lib/iconography'
import type { CSSProperties } from 'react'

interface IconProps {
  name: IconClass | string
  className?: string
  style?: CSSProperties
  'aria-hidden'?: boolean
}

export function Icon({ name, className, style, 'aria-hidden': ariaHidden = true }: IconProps) {
  return (
    <i
      aria-hidden={ariaHidden}
      className={cn('ti inline-flex shrink-0 leading-none', name, className)}
      style={style}
    />
  )
}
