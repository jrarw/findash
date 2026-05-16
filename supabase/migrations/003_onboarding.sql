-- Campos necessários para o fluxo de onboarding pós-cadastro.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS objetivo TEXT
    CHECK (objetivo IN ('economizar', 'sair_dividas', 'organizar')),
  ADD COLUMN IF NOT EXISTS renda_mensal_estimada DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS onboarding_concluido BOOLEAN NOT NULL DEFAULT FALSE;

