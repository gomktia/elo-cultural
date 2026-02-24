-- 1. Definição das Fases do Edital conforme o padrão de Banca
CREATE TYPE fase_edital AS ENUM (
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada', 
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao', 
  'resultado_definitivo_habilitacao', 'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 
  'recurso_avaliacao', 'resultado_final', 'homologacao', 'arquivamento'
);

-- Função auxiliar para o JWT referenciada na política abaixo (deve vir antes)
CREATE OR REPLACE FUNCTION public.uid_tenant()
RETURNS UUID AS $$
  SELECT (COALESCE(current_setting('request.jwt.claim.app_metadata', true)::jsonb->>'tenant_id', '00000000-0000-0000-0000-000000000000'))::UUID;
$$ LANGUAGE SQL STABLE;

-- 2. Tabela de Editais Robusta
CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  numero_edital TEXT NOT NULL, -- Ex: 001/2026
  titulo TEXT NOT NULL,
  descricao TEXT,
  status fase_edital DEFAULT 'criacao',
  
  -- Cronograma (Datas Críticas para bloqueio automático)
  inicio_inscricao TIMESTAMPTZ,
  fim_inscricao TIMESTAMPTZ,
  inicio_recurso TIMESTAMPTZ,
  fim_recurso TIMESTAMPTZ,
  
  versao INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID -- Referência ao Admin que criou (Ainda vamos criar a tabela users, então deixamos só UUID)
);

-- 3. Tabela de Critérios de Avaliação (O cérebro do Ranking)
CREATE TABLE criterios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL, -- Ex: "Mérito Cultural"
  nota_minima DECIMAL DEFAULT 0,
  nota_maxima DECIMAL NOT NULL,
  peso INTEGER DEFAULT 1,
  ordem INTEGER,
  tenant_id UUID REFERENCES tenants(id) NOT NULL
);

-- Tabela de Logs de Auditoria (Para suportar o diferencial GO MKT solicitado)
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    usuario_id UUID, -- Idealmente foreign key para users
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS para garantir que uma prefeitura não veja editais de outra
ALTER TABLE editais ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas Editais
CREATE POLICY "Acesso isolado por prefeitura" ON editais
  FOR ALL USING (tenant_id = public.uid_tenant()); 

-- Políticas Critérios
CREATE POLICY "Acesso isolado por prefeitura criterios" ON criterios
  FOR ALL USING (tenant_id = public.uid_tenant()); 

-- Políticas Logs
CREATE POLICY "Acesso isolado por prefeitura logs" ON logs_auditoria
  FOR ALL USING (tenant_id = public.uid_tenant());
