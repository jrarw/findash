import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Transacao, ContaPagar } from '@/types/database'
import { detectIntent, type FinSmartIntent } from './intent-engine'
import { formatCurrencyBRL, getCurrentMonthYear, getMonthStart, getMonthEnd } from '@/lib/format'

type TypedSupabaseClient = SupabaseClient<Database, 'public', 'public', Database['public']>
type CategoriaValorRow = {
  valor: number
  categoria: { nome: string; cor?: string } | null
}

export interface FinSmartResposta {
  intent: FinSmartIntent
  titulo: string
  resposta: string
  metricas: Array<{ label: string; valor: string; destaque?: boolean }>
  acoes: string[]
  followUps: string[]
}

export async function analisarQuery(
  query: string,
  supabase: TypedSupabaseClient,
  usuarioId: string
): Promise<FinSmartResposta> {
  const { intent, entidades } = detectIntent(query)
  const { mes, ano } = getCurrentMonthYear()

  switch (intent) {
    case 'ANALISAR_GASTOS':
      return await analisarGastos(supabase, usuarioId, mes, ano)

    case 'ANALISAR_CATEGORIA':
      return await analisarCategoria(supabase, usuarioId, mes, ano, entidades['categoria'])

    case 'ALERTAS_VENCIMENTO':
      return await alertasVencimento(supabase, usuarioId)

    case 'PROJECAO_MES':
      return await projecaoMes(supabase, usuarioId, mes, ano)

    case 'ANALISAR_SAUDE':
      return await analisarSaude(supabase, usuarioId, mes, ano)

    case 'DETECTAR_PADRAO':
      return await detectarPadrao(supabase, usuarioId, mes, ano)

    case 'COMPARAR_PERIODOS':
      return await compararPeriodos(supabase, usuarioId, mes, ano)

    default:
      return await diagnosticoGeral(supabase, usuarioId, mes, ano)
  }
}

async function analisarGastos(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const { data } = await supabase
    .from('transacoes')
    .select('tipo, valor')
    .eq('usuario_id', usuarioId)
    .gte('data', getMonthStart(mes, ano))
    .lte('data', getMonthEnd(mes, ano))
    .eq('efetivado', true)

  const entradas = data?.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const saidas = data?.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const saldo = entradas - saidas

  return {
    intent: 'ANALISAR_GASTOS',
    titulo: 'Resumo de gastos do mês',
    resposta: saidas > 0
      ? `Você gastou ${formatCurrencyBRL(saidas)} este mês. ${saldo >= 0 ? `Seu saldo está positivo em ${formatCurrencyBRL(saldo)}, ótimo controle!` : `Seu saldo está negativo em ${formatCurrencyBRL(Math.abs(saldo))}. Atenção aos gastos.`}`
      : 'Nenhum gasto registrado este mês ainda.',
    metricas: [
      { label: 'Total gasto', valor: formatCurrencyBRL(saidas), destaque: true },
      { label: 'Total recebido', valor: formatCurrencyBRL(entradas) },
      { label: 'Saldo', valor: formatCurrencyBRL(saldo), destaque: saldo < 0 },
    ],
    acoes: ['Ver extrato completo', 'Analisar por categoria'],
    followUps: ['Onde mais gastei?', 'Comparar com mês passado', 'Quais são meus gastos fixos?'],
  }
}

