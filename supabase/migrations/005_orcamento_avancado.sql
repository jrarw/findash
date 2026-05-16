-- Aprofunda orçamento mensal com base, ajuste e sobra transferível.

ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS valor_base DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS valor_ajustado DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS sobra_transferida DECIMAL(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transferir_sobra BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

UPDATE orcamentos
SET
  valor_base = COALESCE(valor_base, valor_limite),
  valor_ajustado = COALESCE(valor_ajustado, valor_limite),
  updated_at = COALESCE(updated_at, created_at)
WHERE valor_base IS NULL OR valor_ajustado IS NULL;

ALTER TABLE orcamentos
  ALTER COLUMN valor_base SET NOT NULL,
  ALTER COLUMN valor_ajustado SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orcamentos_usuario_periodo
  ON orcamentos(usuario_id, ano DESC, mes DESC);

