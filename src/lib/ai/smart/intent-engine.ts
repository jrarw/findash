export type FinSmartIntent =
  | 'ANALISAR_GASTOS'
  | 'ANALISAR_CATEGORIA'
  | 'DETECTAR_QUEDA_SALDO'
  | 'ANALISAR_RECORRENCIA'
  | 'PROJECAO_MES'
  | 'ALERTAS_VENCIMENTO'
  | 'COMPARAR_PERIODOS'
  | 'ANALISAR_SAUDE'
  | 'RECOMENDACOES'
  | 'DETECTAR_PADRAO'
  | 'ANALISAR_META'
  | 'DIAGNOSTICO_GERAL'
  | 'UNKNOWN'

export interface IntentResult {
  intent: FinSmartIntent
  confianca: number
  entidades: Record<string, string>
}

const INTENT_PATTERNS: Array<{ intent: FinSmartIntent; patterns: RegExp[] }> = [
  {
    intent: 'ANALISAR_GASTOS',
    patterns: [
      /quanto (gastei|gast(o|ou)|despend(i|eu))/i,
      /total (de gastos|das saídas|das despesas)/i,
      /meus gastos/i,
      /quanto (saiu|foi embora)/i,
    ]
  },
  {
    intent: 'ANALISAR_CATEGORIA',
    patterns: [
      /quanto gastei (com|em|no|na|nos|nas)/i,
      /gastos (com|em|no|na|nos|nas)/i,
      /despesas (com|em|no|na)/i,
    ]
  },
  {
    intent: 'DETECTAR_QUEDA_SALDO',
    patterns: [
      /por que (meu saldo|o saldo) (caiu|diminuiu|baixou)/i,
      /saldo (negativo|caindo|baixo)/i,
      /dinheiro (sumiu|acabou|diminuiu)/i,
    ]
  },
  {
    intent: 'ANALISAR_RECORRENCIA',
    patterns: [
      /gastos (fixos|recorrentes|mensais)/i,
      /o que (pago|gasto) todo (mês|mes)/i,
      /contas fixas/i,
      /recorrência/i,
    ]
  },
  {
    intent: 'PROJECAO_MES',
    patterns: [
      /vou fechar (o mês|o mes) (no positivo|no negativo)/i,
      /como (vou terminar|vai fechar) o mês/i,
      /previsão (para o mês|do mês)/i,
      /projeção/i,
    ]
  },
  {
    intent: 'ALERTAS_VENCIMENTO',
    patterns: [
      /o que vence (essa|esta|próxima) semana/i,
      /contas (a vencer|para pagar|pendentes)/i,
      /vencimento/i,
      /boletos (pendentes|para pagar)/i,
    ]
  },
  {
    intent: 'COMPARAR_PERIODOS',
    patterns: [
      /estou gastando mais (que|do que)/i,
      /comparando (com|ao) (mês|mes) passado/i,
      /diferença entre (os|este|esse) meses/i,
      /mês passado/i,
    ]
  },
  {
    intent: 'ANALISAR_SAUDE',
    patterns: [
      /saúde financeira/i,
      /minha (saúde|situação) financeira/i,
      /como (estão|está) (minhas|minha) finanças/i,
      /score financeiro/i,
    ]
  },
  {
    intent: 'RECOMENDACOES',
    patterns: [
      /como (economizar|poupar|guardar) mais/i,
      /dicas (de economia|financeiras)/i,
      /o que (posso|devo) fazer/i,
      /recomend/i,
    ]
  },
  {
    intent: 'DETECTAR_PADRAO',
    patterns: [
      /maior (gasto|despesa)/i,
      /onde (mais gasto|mais despendo)/i,
      /padrão de gastos/i,
      /onde (vai|está indo) meu dinheiro/i,
    ]
  },
  {
    intent: 'ANALISAR_META',
    patterns: [
      /vou (bater|atingir|alcançar) (a meta|minha meta)/i,
      /progresso (da|das) meta/i,
      /meta de (economia|gasto|saldo)/i,
    ]
  },
  {
    intent: 'DIAGNOSTICO_GERAL',
    patterns: [
      /como (estão|está) (minhas finanças|meu financeiro)/i,
      /resumo (financeiro|do mês|das finanças)/i,
      /visão geral/i,
      /diagnóstico/i,
    ]
  }
]

const CATEGORIA_MAP: Record<string, string> = {
  'alimentação': 'Alimentação',
  'comida': 'Alimentação',
  'restaurante': 'Alimentação',
  'mercado': 'Alimentação',
  'supermercado': 'Alimentação',
  'moradia': 'Moradia',
  'aluguel': 'Moradia',
  'casa': 'Moradia',
  'transporte': 'Transporte',
  'uber': 'Transporte',
  'gasolina': 'Transporte',
  'saúde': 'Saúde',
  'médico': 'Saúde',
  'farmácia': 'Saúde',
  'educação': 'Educação',
  'escola': 'Educação',
  'curso': 'Educação',
  'lazer': 'Lazer',
  'entretenimento': 'Lazer',
  'streaming': 'Assinaturas',
  'netflix': 'Assinaturas',
  'spotify': 'Assinaturas',
  'assinatura': 'Assinaturas',
}

export function detectIntent(query: string): IntentResult {
  const normalized = query.toLowerCase().trim()

  for (const { intent, patterns } of INTENT_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(normalized)) {
        const entidades: Record<string, string> = {}

        // Extrai categoria se mencionada
        for (const [key, value] of Object.entries(CATEGORIA_MAP)) {
          if (normalized.includes(key)) {
            entidades['categoria'] = value
            break
          }
        }

        return { intent, confianca: 0.9, entidades }
      }
    }
  }

  return { intent: 'DIAGNOSTICO_GERAL', confianca: 0.5, entidades: {} }
}

export const SUGESTOES_INICIAIS = [
  'Quanto gastei este mês?',
  'Quais contas vencem essa semana?',
  'Como está minha saúde financeira?',
  'Onde mais gasto meu dinheiro?',
  'Vou fechar o mês no positivo?',
]
