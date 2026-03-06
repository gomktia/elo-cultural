-- ============================================================================
-- MIGRATION: Medidas de Acessibilidade do Projeto
-- Data: 2026-03-06
-- Fase 1.5 - Acessibilidade (arquitetonica, comunicacional, atitudinal)
-- ============================================================================

ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS acessibilidade JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS acessibilidade_descricao TEXT;
