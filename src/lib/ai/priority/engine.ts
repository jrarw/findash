import type { Anomalia } from '../anomaly/types'

export interface InsightPriorizado {
  id: string
  tipo: string
  titulo: string
  descricao: string
  impacto: number
  acao: string
}

export function priorizarInsights(anomalias: Anomalia[]): InsightPriorizado[] {
  return anomalias.slice(0, 5).map((a, i) => ({
    id: `insight-${i}`,
    tipo: a.tipo,
    titulo: a.tipo === 'gasto_alto' ? `Atenção com ${a.categoria_nome}` : `Ótimo em ${a.categoria_nome}`,
    descricao: a.descricao,
    impacto: Math.abs(a.valor_atual - a.valor_esperado),
    acao: a.tipo === 'gasto_alto'
      ? `Reduza gastos em ${a.categoria_nome} para economizar R$ ${Math.round(a.valor_atual - a.valor_esperado)}`
      : `Continue o bom desempenho em ${a.categoria_nome}`
  }))
}
