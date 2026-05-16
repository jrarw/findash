-- Usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'admin')),
  plano TEXT NOT NULL DEFAULT 'free'
    CHECK (plano IN ('free', 'pro', 'premium')),
  ultimo_acesso TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas bancárias/carteiras
CREATE TABLE IF NOT EXISTS contas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('corrente', 'poupanca', 'carteira', 'investimento', 'outro')),
  banco TEXT,
  cor TEXT DEFAULT '#00E5FF',
  icone TEXT DEFAULT 'ti-wallet',
  saldo_inicial DECIMAL(12,2) DEFAULT 0,
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ambos')),
  icone TEXT DEFAULT 'ti-tag',
  cor TEXT DEFAULT '#6B7280',
  ativa BOOLEAN DEFAULT TRUE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transações
CREATE TABLE IF NOT EXISTS transacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  conta_id UUID REFERENCES contas(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'transferencia')),
  valor DECIMAL(12,2) NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL,
  data_competencia DATE,
  efetivado BOOLEAN DEFAULT TRUE,
  recorrente BOOLEAN DEFAULT FALSE,
  recorrencia_id UUID,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('diaria', 'semanal', 'quinzenal', 'mensal', 'anual')),
  observacoes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contas a pagar/receber
CREATE TABLE IF NOT EXISTS contas_pagar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id UUID REFERENCES categorias(id),
  nome TEXT NOT NULL,
  valor DECIMAL(12,2) NOT NULL,
  vencimento DATE NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'pagar' CHECK (tipo IN ('pagar', 'receber')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'vencido', 'cancelado')),
  recorrente BOOLEAN DEFAULT FALSE,
  recorrencia_tipo TEXT CHECK (recorrencia_tipo IN ('semanal', 'quinzenal', 'mensal', 'anual')),
  recorrencia_dia INT,
  observacoes TEXT,
  transacao_id UUID REFERENCES transacoes(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orçamento mensal por categoria
CREATE TABLE IF NOT EXISTS orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  valor_limite DECIMAL(12,2) NOT NULL,
  mes INT NOT NULL CHECK (mes BETWEEN 1 AND 12),
  ano INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, categoria_id, mes, ano)
);

-- Metas financeiras
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('economia', 'limite_gasto', 'saldo_minimo', 'reserva', 'livre')),
  valor_alvo DECIMAL(12,2) NOT NULL,
  valor_atual DECIMAL(12,2) DEFAULT 0,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  categoria_id UUID REFERENCES categorias(id),
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FinHealth scores
CREATE TABLE IF NOT EXISTS fin_health_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  score_geral DECIMAL(5,2) NOT NULL,
  pilar_controle DECIMAL(5,2),
  pilar_reserva DECIMAL(5,2),
  pilar_fluxo DECIMAL(5,2),
  pilar_dividas DECIMAL(5,2),
  pilar_metas DECIMAL(5,2),
  mes INT NOT NULL,
  ano INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_transacoes_usuario_data ON transacoes(usuario_id, data DESC);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria ON transacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_usuario_vencimento ON contas_pagar(usuario_id, vencimento);
CREATE INDEX IF NOT EXISTS idx_fin_health_usuario ON fin_health_scores(usuario_id, mes, ano);

-- RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contas_pagar ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE fin_health_scores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "usuario_proprio" ON usuarios FOR ALL USING (id = auth.uid() OR EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "contas_proprias" ON contas FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "categorias_proprias" ON categorias FOR ALL USING (usuario_id = auth.uid() OR usuario_id IS NULL);
CREATE POLICY "transacoes_proprias" ON transacoes FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "contas_pagar_proprias" ON contas_pagar FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "orcamentos_proprios" ON orcamentos FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "metas_proprias" ON metas FOR ALL USING (usuario_id = auth.uid());
CREATE POLICY "health_proprio" ON fin_health_scores FOR ALL USING (usuario_id = auth.uid());
