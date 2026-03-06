-- Fase 2.2: Impedimento de parecerista
-- Config-based: gestor registra conflitos conhecidos
CREATE TABLE IF NOT EXISTS impedimentos_parecerista (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  edital_id uuid NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL REFERENCES auth.users(id),
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  registrado_por uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(edital_id, avaliador_id, projeto_id)
);

ALTER TABLE impedimentos_parecerista ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage impedimentos" ON impedimentos_parecerista
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tenant_id = impedimentos_parecerista.tenant_id AND role IN ('gestor', 'admin', 'super_admin'))
  );
