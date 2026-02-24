-- Additional recurso deadline columns for editais
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_inscricao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_inscricao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_selecao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_selecao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_habilitacao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_habilitacao TIMESTAMPTZ;
