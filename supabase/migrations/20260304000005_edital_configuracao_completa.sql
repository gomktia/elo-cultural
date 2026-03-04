-- ============================================================================
-- MIGRATION: Configuração completa de edital
-- tipo, categorias, cotas, desempate, pontuação extra, reserva de vagas
-- ============================================================================

-- 1. Tipo de edital
ALTER TABLE editais ADD COLUMN IF NOT EXISTS tipo_edital TEXT DEFAULT 'fomento';
-- Valores: fomento, premiacao, credenciamento, chamamento_publico, outros

-- 2. Configurações avançadas (JSONB)

-- Cotas: [{ "nome": "LGBTQIAPN+", "percentual": 10, "campo_perfil": "orientacao_sexual" }]
ALTER TABLE editais ADD COLUMN IF NOT EXISTS config_cotas JSONB DEFAULT '[]';

-- Desempate: ["maior_idade", "mulher", "negro", "pcd", "menor_renda"]
ALTER TABLE editais ADD COLUMN IF NOT EXISTS config_desempate JSONB DEFAULT '[]';

-- Pontuação extra: [{ "grupo": "Mulheres", "pontos": 5, "campo_perfil": "genero", "valor": "feminino" }]
ALTER TABLE editais ADD COLUMN IF NOT EXISTS config_pontuacao_extra JSONB DEFAULT '[]';

-- Reserva de vagas: [{ "regiao": "Zona Norte", "vagas": 3 }]
ALTER TABLE editais ADD COLUMN IF NOT EXISTS config_reserva_vagas JSONB DEFAULT '[]';

-- 3. Tabela de categorias de seleção
CREATE TABLE IF NOT EXISTS edital_categorias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  edital_id UUID NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  nome TEXT NOT NULL,
  vagas INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_edital_categorias_edital ON edital_categorias(edital_id);

-- 4. Projetos podem pertencer a uma categoria
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES edital_categorias(id);

-- 5. RLS para edital_categorias
ALTER TABLE edital_categorias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categorias visíveis pelo tenant"
  ON edital_categorias FOR SELECT
  USING (tenant_id = uid_tenant());

CREATE POLICY "Admin/gestor pode inserir categorias"
  ON edital_categorias FOR INSERT
  WITH CHECK (tenant_id = uid_tenant());

CREATE POLICY "Admin/gestor pode atualizar categorias"
  ON edital_categorias FOR UPDATE
  USING (tenant_id = uid_tenant());

CREATE POLICY "Admin/gestor pode deletar categorias"
  ON edital_categorias FOR DELETE
  USING (tenant_id = uid_tenant());