async function analisarCategoria(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number,
  categoriaNome?: string
): Promise<FinSmartResposta> {
  let query = supabase
    .from('transacoes')
    .select('valor, categoria:categorias(nome, cor)')
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'saida')
    .gte('data', getMonthStart(mes, ano))
    .lte('data', getMonthEnd(mes, ano))

  const { data } = await query

  const transacoes = (data ?? []) as CategoriaValorRow[]
  const porCategoria: Record<string, number> = {}
  transacoes.forEach(t => {
    const nome = t.categoria?.nome ?? 'Sem categoria'
    porCategoria[nome] = (porCategoria[nome] ?? 0) + Number(t.valor)
  })

  if (categoriaNome && porCategoria[categoriaNome] !== undefined) {
    const valor = porCategoria[categoriaNome]
    const total = Object.values(porCategoria).reduce((s, v) => s + v, 0)
    return {
      intent: 'ANALISAR_CATEGORIA',
      titulo: `Gastos em ${categoriaNome}`,
      resposta: `Você gastou ${formatCurrencyBRL(valor)} em ${categoriaNome} este mês, representando ${Math.round(valor / total * 100)}% dos seus gastos totais.`,
      metricas: [{ label: categoriaNome, valor: formatCurrencyBRL(valor), destaque: true }],
      acoes: [`Ver transações de ${categoriaNome}`],
      followUps: ['Ver todas as categorias', 'Comparar com mês passado'],
    }
  }

  const sorted = Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).slice(0, 5)
  return {
    intent: 'ANALISAR_CATEGORIA',
    titulo: 'Top categorias do mês',
    resposta: `Seus maiores gastos este mês foram em ${sorted.map(([n]) => n).join(', ')}.`,
    metricas: sorted.map(([nome, valor]) => ({ label: nome, valor: formatCurrencyBRL(valor) })),
    acoes: ['Ver todas as categorias'],
    followUps: ['Quanto gastei com alimentação?', 'Ver extrato completo'],
  }
}

async function alertasVencimento(
  supabase: TypedSupabaseClient,
  usuarioId: string
): Promise<FinSmartResposta> {
  const hoje = new Date()
  const em7dias = new Date(hoje)
  em7dias.setDate(em7dias.getDate() + 7)

  const { data } = await supabase
    .from('contas_pagar')
    .select('nome, valor, vencimento, status')
    .eq('usuario_id', usuarioId)
    .eq('status', 'pendente')
    .lte('vencimento', em7dias.toISOString().split('T')[0])
    .order('vencimento')

  const contas = (data ?? []) as ContaPagar[]
  const total = contas.reduce((s, c) => s + Number(c.valor), 0)

  return {
    intent: 'ALERTAS_VENCIMENTO',
    titulo: 'Contas a vencer',
    resposta: contas.length > 0
      ? `Você tem ${contas.length} conta(s) vencendo nos próximos 7 dias, totalizando ${formatCurrencyBRL(total)}.`
      : 'Nenhuma conta vencendo nos próximos 7 dias. Tudo em dia! ✅',
    metricas: contas.slice(0, 4).map(c => ({ label: c.nome, valor: formatCurrencyBRL(Number(c.valor)) })),
    acoes: ['Ver todas as contas', 'Marcar como paga'],
    followUps: ['Ver contas do mês', 'Quanto devo pagar este mês?'],
  }
}

async function projecaoMes(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const { data } = await supabase
    .from('transacoes')
    .select('tipo, valor, data')
    .eq('usuario_id', usuarioId)
    .gte('data', getMonthStart(mes, ano))
    .lte('data', getMonthEnd(mes, ano))

  const hoje = new Date()
  const diasPassados = hoje.getDate()
  const totalDias = new Date(ano, mes, 0).getDate()
  const diasRestantes = totalDias - diasPassados

  const entradas = data?.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const saidas = data?.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0) ?? 0

  const taxaDiariaSaida = saidas / diasPassados
  const projecaoSaidas = saidas + taxaDiariaSaida * diasRestantes
  const saldoProjetado = entradas - projecaoSaidas

  return {
    intent: 'PROJECAO_MES',
    titulo: 'Projeção do mês',
    resposta: saldoProjetado >= 0
      ? `Com base no ritmo atual, você deve fechar o mês com saldo positivo de ${formatCurrencyBRL(saldoProjetado)}. 🎯`
      : `Atenção: na velocidade atual, o mês deve fechar negativo em ${formatCurrencyBRL(Math.abs(saldoProjetado))}. Reduza os gastos nos próximos ${diasRestantes} dias.`,
    metricas: [
      { label: 'Gasto projetado', valor: formatCurrencyBRL(projecaoSaidas) },
      { label: 'Receita atual', valor: formatCurrencyBRL(entradas) },
      { label: 'Saldo projetado', valor: formatCurrencyBRL(saldoProjetado), destaque: saldoProjetado < 0 },
    ],
    acoes: ['Ver fluxo de caixa', 'Reduzir gastos'],
    followUps: ['Onde posso economizar?', 'Comparar com mês passado'],
  }
}

