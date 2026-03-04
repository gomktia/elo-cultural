-- ============================================================================
-- MIGRATION: Publicações - campo etapa + tipo livre
-- ============================================================================
-- Adiciona campo 'etapa' para associar publicações a etapas do edital
-- Remove restrição CHECK de tipo fixo para permitir tipos customizados
-- ============================================================================

-- 1. Adicionar coluna etapa
ALTER TABLE publicacoes ADD COLUMN IF NOT EXISTS etapa TEXT;

-- 2. Remover CHECK constraint de tipo fixo para permitir tipos livres
ALTER TABLE publicacoes DROP CONSTRAINT IF EXISTS publicacoes_tipo_check;

-- 3. Índice para buscar por etapa
CREATE INDEX IF NOT EXISTS idx_publicacoes_etapa ON publicacoes(edital_id, etapa);
