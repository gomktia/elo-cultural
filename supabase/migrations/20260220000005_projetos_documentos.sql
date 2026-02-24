-- Adicionar campos faltantes em projetos
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS descricao_tecnica TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS orcamento_total DECIMAL(12,2);
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS cronograma_execucao TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS status_habilitacao TEXT DEFAULT 'pendente';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS nota_final DECIMAL(5,2);

-- Tabela de documentos anexados
CREATE TABLE projeto_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('identidade', 'proposta', 'orcamento', 'complementar')),
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projeto_documentos_projeto ON projeto_documentos(projeto_id);

ALTER TABLE projeto_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso docs por tenant" ON projeto_documentos
  FOR ALL USING (tenant_id = auth.uid_tenant());
