-- ============================================================================
-- MIGRATION: Aprovação de perfis avaliador/gestor por admin
-- ============================================================================
-- Proponentes são aprovados automaticamente.
-- Avaliadores e gestores precisam de aprovação de um admin.
-- ============================================================================

-- 1. Adicionar coluna aprovado (default true para não afetar usuários existentes)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aprovado BOOLEAN DEFAULT true;

-- 2. Adicionar coluna aprovado_por e aprovado_em
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aprovado_por UUID REFERENCES profiles(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS aprovado_em TIMESTAMPTZ;

-- 3. Índice para buscar pendentes rapidamente
CREATE INDEX IF NOT EXISTS idx_profiles_aprovacao ON profiles(aprovado, role) WHERE aprovado = false;
