-- Add divulgacao de inscritos and its recurso phase to the flow
-- These go between inscricao_encerrada and avaliacao_tecnica
ALTER TYPE fase_edital ADD VALUE IF NOT EXISTS 'divulgacao_inscritos' AFTER 'inscricao_encerrada';
ALTER TYPE fase_edital ADD VALUE IF NOT EXISTS 'recurso_divulgacao_inscritos' AFTER 'divulgacao_inscritos';
