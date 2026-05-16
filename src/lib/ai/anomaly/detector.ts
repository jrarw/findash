import type { BaselineCategoria } from '../memory/types'
import type { Anomalia } from './types'

export function detectarAnomalias(
  gastoAtual: Record<string, number>,
  baselines: BaselineCategoria[]
): Anomalia[] {
  const anomalias: Anomalia[] = []

  for (const baseline of baselines) {
    const atual = gastoAtual[baseline.categoria_id] ?? 0
    if (baseline.desvio_padrao === 0) continue

    const zScore = (atual - baseline.media_mensal) / baseline.desvio_padrao

    if (Math.abs(zScore) > 1.5) {
      anomalias.push({
        tipo: zScore > 0 ? 'gasto_alto' : 'gasto_baixo',
        categoria_id: baseline.categoria_id,
        categoria_nome: baseline.categoria_nome,
        valor_atual: atual,
        valor_esperado: baseline.media_mensal,
        z_score: zScore,
        severidade: Math.abs(zScore) > 3 ? 'alta' : Math.abs(zScore) > 2 ? 'media' : 'baixa',
        descricao: zScore > 0
          ? `Gasto ${Math.round((atual / baseline.media_mensal - 1) * 100)}% acima do normal em ${baseline.categoria_nome}`
          : `Gasto ${Math.round((1 - atual / baseline.media_mensal) * 100)}% abaixo do normal em ${baseline.categoria_nome}`
      })
    }
  }

  return anomalias.sort((a, b) => Math.abs(b.z_score) - Math.abs(a.z_score))
}
