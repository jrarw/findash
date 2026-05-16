'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import { useUsuario, useContas } from '@/hooks/useFinancas'
import { createClient } from '@/lib/supabase/client'
import { formatCurrencyBRL } from '@/lib/format'
import { cn } from '@/lib/cn'
import { ICONS } from '@/lib/iconography'

export default function ConfigPage() {
  const router = useRouter()
  const { data: usuario } = useUsuario()
  const { data: contas } = useContas()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="app-page max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">Configurações</h1>
      </div>

      {/* Perfil */}
      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Perfil</p>
        <Link href="/dashboard/perfil" className="block">
        <Card className="p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--card-shadow-hover)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-cyan-400 flex items-center justify-center text-white text-lg font-bold">
              {usuario?.nome?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="flex-1">
              <p className="font-medium text-[var(--text-primary)]">{usuario?.nome}</p>
              <p className="text-sm text-[var(--text-muted)]">{usuario?.email}</p>
              <span className="text-xs text-[#00E5FF]">Plano {usuario?.plano}</span>
            </div>
            <Icon name={ICONS.action.next} className="text-sm text-[var(--text-subtle)]" />
          </div>
        </Card>
        </Link>
      </section>

      {/* Contas */}
      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Contas bancárias</p>
        <div className="space-y-2">
          {contas?.map(c => (
            <Card key={c.id} className="flex min-h-[52px] items-center gap-3 p-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: `${c.cor}20` }}
              >
                <Icon name={c.icone} className="text-sm" style={{ color: c.cor }} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[var(--text-primary)]">{c.nome}</p>
                <p className="text-xs text-[var(--text-muted)]">{c.tipo} • {c.banco}</p>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">{formatCurrencyBRL(c.saldo_inicial)}</p>
            </Card>
          ))}
          <Button variant="secondary" size="sm" className="w-full">
            <Icon name={ICONS.action.add} className="text-sm" />
            Adicionar conta
          </Button>
        </div>
      </section>

      {/* Links */}
      <section className="mb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)]">Preferências</p>
        <Card>
          {[
            { href: '/dashboard/categorias', icon: ICONS.finance.category, label: 'Categorias personalizadas' },
            { href: '/dashboard/orcamento', icon: ICONS.finance.budget, label: 'Orçamento mensal' },
            { href: '/dashboard/notificacoes', icon: ICONS.status.notification, label: 'Notificações de vencimento' },
            { href: '/dashboard/importar', icon: ICONS.nav.import, label: 'Importar planilha financeira' },
          ].map((item, i, arr) => (
            <Link
              key={item.label}
              href={item.href}
              className={cn(
                'flex min-h-[52px] w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[var(--surface-hover)]',
                i < arr.length - 1 && 'border-b border-[var(--card-border)]'
              )}
            >
              <Icon name={item.icon} className="text-base text-[var(--text-muted)]" />
              <span className="flex-1 text-sm text-[var(--text-primary)]">{item.label}</span>
              <Icon name={ICONS.action.next} className="text-sm text-[var(--text-subtle)]" />
            </Link>
          ))}
        </Card>
      </section>

      {/* Logout */}
      <Button variant="danger" size="lg" onClick={handleLogout} className="w-full">
        <Icon name={ICONS.action.logout} className="text-sm" />
        Sair da conta
      </Button>
    </div>
  )
}
