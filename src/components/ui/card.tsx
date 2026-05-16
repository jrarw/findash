import { cn } from '@/lib/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  glow?: 'cyan' | 'purple' | 'none'
}

export function Card({ children, className, glow = 'none', ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-[var(--card-border)] bg-[var(--card-bg)] shadow-[var(--card-shadow)] backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] duration-200',
        glow === 'cyan' && 'shadow-[0_18px_45px_rgba(6,182,212,0.11)]',
        glow === 'purple' && 'shadow-[0_18px_45px_rgba(139,92,246,0.10)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
