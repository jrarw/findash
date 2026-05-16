-- Corrige policies de RLS para inserts/updates do app e remove recursão em usuarios.

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'usuarios',
        'contas',
        'categorias',
        'transacoes',
        'contas_pagar',
        'orcamentos',
        'metas',
        'fin_health_scores'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      policy_record.policyname,
      policy_record.schemaname,
      policy_record.tablename
    );
  END LOOP;
END $$;

CREATE POLICY "usuarios_select_own" ON usuarios
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "usuarios_insert_own" ON usuarios
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "usuarios_update_own" ON usuarios
  FOR UPDATE USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "contas_own" ON contas
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "categorias_select_own_or_default" ON categorias
  FOR SELECT USING (usuario_id = auth.uid() OR usuario_id IS NULL);

CREATE POLICY "categorias_insert_own" ON categorias
  FOR INSERT WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "categorias_update_own" ON categorias
  FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "categorias_delete_own" ON categorias
  FOR DELETE USING (usuario_id = auth.uid());

CREATE POLICY "transacoes_own" ON transacoes
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "contas_pagar_own" ON contas_pagar
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "orcamentos_own" ON orcamentos
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "metas_own" ON metas
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "fin_health_scores_own" ON fin_health_scores
  FOR ALL USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());

