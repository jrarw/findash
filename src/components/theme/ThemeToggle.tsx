'use client'

import { useEffect, useState } from 'react'
import { Icon } from '@/components/ui/icon'
import { ICONS } from '@/lib/iconography'
import { cn } from '@/lib/cn'

type Theme = 'light' | 'dark'

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
  localStorage.setItem('findash.theme', theme)
}

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('findash.theme') as Theme | null
    const initial = stored === 'dark' || stored === 'light' ? stored : 'light'
    setTheme(initial)
    applyTheme(initial)
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--surface)] text-[var(--text-muted)] shadow-[0_10px_24px_rgba(15,23,42,0.045)] transition-all hover:-translate-y-0.5 hover:text-[var(--text-primary)] hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]',
        className,
      )}
      aria-label={theme === 'light' ? 'Ativar dark mode' : 'Ativar light mode'}
      title={theme === 'light' ? 'Dark mode' : 'Light mode'}
    >
      <Icon name={theme === 'light' ? ICONS.status.moon : ICONS.status.sun} className="text-xl" />
    </button>
  )
}
