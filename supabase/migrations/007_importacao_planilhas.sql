-- Importação premium de planilhas financeiras.

CREATE TABLE IF NOT EXISTS import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_rows INT NOT NULL DEFAULT 0,
  imported_rows INT NOT NULL DEFAULT 0,
  skipped_rows INT NOT NULL DEFAULT 0,
  error_rows INT NOT NULL DEFAULT 0,
  total_income DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_expense DECIMAL(12,2) NOT NULL DEFAULT 0,
  net_total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed'
    CHECK (status IN ('completed', 'undone')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  categoria_id UUID NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(usuario_id, categoria_id, nome)
);

ALTER TABLE transacoes
  ADD COLUMN IF NOT EXISTS subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS origem TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS import_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_transacoes_import_hash
  ON transacoes(usuario_id, import_hash)
  WHERE import_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transacoes_import_batch
  ON transacoes(usuario_id, import_batch_id);

ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "import_batches_own" ON import_batches;
DROP POLICY IF EXISTS "subcategorias_own" ON subcategorias;

CREATE POLICY "import_batches_own" ON import_batches
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "subcategorias_own" ON subcategorias
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

