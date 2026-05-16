export type UserRole = 'user' | 'admin'
export type UserPlan = 'free' | 'pro' | 'premium'
export type ContaTipo = 'corrente' | 'poupanca' | 'carteira' | 'investimento' | 'outro'
export type CategoriaTipo = 'entrada' | 'saida' | 'ambos'
export type TransacaoTipo = 'entrada' | 'saida' | 'transferencia'
export type RecorrenciaTipo = 'diaria' | 'semanal' | 'quinzenal' | 'mensal' | 'anual'
export type ContaPagarStatus = 'pendente' | 'pago' | 'vencido' | 'cancelado'
export type ContaPagarTipo = 'pagar' | 'receber'
export type MetaTipo = 'economia' | 'limite_gasto' | 'saldo_minimo' | 'reserva' | 'livre'
export type ObjetivoFinanceiro = 'economizar' | 'sair_dividas' | 'organizar'
export type CartaoBandeira = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'outro'
export type FaturaCartaoStatus = 'aberta' | 'fechada' | 'paga' | 'parcial' | 'atrasada'

export interface Usuario {
  id: string
  nome: string
  email: string
  role: UserRole
  plano: UserPlan
  objetivo: ObjetivoFinanceiro | null
  renda_mensal_estimada: number | null
  onboarding_concluido: boolean
  ultimo_acesso: string | null
  created_at: string
}

export interface Conta {
  id: string
  usuario_id: string
  nome: string
  tipo: ContaTipo
  banco: string | null
  cor: string
  icone: string
  saldo_inicial: number
  ativa: boolean
  created_at: string
}

export interface Categoria {
  id: string
  usuario_id: string | null
  nome: string
  tipo: CategoriaTipo
  icone: string
  cor: string
  ativa: boolean
  ordem: number
  created_at: string
}

export interface Subcategoria {
  id: string
  usuario_id: string
  categoria_id: string
  nome: string
  ativa: boolean
  created_at: string
  categoria?: Categoria | null
}

export interface Transacao {
  id: string
  usuario_id: string
  conta_id: string | null
  categoria_id: string | null
  subcategoria_id: string | null
  tipo: TransacaoTipo
  valor: number
  descricao: string
  data: string
  data_competencia: string | null
  efetivado: boolean
  recorrente: boolean
  recorrencia_id: string | null
  recorrencia_tipo: RecorrenciaTipo | null
  observacoes: string | null
  tags: string[] | null
  origem: string
  import_batch_id: string | null
  import_hash: string | null
  created_at: string
  // Joins opcionais
  categoria?: Categoria | null
  subcategoria?: Subcategoria | null
  conta?: Conta | null
}

export interface ContaPagar {
  id: string
  usuario_id: string
  categoria_id: string | null
  nome: string
  valor: number
  vencimento: string
  tipo: ContaPagarTipo
  status: ContaPagarStatus
  recorrente: boolean
  recorrencia_tipo: Omit<RecorrenciaTipo, 'diaria'> | null
  recorrencia_dia: number | null
  observacoes: string | null
  transacao_id: string | null
  created_at: string
  categoria?: Categoria | null
}

export interface Orcamento {
  id: string
  usuario_id: string
  categoria_id: string
  valor_limite: number
  valor_base: number
  valor_ajustado: number
  sobra_transferida: number
  transferir_sobra: boolean
  mes: number
  ano: number
  created_at: string
  updated_at: string | null
  categoria?: Categoria | null
}

export interface Meta {
  id: string
  usuario_id: string
  titulo: string
  tipo: MetaTipo
  valor_alvo: number
  valor_atual: number
  data_inicio: string
  data_fim: string | null
  categoria_id: string | null
  ativa: boolean
  created_at: string
  categoria?: Categoria | null
}

export interface FinHealthScore {
  id: string
  usuario_id: string
  score_geral: number
  pilar_controle: number | null
  pilar_reserva: number | null
  pilar_fluxo: number | null
  pilar_dividas: number | null
  pilar_metas: number | null
  mes: number
  ano: number
  created_at: string
}

export interface CartaoCredito {
  id: string
  usuario_id: string
  nome: string
  bandeira: CartaoBandeira
  limite_total: number
  dia_fechamento: number
  dia_vencimento: number
  cor: string
  ativo: boolean
  created_at: string
  updated_at: string | null
}

export interface FaturaCartao {
  id: string
  usuario_id: string
  cartao_id: string
  mes: number
  ano: number
  valor_total: number
  valor_pago: number
  status: FaturaCartaoStatus
  vencimento: string | null
  fechamento: string | null
  created_at: string
  updated_at: string | null
  cartao?: CartaoCredito | null
}

