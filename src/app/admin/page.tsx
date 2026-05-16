import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { ICONS, type IconClass } from '@/lib/iconography'

async function getAdminStats() {
  const supabase = await createClient()

  const [{ count: totalUsuarios }, { count: totalTransacoes }, { data: planos }] = await Promise.all([
    supabase.from('usuarios').select('*', { count: 'exact', head: true }),
    supabase.from('transacoes').select('*', { count: 'exact', head: true }),
    supabase.from('usuarios').select('plano'),
  ])

  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`
  const { count: novosEsteMes } = await supabase
    .from('usuarios')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', inicioMes)

  const contagem = { free: 0, pro: 0, premium: 0 }
  planos?.forEach(u => { contagem[u.plano as keyof typeof contagem]++ })

  return {
    totalUsuarios: totalUsuarios ?? 0,
    totalTransacoes: totalTransacoes ?? 0,
    novosEsteMes: novosEsteMes ?? 0,
    planos: contagem,
  }
}

function StatCard({ label, valor, icon, color, sub }: {
  label: string; valor: string | number; icon: IconClass; color: string; sub?: string
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-white/40">{label}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon name={icon} className="text-sm" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{valor}</p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </Card>
  )
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Painel Administrativo</h1>
        <p className="text-sm text-white/40 mt-1">Visão geral da plataforma</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total usuários" valor={stats.totalUsuarios} icon={ICONS.admin.users} color="#00E5FF" sub="Base total" />
        <StatCard label="Novos este mês" valor={stats.novosEsteMes} icon={ICONS.admin.userPlus} color="#22C55E" sub="Cadastros" />
        <StatCard label="Transações" valor={stats.totalTransacoes.toLocaleString('pt-BR')} icon={ICONS.finance.transaction} color="#A855F7" sub="Total registrado" />
        <StatCard label="Plano Pro/Premium" valor={stats.planos.pro + stats.planos.premium} icon={ICONS.brand.premium} color="#EAB308" sub="Usuários pagos" />
      </div>

      {/* Distribuição de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-white/70 mb-4">Distribuição de planos</p>
          <div className="space-y-3">
            {[
              { label: 'Free', count: stats.planos.free, color: '#6B7280' },
              { label: 'Pro', count: stats.planos.pro, color: '#00E5FF' },
              { label: 'Premium', count: stats.planos.premium, color: '#A855F7' },
            ].map(p => {
              const pct = stats.totalUsuarios > 0 ? (p.count / stats.totalUsuarios) * 100 : 0
              return (
                <div key={p.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white/70">{p.label}</span>
                    <span className="text-sm text-white/40">{p.count} ({Math.round(pct)}%)</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, backgroundColor: p.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-white/70 mb-4">Links rápidos</p>
          <div className="space-y-2">
            {[
              { href: '/admin/usuarios', icon: ICONS.admin.users, label: 'Gerenciar usuários' },
              { href: '/admin/base', icon: ICONS.admin.base, label: 'Análise da base' },
              { href: '/admin/config', icon: ICONS.admin.settings, label: 'Configurações' },
            ].map(item => (
              <a
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03] transition-all"
              >
                <Icon name={item.icon} className="text-sm text-white/40" />
                <span className="text-sm text-white/70">{item.label}</span>
                <Icon name={ICONS.action.next} className="ml-auto text-sm text-white/20" />
              </a>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
