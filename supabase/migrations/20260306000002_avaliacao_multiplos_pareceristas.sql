-- ============================================================================
-- MIGRATION: Configuracao de multiplos pareceristas + nota minima
-- Data: 2026-03-06
-- ============================================================================

-- 1. Campos de configuracao no edital
ALTER TABLE public.editais
  ADD COLUMN IF NOT EXISTS numero_pareceristas INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS nota_minima_aprovacao DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nota_zero_desclassifica BOOLEAN DEFAULT true;

-- 2. Limiar de discrepancia entre pareceristas (em pontos)
ALTER TABLE public.editais
  ADD COLUMN IF NOT EXISTS limiar_discrepancia DECIMAL(5,2) DEFAULT 20;
