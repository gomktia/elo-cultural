-- Fase 4.2: Deferimento parcial de recursos
-- Allows gestor to request specific criteria re-evaluation by a parecerista

CREATE TABLE IF NOT EXISTS recurso_revisoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  recurso_id uuid NOT NULL REFERENCES recursos(id) ON DELETE CASCADE,
  avaliador_id uuid NOT NULL REFERENCES auth.users(id),
  criterios_revisar text[] NOT NULL, -- array of criterio IDs to re-evaluate
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_revisao', 'revisada')),
  notas_anteriores jsonb, -- snapshot of original scores
  notas_revisadas jsonb, -- new scores after revision
  justificativa_revisao text,
  data_solicitacao timestamptz DEFAULT now(),
  data_revisao timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurso_revisoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage revisoes" ON recurso_revisoes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND tenant_id = recurso_revisoes.tenant_id
        AND role IN ('gestor', 'admin', 'super_admin')
    )
  );

CREATE POLICY "Avaliador can view and update own revisoes" ON recurso_revisoes
  FOR ALL USING (avaliador_id = auth.uid());

-- Add deferido_parcial to recurso status options
DO $$
BEGIN
  ALTER TABLE recursos DROP CONSTRAINT IF EXISTS recursos_status_check;
  ALTER TABLE recursos ADD CONSTRAINT recursos_status_check
    CHECK (status IN ('pendente', 'em_analise', 'deferido', 'indeferido', 'deferido_parcial'));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update recursos status constraint: %', SQLERRM;
END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_recurso_revisoes_recurso ON recurso_revisoes(recurso_id);
CREATE INDEX IF NOT EXISTS idx_recurso_revisoes_avaliador ON recurso_revisoes(avaliador_id);
CREATE INDEX IF NOT EXISTS idx_recurso_revisoes_status ON recurso_revisoes(status);