async function analisarSaude(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const { data: score } = await supabase
    .from('fin_health_scores')
    .select('score_geral, pilar_controle, pilar_reserva, pilar_fluxo, pilar_dividas, pilar_metas')
    .eq('usuario_id', usuarioId)
    .eq('mes', mes)
    .eq('ano', ano)
    .single()

  if (!score) {
    return {
      intent: 'ANALISAR_SAUDE',
      titulo: 'FinHealth Score',
      resposta: 'Seu score de saúde financeira ainda está sendo calculado. Lance suas transações para obter uma análise completa!',
      metricas: [],
      acoes: ['Lançar transação', 'Ver FinHealth'],
      followUps: ['Como melhorar meu score?'],
    }
  }

  const nivel = score.score_geral >= 80 ? 'excelente' : score.score_geral >= 60 ? 'bom' : score.score_geral >= 40 ? 'regular' : 'crítico'

  return {
    intent: 'ANALISAR_SAUDE',
    titulo: 'Saúde Financeira',
    resposta: `Seu score de saúde financeira é ${Math.round(score.score_geral)}/100 — nível ${nivel}. ${nivel === 'excelente' ? 'Parabéns, continue assim!' : nivel === 'bom' ? 'Boa situação, com espaço para melhorar.' : 'Há pontos importantes a trabalhar.'}`,
    metricas: [
      { label: 'Score geral', valor: `${Math.round(score.score_geral)}/100`, destaque: true },
      { label: 'Controle', valor: `${Math.round(score.pilar_controle ?? 0)}` },
      { label: 'Reserva', valor: `${Math.round(score.pilar_reserva ?? 0)}` },
      { label: 'Fluxo', valor: `${Math.round(score.pilar_fluxo ?? 0)}` },
    ],
    acoes: ['Ver FinHealth completo', 'Ver recomendações'],
    followUps: ['Como melhorar meu score?', 'Qual meu pior pilar?'],
  }
}

async function detectarPadrao(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const { data } = await supabase
    .from('transacoes')
    .select('valor, categoria:categorias(nome)')
    .eq('usuario_id', usuarioId)
    .eq('tipo', 'saida')
    .gte('data', getMonthStart(mes, ano))
    .lte('data', getMonthEnd(mes, ano))

  const transacoes = (data ?? []) as CategoriaValorRow[]
  const porCategoria: Record<string, number> = {}
  transacoes.forEach(t => {
    const nome = t.categoria?.nome ?? 'Sem categoria'
    porCategoria[nome] = (porCategoria[nome] ?? 0) + Number(t.valor)
  })

  const sorted = Object.entries(porCategoria).sort((a, b) => b[1] - a[1])
  const [maiorNome, maiorValor] = sorted[0] ?? ['Nenhum', 0]
  const total = sorted.reduce((s, [, v]) => s + v, 0)

  return {
    intent: 'DETECTAR_PADRAO',
    titulo: 'Padrão de gastos',
    resposta: `Seu maior gasto este mês é ${maiorNome} com ${formatCurrencyBRL(maiorValor)}, representando ${Math.round(maiorValor / total * 100)}% dos seus gastos totais.`,
    metricas: sorted.slice(0, 4).map(([nome, valor]) => ({
      label: nome,
      valor: formatCurrencyBRL(valor),
      destaque: nome === maiorNome
    })),
    acoes: ['Ver categorias', 'Ver extrato'],
    followUps: ['Como reduzir gastos?', 'Comparar com mês passado'],
  }
}

