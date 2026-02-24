-- ============================================================================
-- Migration: Adiciona campos de auditoria updated_at e updated_by
-- Objetivo: Conformidade com Lei 14.129/2021 (Governo Digital) e LGPD
-- Todas as tabelas mutaveis devem registrar QUEM e QUANDO alterou cada registro
-- ============================================================================

-- ── 1. Adicionar updated_at onde ausente ──

ALTER TABLE editais
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE criterios
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE projetos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE projeto_documentos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE avaliacao_criterios
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE recursos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE recurso_anexos
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE publicacoes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE edital_fases
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ── 2. Adicionar updated_by nas tabelas que ja possuem updated_at ──

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE avaliacoes
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ── 3. Funcao generica para atualizar updated_at e updated_by ──

CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Aplicar trigger em todas as tabelas mutaveis ──

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'tenants', 'profiles', 'editais', 'criterios', 'projetos',
      'projeto_documentos', 'avaliacoes', 'avaliacao_criterios',
      'recursos', 'recurso_anexos', 'publicacoes', 'edital_fases'
    ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trigger_audit_fields ON %I; CREATE TRIGGER trigger_audit_fields BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ── 5. Indices para consultas de auditoria ──

CREATE INDEX IF NOT EXISTS idx_editais_updated_by ON editais(updated_by);
CREATE INDEX IF NOT EXISTS idx_projetos_updated_by ON projetos(updated_by);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_updated_by ON avaliacoes(updated_by);
CREATE INDEX IF NOT EXISTS idx_recursos_updated_by ON recursos(updated_by);

-- ── 6. Comentarios para documentacao ──

COMMENT ON COLUMN editais.updated_by IS 'UUID do usuario que realizou a ultima alteracao';
COMMENT ON COLUMN projetos.updated_by IS 'UUID do usuario que realizou a ultima alteracao';
COMMENT ON COLUMN avaliacoes.updated_by IS 'UUID do usuario que realizou a ultima alteracao';
COMMENT ON COLUMN recursos.updated_by IS 'UUID do usuario que realizou a ultima alteracao';
