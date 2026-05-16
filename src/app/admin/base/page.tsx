import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Icon } from '@/components/ui/icon'
import { formatCurrencyBRL } from '@/lib/format'
import { ICONS } from '@/lib/iconography'

async function getBaseStats() {
  const supabase = await createClient()

  const hoje = new Date()
  const inicioMes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: transacoesMes },
    { count: usuariosAtivos },
    { count: metasAtivas },
    { count: contasPendentes },
  ] = await Promise.all([
    supabase.from('transacoes').select('tipo, valor').gte('data', inicioMes),
    supabase.from('usuarios').select('*', { count: 'exact', head: true })
      .gte('ultimo_acesso', new Date(Date.now() - 7 * 86400000).toISOString()),
    supabase.from('metas').select('*', { count: 'exact', head: true }).eq('ativa', true),
    supabase.from('contas_pagar').select('*', { count: 'exact', head: true }).eq('status', 'pendente'),
  ])

  const totalEntradas = transacoesMes?.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const totalSaidas = transacoesMes?.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0) ?? 0

  return {
    totalEntradas,
    totalSaidas,
    usuariosAtivos: usuariosAtivos ?? 0,
    metasAtivas: metasAtivas ?? 0,
    contasPendentes: contasPendentes ?? 0,
    transacoesMes: transacoesMes?.length ?? 0,
  }
}

export default async function BaseAdminPage() {
  const stats = await getBaseStats()

  const cards = [
    { label: 'Entradas este mês (total base)', valor: formatCurrencyBRL(stats.totalEntradas), icon: ICONS.finance.income, color: '#22C55E' },
    { label: 'Saídas este mês (total base)', valor: formatCurrencyBRL(stats.totalSaidas), icon: ICONS.finance.expense, color: '#EF4444' },
    { label: 'Usuários ativos (7d)', valor: stats.usuariosAtivos, icon: ICONS.admin.activity, color: '#00E5FF' },
    { label: 'Transações este mês', valor: stats.transacoesMes.toLocaleString('pt-BR'), icon: ICONS.finance.transaction, color: '#A855F7' },
    { label: 'Metas ativas', valor: stats.metasAtivas, icon: ICONS.finance.goal, color: '#EAB308' },
    { label: 'Contas a pagar pendentes', valor: stats.contasPendentes, icon: ICONS.finance.bill, color: '#F97316' },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Visão da Base</h1>
        <p className="text-sm text-white/40 mt-1">Métricas agregadas da plataforma</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.label} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${c.color}15` }}>
                <Icon name={c.icon} className="text-sm" style={{ color: c.color }} />
              </div>
              <span className="text-xs text-white/40 leading-tight">{c.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{c.valor}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}
