-- ============================================================================
-- MIGRATION: Cancelamento de edital com justificativa
-- ============================================================================

ALTER TABLE editais ADD COLUMN IF NOT EXISTS cancelado BOOLEAN DEFAULT false;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS justificativa_cancelamento TEXT;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS cancelado_por UUID REFERENCES profiles(id);
ALTER TABLE editais ADD COLUMN IF NOT EXISTS cancelado_em TIMESTAMPTZ;
