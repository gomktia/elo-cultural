-- ============================================================================
-- MIGRATION: Adicionar valor_total (dotacao orcamentaria) aos editais
-- ============================================================================
ALTER TABLE editais ADD COLUMN IF NOT EXISTS valor_total DECIMAL(12,2);
