import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { getMonthStart, getMonthEnd } from '@/lib/format'

export interface FinHealthResult {
  score_geral: number
  pilar_controle: number
  pilar_reserva: number
  pilar_fluxo: number
  pilar_dividas: number
  pilar_metas: number
  detalhes: Record<string, string>
}

export async function calcularFinHealth(
  supabase: SupabaseClient<Database>,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinHealthResult> {
  const [transacoes, contasPagar, metas, orcamentos] = await Promise.all([
    supabase.from('transacoes').select('tipo, valor, categoria_id')
      .eq('usuario_id', usuarioId)
      .gte('data', getMonthStart(mes, ano))
      .lte('data', getMonthEnd(mes, ano))
      .eq('efetivado', true),
    supabase.from('contas_pagar').select('valor, status, vencimento')
      .eq('usuario_id', usuarioId),
    supabase.from('metas').select('valor_alvo, valor_atual, ativa')
      .eq('usuario_id', usuarioId).eq('ativa', true),
    supabase.from('orcamentos').select('categoria_id, valor_limite')
      .eq('usuario_id', usuarioId).eq('mes', mes).eq('ano', ano)
  ])

  const tx = transacoes.data ?? []
  const cp = contasPagar.data ?? []
  const mt = metas.data ?? []
  const orc = orcamentos.data ?? []

  const entradas = tx.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0)
  const saidas = tx.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0)

  // Pilar Fluxo (25%)
  const fluxoScore = entradas > 0
    ? Math.min(100, Math.round((entradas / Math.max(saidas, 1)) * 50))
    : 0

  // Pilar Controle (25%)
  let controleScore = 70 // base
  if (orc.length > 0) {
    const saidasPorCategoria: Record<string, number> = {}
    tx.filter(t => t.tipo === 'saida' && t.categoria_id).forEach(t => {
      saidasPorCategoria[t.categoria_id!] = (saidasPorCategoria[t.categoria_id!] ?? 0) + Number(t.valor)
    })
    const dentroOrcamento = orc.filter(o => (saidasPorCategoria[o.categoria_id] ?? 0) <= Number(o.valor_limite)).length
    controleScore = Math.round((dentroOrcamento / orc.length) * 100)
  }

  // Pilar Dívidas (15%)
  const contasVencidas = cp.filter(c => c.status === 'vencido').length
  const dividasScore = Math.max(0, 100 - contasVencidas * 20)

  // Pilar Metas (15%)
  let metasScore = 50
  if (mt.length > 0) {
    const mediaProgresso = mt.reduce((s, m) => s + Math.min(1, Number(m.valor_atual) / Math.max(Number(m.valor_alvo), 1)), 0) / mt.length
    metasScore = Math.round(mediaProgresso * 100)
  }

  // Pilar Reserva (20%)
  const reservaScore = entradas > saidas ? Math.min(100, Math.round(((entradas - saidas) / entradas) * 200)) : 0

  const score_geral = Math.round(
    controleScore * 0.25 +
    reservaScore * 0.20 +
    fluxoScore * 0.25 +
    dividasScore * 0.15 +
    metasScore * 0.15
  )

  return {
    score_geral: Math.min(100, score_geral),
    pilar_controle: controleScore,
    pilar_reserva: reservaScore,
    pilar_fluxo: fluxoScore,
    pilar_dividas: dividasScore,
    pilar_metas: metasScore,
    detalhes: {
      controle: controleScore >= 80 ? 'Gastos bem controlados' : 'Alguns gastos acima do orçamento',
      reserva: reservaScore >= 60 ? 'Boa margem de reserva' : 'Margem de reserva baixa',
      fluxo: fluxoScore >= 70 ? 'Fluxo positivo e saudável' : 'Fluxo de caixa apertado',
      dividas: dividasScore >= 80 ? 'Sem dívidas vencidas' : `${contasVencidas} conta(s) vencida(s)`,
      metas: metasScore >= 70 ? 'Bom progresso nas metas' : 'Metas abaixo do esperado',
    }
  }
}
