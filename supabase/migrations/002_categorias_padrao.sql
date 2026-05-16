INSERT INTO categorias (nome, tipo, icone, cor, ordem) VALUES
  ('Salário', 'entrada', 'ti-currency-dollar', '#22C55E', 1),
  ('Freelance', 'entrada', 'ti-briefcase', '#22C55E', 2),
  ('Investimentos', 'entrada', 'ti-trending-up', '#00E5FF', 3),
  ('Outros (entrada)', 'entrada', 'ti-plus', '#6B7280', 4),
  ('Moradia', 'saida', 'ti-home', '#A855F7', 10),
  ('Alimentação', 'saida', 'ti-tools-kitchen-2', '#FB5607', 11),
  ('Transporte', 'saida', 'ti-car', '#EAB308', 12),
  ('Saúde', 'saida', 'ti-heart', '#EF4444', 13),
  ('Educação', 'saida', 'ti-school', '#3B82F6', 14),
  ('Lazer', 'saida', 'ti-device-gamepad', '#EC4899', 15),
  ('Vestuário', 'saida', 'ti-shirt', '#F97316', 16),
  ('Assinaturas', 'saida', 'ti-repeat', '#8B5CF6', 17),
  ('Cartão de crédito', 'saida', 'ti-credit-card', '#6366F1', 18),
  ('Impostos', 'saida', 'ti-receipt', '#DC2626', 19),
  ('Outros (saída)', 'saida', 'ti-minus', '#6B7280', 20)
ON CONFLICT DO NOTHING;
