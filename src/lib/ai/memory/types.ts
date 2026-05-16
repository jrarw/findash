export interface BaselineCategoria {
  categoria_id: string
  categoria_nome: string
  media_mensal: number
  desvio_padrao: number
  historico_mensal: number[]
}

export interface MemoriaFinanceira {
  usuario_id: string
  baselines: BaselineCategoria[]
  total_entradas_media: number
  total_saidas_media: number
  saldo_medio: number
  periodo_meses: number
}
