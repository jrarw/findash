export interface Anomalia {
  tipo: 'gasto_alto' | 'gasto_baixo' | 'novo_gasto' | 'frequencia_alta'
  categoria_id: string
  categoria_nome: string
  valor_atual: number
  valor_esperado: number
  z_score: number
  severidade: 'baixa' | 'media' | 'alta'
  descricao: string
}
