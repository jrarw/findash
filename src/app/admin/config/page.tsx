import { Card } from '@/components/ui/card'

export default function ConfigAdminPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-white/40 mt-1">Configurações globais da plataforma</p>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-white/70 mb-4">Planos e limites</p>
          <div className="space-y-3">
            {[
              { label: 'Free — Transações/mês', valor: '100' },
              { label: 'Free — Contas bancárias', valor: '2' },
              { label: 'Pro — Transações/mês', valor: 'Ilimitado' },
              { label: 'Premium — Tudo + IA avançada', valor: 'Ilimitado' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-white/60">{item.label}</span>
                <span className="text-sm font-medium text-white">{item.valor}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-white/70 mb-4">Configurações de IA</p>
          <div className="space-y-3">
            {[
              { label: 'Modelo FinSmart', valor: 'claude-sonnet-4-20250514' },
              { label: 'Análise de anomalias', valor: 'Ativa' },
              { label: 'Cálculo FinHealth', valor: 'Mensal automático' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-sm text-white/60">{item.label}</span>
                <span className="text-sm font-medium text-[#00E5FF]">{item.valor}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
