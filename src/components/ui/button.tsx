import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'flex min-w-[var(--tap-target)] items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-control)] font-semibold tracking-[-0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.985]',
        variant === 'primary' && 'arw-on-accent bg-[var(--cyan)] text-white shadow-[0_10px_24px_rgba(6,182,212,0.18)] hover:bg-[#0891b2] hover:shadow-[0_14px_32px_rgba(6,182,212,0.24)] active:scale-[0.985]',
        variant === 'secondary' && 'border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-primary)] shadow-[0_8px_24px_rgba(15,23,42,0.045)] hover:bg-[var(--surface-soft)] hover:border-[rgba(6,182,212,0.22)]',
        variant === 'ghost' && 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
        variant === 'danger' && 'border border-red-500/15 bg-red-500/[0.07] text-red-600 hover:bg-red-500/[0.11]',
        size === 'sm' && 'min-h-9 min-w-20 px-3 py-1.5 text-sm',
        size === 'md' && 'min-h-[var(--tap-target)] px-4 py-2.5 text-sm',
        size === 'lg' && 'min-h-[52px] px-6 py-3 text-base',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Icon name={ICONS.status.loading} className="animate-spin text-sm" />}
      {children}
    </button>
  )
}
