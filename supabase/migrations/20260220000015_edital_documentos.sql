-- Table for edital documents (PDF, attachments)
CREATE TABLE IF NOT EXISTS edital_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'anexo', -- 'edital_pdf', 'anexo'
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_edital_documentos_edital ON edital_documentos(edital_id);

ALTER TABLE edital_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso isolado por tenant edital_docs" ON edital_documentos
  FOR ALL USING (tenant_id = public.uid_tenant());
