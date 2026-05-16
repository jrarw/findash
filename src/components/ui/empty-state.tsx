import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'

interface EmptyDataStateProps {
  icon?: string
  title: string
  description: string
  className?: string
  compact?: boolean
}

export function EmptyDataState({
  icon = ICONS.empty.noData,
  title,
  description,
  className,
  compact = false,
}: EmptyDataStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center',
      compact ? 'px-4 py-5' : 'px-5 py-8',
      className
    )}>
      <Icon name={icon} className={cn(compact ? 'text-2xl' : 'text-3xl', 'mb-3 text-white/20')} />
      <p className="text-sm font-medium text-white/60">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-white/35">{description}</p>
    </div>
  )
}

export function ChartEmptyOverlay({
  title,
  description,
}: Pick<EmptyDataStateProps, 'title' | 'description'>) {
  return (
    <div className="pointer-events-none absolute inset-x-3 top-14 bottom-3 flex items-center justify-center rounded-2xl bg-[#06060c]/45 backdrop-blur-[2px]">
      <EmptyDataState
        compact
        icon={ICONS.empty.noChart}
        title={title}
        description={description}
        className="border-white/[0.06] bg-black/20"
      />
    </div>
  )
}

