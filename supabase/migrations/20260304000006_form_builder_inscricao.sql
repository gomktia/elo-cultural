-- ============================================================================
-- MIGRATION: Form builder dinâmico para inscrição
-- Permite ao admin configurar campos customizados por edital
-- ============================================================================

-- 1. Campos customizados do formulário de inscrição
CREATE TABLE IF NOT EXISTS edital_campos_inscricao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edital_id UUID NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  label TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'text',  -- text, textarea, number, select, checkbox, file
  obrigatorio BOOLEAN DEFAULT false,
  opcoes TEXT[] DEFAULT '{}',         -- para tipo 'select': opções disponíveis
  placeholder TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edital_campos_inscricao_edital ON edital_campos_inscricao(edital_id);

-- 2. Respostas dos campos customizados (JSONB no projeto)
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS campos_extras JSONB DEFAULT '{}';

-- 3. RLS
ALTER TABLE edital_campos_inscricao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campos visíveis pelo tenant"
  ON edital_campos_inscricao FOR SELECT
  USING (tenant_id = uid_tenant());

CREATE POLICY "Admin pode inserir campos"
  ON edital_campos_inscricao FOR INSERT
  WITH CHECK (tenant_id = uid_tenant());

CREATE POLICY "Admin pode atualizar campos"
  ON edital_campos_inscricao FOR UPDATE
  USING (tenant_id = uid_tenant());

CREATE POLICY "Admin pode deletar campos"
  ON edital_campos_inscricao FOR DELETE
  USING (tenant_id = uid_tenant());
