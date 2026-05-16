import { cn } from '@/lib/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'cyan' | 'purple'
}

export function Badge({ children, className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-[-0.01em]',
        variant === 'default' && 'border-[var(--card-border)] bg-[var(--surface-soft)] text-[var(--text-muted)]',
        variant === 'success' && 'border-green-500/15 bg-green-500/10 text-green-600',
        variant === 'warning' && 'border-amber-500/15 bg-amber-500/10 text-amber-600',
        variant === 'danger' && 'border-red-500/15 bg-red-500/10 text-red-600',
        variant === 'cyan' && 'border-cyan-500/15 bg-cyan-500/10 text-[var(--text-primary)]',
        variant === 'purple' && 'border-violet-500/15 bg-violet-500/10 text-[var(--text-primary)]',
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
