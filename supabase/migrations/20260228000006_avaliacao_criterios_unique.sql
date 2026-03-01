-- Add unique constraint on (avaliacao_id, criterio_id) to enable upsert
-- and prevent duplicate scores for the same criteria in one evaluation.
ALTER TABLE public.avaliacao_criterios
  ADD CONSTRAINT avaliacao_criterios_avaliacao_criterio_unique
  UNIQUE (avaliacao_id, criterio_id);
