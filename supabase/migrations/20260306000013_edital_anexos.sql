-- Fase 1.9: Anexos/Templates do Edital para download
CREATE TABLE IF NOT EXISTS edital_anexos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edital_id uuid NOT NULL REFERENCES editais(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  tipo_anexo text NOT NULL DEFAULT 'outros',
  nome_arquivo text NOT NULL,
  storage_path text NOT NULL,
  tamanho_bytes bigint DEFAULT 0,
  mime_type text,
  ordem integer DEFAULT 0,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  CONSTRAINT edital_anexos_tipo_check CHECK (
    tipo_anexo IN (
      'carta_anuencia', 'planilha_orcamentaria', 'cronograma',
      'termo_compromisso', 'declaracao_etnico_racial', 'declaracao_pcd',
      'declaracao_coletivo', 'formulario_recurso', 'modelo_projeto',
      'edital_completo', 'outros'
    )
  )
);

CREATE INDEX idx_edital_anexos_edital ON edital_anexos(edital_id);

-- RLS
ALTER TABLE edital_anexos ENABLE ROW LEVEL SECURITY;

-- Public: anyone can read anexos of active editais
CREATE POLICY "edital_anexos_public_read" ON edital_anexos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM editais WHERE id = edital_id AND active = true)
  );

-- Staff can manage
CREATE POLICY "edital_anexos_staff_all" ON edital_anexos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND tenant_id = edital_anexos.tenant_id
        AND role IN ('admin', 'gestor')
    )
  );

-- Helper function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger updated_at
CREATE TRIGGER set_updated_at_edital_anexos
  BEFORE UPDATE ON edital_anexos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