async function compararPeriodos(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const mesAnterior = mes === 1 ? 12 : mes - 1
  const anoAnterior = mes === 1 ? ano - 1 : ano

  const [{ data: atual }, { data: anterior }] = await Promise.all([
    supabase.from('transacoes').select('tipo, valor')
      .eq('usuario_id', usuarioId).eq('tipo', 'saida')
      .gte('data', getMonthStart(mes, ano)).lte('data', getMonthEnd(mes, ano)),
    supabase.from('transacoes').select('tipo, valor')
      .eq('usuario_id', usuarioId).eq('tipo', 'saida')
      .gte('data', getMonthStart(mesAnterior, anoAnterior)).lte('data', getMonthEnd(mesAnterior, anoAnterior))
  ])

  const saidasAtual = atual?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const saidasAnterior = anterior?.reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const diff = saidasAtual - saidasAnterior
  const pct = saidasAnterior > 0 ? Math.round(diff / saidasAnterior * 100) : 0

  return {
    intent: 'COMPARAR_PERIODOS',
    titulo: 'Comparação de meses',
    resposta: diff > 0
      ? `Você está gastando ${Math.abs(pct)}% a mais que o mês passado (+${formatCurrencyBRL(diff)}). Atenção para não extrapolar o orçamento.`
      : diff < 0
      ? `Ótimo! Você está gastando ${Math.abs(pct)}% a menos que o mês passado (${formatCurrencyBRL(diff)}). Continue assim!`
      : 'Seus gastos estão na mesma faixa do mês passado.',
    metricas: [
      { label: 'Mês atual', valor: formatCurrencyBRL(saidasAtual), destaque: true },
      { label: 'Mês anterior', valor: formatCurrencyBRL(saidasAnterior) },
      { label: 'Diferença', valor: `${diff >= 0 ? '+' : ''}${formatCurrencyBRL(diff)}`, destaque: diff > 0 },
    ],
    acoes: ['Ver fluxo de caixa'],
    followUps: ['Onde estou gastando mais?', 'Como economizar?'],
  }
}

async function diagnosticoGeral(
  supabase: TypedSupabaseClient,
  usuarioId: string,
  mes: number,
  ano: number
): Promise<FinSmartResposta> {
  const [{ data: transacoes }, { data: contas }, { data: score }] = await Promise.all([
    supabase.from('transacoes').select('tipo, valor')
      .eq('usuario_id', usuarioId)
      .gte('data', getMonthStart(mes, ano)).lte('data', getMonthEnd(mes, ano)),
    supabase.from('contas_pagar').select('valor, status')
      .eq('usuario_id', usuarioId).eq('status', 'pendente')
      .lte('vencimento', getMonthEnd(mes, ano)),
    supabase.from('fin_health_scores').select('score_geral')
      .eq('usuario_id', usuarioId).eq('mes', mes).eq('ano', ano).single()
  ])

  const entradas = transacoes?.filter(t => t.tipo === 'entrada').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const saidas = transacoes?.filter(t => t.tipo === 'saida').reduce((s, t) => s + Number(t.valor), 0) ?? 0
  const contasPendentes = contas?.reduce((s, c) => s + Number(c.valor), 0) ?? 0

  return {
    intent: 'DIAGNOSTICO_GERAL',
    titulo: 'Diagnóstico financeiro',
    resposta: `Neste mês você recebeu ${formatCurrencyBRL(entradas)} e gastou ${formatCurrencyBRL(saidas)}, resultando em saldo de ${formatCurrencyBRL(entradas - saidas)}. ${contasPendentes > 0 ? `Você ainda tem ${formatCurrencyBRL(contasPendentes)} em contas a pagar este mês.` : ''}${score ? ` Saúde financeira: ${Math.round(score.score_geral)}/100.` : ''}`,
    metricas: [
      { label: 'Entradas', valor: formatCurrencyBRL(entradas) },
      { label: 'Saídas', valor: formatCurrencyBRL(saidas) },
      { label: 'Saldo', valor: formatCurrencyBRL(entradas - saidas), destaque: (entradas - saidas) < 0 },
      ...(score ? [{ label: 'FinHealth', valor: `${Math.round(score.score_geral)}/100` }] : []),
    ],
    acoes: ['Ver extrato', 'Ver contas a pagar', 'Ver FinHealth'],
    followUps: ['Quanto gastei este mês?', 'O que vence essa semana?', 'Como melhorar minha saúde financeira?'],
  }
}
