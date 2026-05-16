-- Cartões de crédito como entidade própria: limite, faturas, compras e parcelamentos.

CREATE TABLE IF NOT EXISTS cartoes_credito (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  bandeira TEXT NOT NULL DEFAULT 'outro'
    CHECK (bandeira IN ('visa', 'mastercard', 'elo', 'amex', 'hipercard', 'outro')),
  limite_total DECIMAL(12,2) NOT NULL,
  dia_fechamento INT NOT NULL CHECK (dia_fechamento BETWEEN 1 AND 31),
  dia_vencimento INT NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  cor TEXT NOT NULL DEFAULT '#00E5FF',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS faturas_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cartao_id UUID NOT NULL REFERENCES cartoes_credito(id) ON DELETE CASCADE,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  valor_pago DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'aberta'
    CHECK (status IN ('aberta', 'fechada', 'paga', 'parcial', 'atrasada')),
  vencimento DATE,
  fechamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, cartao_id, mes, ano)
);

CREATE TABLE IF NOT EXISTS compras_cartao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  cartao_id UUID NOT NULL REFERENCES cartoes_credito(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  descricao TEXT NOT NULL,
  valor_total DECIMAL(12,2) NOT NULL,
  parcelas_total INT NOT NULL DEFAULT 1 CHECK (parcelas_total >= 1),
  parcela_atual INT NOT NULL DEFAULT 1 CHECK (parcela_atual >= 1),
  fatura_mes INT NOT NULL CHECK (fatura_mes BETWEEN 1 AND 12),
  fatura_ano INT NOT NULL,
  data_compra DATE NOT NULL,
  recorrente BOOLEAN NOT NULL DEFAULT FALSE,
  estabelecimento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cartoes_usuario ON cartoes_credito(usuario_id, ativo);
CREATE INDEX IF NOT EXISTS idx_faturas_cartao_periodo ON faturas_cartao(usuario_id, cartao_id, ano DESC, mes DESC);
CREATE INDEX IF NOT EXISTS idx_compras_cartao_periodo ON compras_cartao(usuario_id, cartao_id, fatura_ano DESC, fatura_mes DESC);

ALTER TABLE cartoes_credito ENABLE ROW LEVEL SECURITY;
ALTER TABLE faturas_cartao ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras_cartao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cartoes_credito_own" ON cartoes_credito;
DROP POLICY IF EXISTS "faturas_cartao_own" ON faturas_cartao;
DROP POLICY IF EXISTS "compras_cartao_own" ON compras_cartao;

CREATE POLICY "cartoes_credito_own" ON cartoes_credito
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "faturas_cartao_own" ON faturas_cartao
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "compras_cartao_own" ON compras_cartao
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

