'use client'

import { useState, useEffect, useLayoutEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/cn'
import { Icon } from '@/components/ui/icon'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ICONS, type IconClass } from '@/lib/iconography'
import { useUsuario } from '@/hooks/useFinancas'
import { createClient } from '@/lib/supabase/client'
import { preventZoom } from '@/lib/pwa/prevent-zoom'
import { registerServiceWorker } from '@/lib/pwa/register-sw'

interface NavItem {
  href: string
  icon: IconClass
  label: string
  exact?: boolean
}

interface NavSection {
  section: string
  items: NavItem[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', icon: ICONS.nav.home, label: 'Home', exact: true },
  { href: '/dashboard/extrato', icon: ICONS.nav.statement, label: 'Extrato' },
  { href: '/dashboard/lancar', icon: ICONS.action.add, label: 'Lançar' },
  { href: '/dashboard/health', icon: ICONS.nav.health, label: 'Saúde' },
  { href: '/dashboard/market', icon: ICONS.category.groceries, label: 'Market' },
]

const SIDEBAR_ITEMS: NavSection[] = [
  {
    section: '',
    items: [
      { href: '/dashboard', icon: ICONS.nav.home, label: 'Home', exact: true },
      { href: '/dashboard/extrato', icon: ICONS.nav.statement, label: 'Extrato' },
      { href: '/dashboard/contas', icon: ICONS.nav.bills, label: 'Contas' },
      { href: '/dashboard/cartoes', icon: ICONS.nav.cards, label: 'Cartões' },
    ]
  },
  {
    section: 'INTELIGÊNCIA',
    items: [
      { href: '/dashboard/health', icon: ICONS.nav.health, label: 'Fin Health' },
      { href: '/dashboard/market', icon: ICONS.category.groceries, label: 'Fin Market' },
    ]
  },
  {
    section: 'PLANEJAMENTO',
    items: [
      { href: '/dashboard/planejamento', icon: ICONS.nav.goals, label: 'Metas & Orçamento' },
    ]
  },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  if (href === '/dashboard/planejamento') {
    return pathname.startsWith('/dashboard/planejamento')
      || pathname.startsWith('/dashboard/metas')
      || pathname.startsWith('/dashboard/orcamento')
      || pathname.startsWith('/dashboard/categorias')
  }
  return pathname.startsWith(href)
}

function SidebarLink({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const active = isActive(pathname, item.href, item.exact)

  return (
    <Link
      href={item.href}
      className={cn(
        'group relative mb-px flex min-h-9 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-medium leading-none transition-all duration-150',
        active
          ? 'bg-[rgba(0,120,255,0.07)] text-[rgba(0,0,0,0.88)]'
          : 'text-[rgba(0,0,0,0.42)] hover:bg-[rgba(0,0,0,0.04)] hover:text-[rgba(0,0,0,0.70)]',
      )}
    >
      <span
        className={cn(
          'absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--cyan)] transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <Icon
        name={item.icon}
        className={cn(
          'text-[17px] leading-none transition-colors',
          active ? 'text-[var(--cyan)]' : 'text-[rgba(0,0,0,0.28)] group-hover:text-[rgba(0,0,0,0.44)]',
        )}
      />
      <span>{item.label}</span>
    </Link>
  )
}

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { data: usuario } = useUsuario()
  const supabase = createClient()

  useLayoutEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  }, [pathname])

  useEffect(() => {
    preventZoom()
    registerServiceWorker()
  }, [])

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="flex min-h-[100dvh]">
      {/* Desktop Sidebar */}
      <aside className="fixed bottom-0 left-0 top-0 z-30 hidden w-[216px] flex-col border-r border-[rgba(0,0,0,0.05)] bg-[rgba(249,249,251,0.9)] backdrop-blur-2xl xl:flex">
        {/* Logo */}
        <div className="px-3 py-4">
          <div className="flex min-w-0 items-center gap-2.5 rounded-2xl px-1">
            <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 text-[11px] font-bold text-white">
              {usuario?.nome?.[0]?.toUpperCase() ?? 'F'}
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-[rgba(0,0,0,0.88)]">Fin</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {SIDEBAR_ITEMS.map(section => (
            <div key={section.section || 'primary'} className="mb-6">
              {section.section && (
                <p className="mb-2 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[rgba(0,0,0,0.22)]">
                  {section.section}
                </p>
              )}
              {section.items.map(item => <SidebarLink key={item.href} item={item} />)}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-[rgba(0,0,0,0.06)] px-3 py-3">
          <Link
            href="/dashboard/config"
            className={cn(
              'flex min-h-10 items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13.5px] font-medium text-[rgba(0,0,0,0.42)] opacity-70 transition-all hover:bg-[rgba(0,0,0,0.04)] hover:opacity-100',
              pathname.startsWith('/dashboard/config') && 'bg-[rgba(0,120,255,0.07)] text-[rgba(0,0,0,0.88)] opacity-100',
            )}
          >
            <Icon name={ICONS.nav.settings} className={cn('text-[17px]', pathname.startsWith('/dashboard/config') ? 'text-[var(--cyan)]' : 'text-[rgba(0,0,0,0.28)]')} />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Mobile/tablet sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-[var(--bg-overlay)] backdrop-blur-md xl:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 top-0 z-50 flex w-72 flex-col border-r border-[var(--card-border)] bg-[var(--surface-glass)] shadow-[16px_0_45px_rgba(15,23,42,0.10)] backdrop-blur-2xl xl:hidden"
            >
              <div className="px-6 pt-12 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">F</span>
                  </div>
                  <span className="font-bold text-[var(--text-primary)] text-lg">FinDash</span>
                </div>
              </div>

              <nav className="flex-1 px-3 overflow-y-auto">
                {SIDEBAR_ITEMS.map(section => (
                  <div key={section.section} className="mb-6">
                    <p className="px-3 mb-2 text-xs font-semibold text-[var(--text-subtle)] uppercase tracking-wider">
                      {section.section}
                    </p>
                    {section.items.map(item => {
                      const active = isActive(pathname, item.href, item.exact)
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-3 px-3 py-3 rounded-2xl mb-0.5 transition-all text-sm',
                            active
                              ? 'bg-[var(--cyan-muted)] text-[var(--text-primary)] font-semibold'
                              : 'text-[var(--text-muted)]'
                          )}
                        >
                          <Icon name={item.icon} className={cn('text-lg', active && 'text-[#00E5FF]')} />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                ))}
              </nav>

              <div className="px-3 pb-8">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] text-sm"
                >
                  <Icon name={ICONS.action.logout} className="text-lg" />
                  Sair
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex h-[100dvh] min-w-0 flex-1 flex-col overflow-hidden xl:ml-[216px]">
        {/* Mobile/tablet Header */}
        <header
          className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[var(--card-border)] bg-[var(--surface-glass)] px-4 backdrop-blur-2xl supports-[backdrop-filter]:bg-[var(--surface-glass)] xl:hidden"
          style={{
            height: 'calc(56px + var(--sat))',
            paddingTop: 'max(0px, var(--sat))',
            paddingLeft: 'max(16px, var(--sal))',
            paddingRight: 'max(16px, var(--sar))',
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-2xl text-[var(--text-muted)] transition-all active:scale-95 active:bg-[var(--surface-hover)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]"
          >
            <Icon name={ICONS.action.menu} className="text-xl" />
          </button>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">F</span>
            </div>
            <span className="font-bold text-[var(--text-primary)] text-base">FinDash</span>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Link href="/dashboard/perfil" className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 text-sm font-bold text-white shadow-[0_10px_24px_rgba(6,182,212,0.16)]">
              {usuario?.nome?.[0]?.toUpperCase() ?? 'U'}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(80px+var(--sab))] [-webkit-overflow-scrolling:touch] lg:pb-6"
        >
          {children}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <Link
        href="/dashboard/lancar"
        title="Lançar transação"
        className="fixed right-6 z-[var(--z-mobile-nav)] hidden h-[52px] w-[52px] items-center justify-center rounded-2xl bg-[var(--cyan)] text-white shadow-[0_4px_20px_rgba(6,182,212,0.40)] transition-all hover:scale-105 hover:shadow-[0_8px_28px_rgba(6,182,212,0.48)] xl:flex"
        style={{ bottom: '24px' }}
      >
        <Icon name={ICONS.action.add} className="text-[22px]" />
      </Link>

      <nav
        className="fixed bottom-0 left-0 right-0 z-[var(--z-mobile-nav)] px-2 lg:hidden"
        style={{
          paddingBottom: 'max(12px, var(--sab))',
          paddingLeft: 'max(8px, var(--sal))',
          paddingRight: 'max(8px, var(--sar))',
        }}
      >
        <div className="mx-auto flex h-16 max-w-md items-center justify-around rounded-t-[18px] border border-[rgba(0,0,0,0.06)] bg-white/85 px-2 shadow-[0_14px_35px_rgba(15,23,42,0.14)] backdrop-blur-xl">
          {NAV_ITEMS.map(item => {
            const active = isActive(pathname, item.href, item.exact)
            const isCenter = item.href === '/dashboard/lancar'

            if (isCenter) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label="Lançar transação"
                  className="flex h-[52px] w-[52px] -translate-y-4 items-center justify-center rounded-2xl bg-[var(--cyan)] shadow-[0_16px_30px_rgba(6,182,212,0.30)] transition-transform active:scale-95"
                >
                  <Icon name={ICONS.action.add} className="text-xl text-white font-bold" />
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                className={cn(
                  'flex min-h-[48px] min-w-[54px] flex-col items-center justify-center gap-0.5 rounded-2xl px-2 py-1.5 transition-all active:scale-95',
                  active ? 'bg-cyan-500/10 text-[var(--cyan)]' : 'text-[rgba(0,0,0,0.35)]'
                )}
              >
                <Icon name={item.icon} className={cn('text-[22px]', !active && 'opacity-35')} />
                {active && <span className="text-[10px] font-semibold">{item.label}</span>}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
