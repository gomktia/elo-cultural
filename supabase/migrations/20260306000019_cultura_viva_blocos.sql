-- Fase 10.2: Cultura Viva avaliação em dois blocos
-- Adds bloco column to criterios table for block-based evaluation

ALTER TABLE criterios ADD COLUMN IF NOT EXISTS bloco text DEFAULT NULL
  CHECK (bloco IS NULL OR bloco IN ('bloco1_entidade', 'bloco2_projeto'));

-- Pre-certification: nota >= 50 in bloco1 for cultura_viva editais
-- This is enforced in application logic (consolidar-ranking.ts)

COMMENT ON COLUMN criterios.bloco IS 'For Cultura Viva editais: bloco1_entidade (entity eval, 100pts) or bloco2_projeto (project eval, 100pts). NULL for standard editais.';
