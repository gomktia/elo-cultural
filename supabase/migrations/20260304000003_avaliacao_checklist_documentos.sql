-- ============================================================================
-- MIGRATION: Checklist de documentos na avaliação
-- ============================================================================
-- Adiciona campo JSONB para armazenar checklist de verificação de documentos
-- Formato: { "doc_id": { "verificado": true, "observacao": "..." } }
-- ============================================================================

ALTER TABLE avaliacoes ADD COLUMN IF NOT EXISTS checklist_documentos JSONB DEFAULT '{}';
