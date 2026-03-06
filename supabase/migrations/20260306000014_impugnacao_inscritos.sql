-- Fase 3.4: Periodo de impugnacao da lista de inscritos configuravel
-- Adiciona campos de data para inicio e fim do periodo de impugnacao

ALTER TABLE editais
  ADD COLUMN IF NOT EXISTS inicio_impugnacao_inscritos TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fim_impugnacao_inscritos TIMESTAMPTZ;

COMMENT ON COLUMN editais.inicio_impugnacao_inscritos IS 'Inicio do periodo de impugnacao da lista de inscritos';
COMMENT ON COLUMN editais.fim_impugnacao_inscritos IS 'Fim do periodo de impugnacao da lista de inscritos';
