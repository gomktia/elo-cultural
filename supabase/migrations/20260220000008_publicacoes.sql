-- Tabela de publicacoes oficiais
CREATE TABLE publicacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  edital_id UUID REFERENCES editais(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('resultado_preliminar', 'resultado_final', 'ata', 'homologacao')),
  numero_publicacao INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  arquivo_pdf TEXT, -- storage path
  publicado_por UUID REFERENCES profiles(id),
  data_publicacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_publicacoes_edital ON publicacoes(edital_id);

ALTER TABLE publicacoes ENABLE ROW LEVEL SECURITY;

-- Publicacoes sao publicas para leitura
CREATE POLICY "Leitura publica de publicacoes" ON publicacoes
  FOR SELECT USING (true);

-- Somente admin pode criar/editar
CREATE POLICY "Admin gerencia publicacoes" ON publicacoes
  FOR ALL USING (
    tenant_id = auth.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );
