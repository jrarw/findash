import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Icon } from '@/components/ui/icon'
import { ICONS, type IconClass } from '@/lib/iconography'

async function AdminNav() {
  const NAV: Array<{ href: string; icon: IconClass; label: string; exact?: boolean }> = [
    { href: '/admin', icon: ICONS.admin.dashboard, label: 'Dashboard', exact: true },
    { href: '/admin/usuarios', icon: ICONS.admin.users, label: 'Usuários' },
    { href: '/admin/base', icon: ICONS.admin.base, label: 'Visão da Base' },
    { href: '/admin/config', icon: ICONS.admin.settings, label: 'Configurações' },
  ]

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-56 bg-[#08080f] border-r border-white/[0.06] flex flex-col">
      <div className="px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <span className="text-white font-bold text-xs">F</span>
          </div>
          <div>
            <span className="font-bold text-white text-sm">FinDash</span>
            <span className="ml-1.5 text-[10px] text-white/30 bg-white/[0.06] px-1.5 py-0.5 rounded-full">Admin</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <Icon name={item.icon} className="text-base" />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/30 hover:text-white/50 transition-colors"
        >
          <Icon name={ICONS.action.back} className="text-sm" />
          Voltar ao app
        </Link>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex">
      <AdminNav />
      <main className="flex-1 ml-56 p-6">{children}</main>
    </div>
  )
}