export interface CompraCartao {
  id: string
  usuario_id: string
  cartao_id: string
  categoria_id: string | null
  descricao: string
  valor_total: number
  parcelas_total: number
  parcela_atual: number
  fatura_mes: number
  fatura_ano: number
  data_compra: string
  recorrente: boolean
  estabelecimento: string | null
  observacoes: string | null
  created_at: string
  updated_at: string | null
  cartao?: CartaoCredito | null
  categoria?: Categoria | null
}

export interface ImportBatch {
  id: string
  usuario_id: string
  file_name: string
  total_rows: number
  imported_rows: number
  skipped_rows: number
  error_rows: number
  total_income: number
  total_expense: number
  net_total: number
  status: 'completed' | 'undone'
  created_at: string
}

// Tipos derivados úteis
export interface ResumoMes {
  entradas: number
  saidas: number
  saldo: number
  mes: number
  ano: number
}

export interface FluxoDiario {
  data: string
  entradas: number
  saidas: number
  saldo: number
}

export interface GastoCategoria {
  categoria_id: string
  categoria_nome: string
  categoria_cor: string
  categoria_icone: string
  total: number
  percentual: number
  num_transacoes: number
}

type Table<Row, Insert, Update> = {
  Row: Row & Record<string, unknown>
  Insert: Insert & Record<string, unknown>
  Update: Update & Record<string, unknown>
  Relationships: []
}

export type TransacaoInsert = Omit<
  Transacao,
  'id' | 'created_at' | 'categoria' | 'subcategoria' | 'conta' | 'subcategoria_id' | 'origem' | 'import_batch_id' | 'import_hash'
> & Partial<Pick<Transacao, 'subcategoria_id' | 'origem' | 'import_batch_id' | 'import_hash'>>

export interface Database {
  public: {
    Tables: {
      usuarios: Table<
        Usuario,
        Omit<Usuario, 'created_at' | 'ultimo_acesso' | 'objetivo' | 'renda_mensal_estimada' | 'onboarding_concluido'> & Partial<Pick<Usuario, 'ultimo_acesso' | 'objetivo' | 'renda_mensal_estimada' | 'onboarding_concluido'>>,
        Partial<Omit<Usuario, 'id' | 'created_at'>>
      >
      contas: Table<Conta, Omit<Conta, 'id' | 'created_at'>, Partial<Omit<Conta, 'id'>>>
      categorias: Table<Categoria, Omit<Categoria, 'id' | 'created_at'>, Partial<Omit<Categoria, 'id'>>>
      subcategorias: Table<Subcategoria, Omit<Subcategoria, 'id' | 'created_at' | 'categoria'>, Partial<Omit<Subcategoria, 'id' | 'categoria'>>>
      transacoes: Table<Transacao, TransacaoInsert, Partial<Omit<Transacao, 'id' | 'categoria' | 'subcategoria' | 'conta'>>>
      contas_pagar: Table<ContaPagar, Omit<ContaPagar, 'id' | 'created_at' | 'categoria'>, Partial<Omit<ContaPagar, 'id' | 'categoria'>>>
      orcamentos: Table<Orcamento, Omit<Orcamento, 'id' | 'created_at' | 'categoria'>, Partial<Omit<Orcamento, 'id' | 'categoria'>>>
      metas: Table<Meta, Omit<Meta, 'id' | 'created_at' | 'categoria'>, Partial<Omit<Meta, 'id' | 'categoria'>>>
      fin_health_scores: Table<FinHealthScore, Omit<FinHealthScore, 'id' | 'created_at'>, Partial<Omit<FinHealthScore, 'id'>>>
      cartoes_credito: Table<CartaoCredito, Omit<CartaoCredito, 'id' | 'created_at' | 'updated_at'> & Partial<Pick<CartaoCredito, 'updated_at'>>, Partial<Omit<CartaoCredito, 'id' | 'created_at'>>>
      faturas_cartao: Table<FaturaCartao, Omit<FaturaCartao, 'id' | 'created_at' | 'updated_at' | 'cartao'> & Partial<Pick<FaturaCartao, 'updated_at'>>, Partial<Omit<FaturaCartao, 'id' | 'created_at' | 'cartao'>>>
      compras_cartao: Table<CompraCartao, Omit<CompraCartao, 'id' | 'created_at' | 'updated_at' | 'cartao' | 'categoria'> & Partial<Pick<CompraCartao, 'updated_at'>>, Partial<Omit<CompraCartao, 'id' | 'created_at' | 'cartao' | 'categoria'>>>
      import_batches: Table<ImportBatch, Omit<ImportBatch, 'id' | 'created_at'>, Partial<Omit<ImportBatch, 'id' | 'created_at'>>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
