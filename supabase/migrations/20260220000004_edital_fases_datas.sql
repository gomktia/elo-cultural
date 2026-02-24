-- Tabela de fases com datas individuais por edital
CREATE TABLE edital_fases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  fase fase_edital NOT NULL,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  bloqueada BOOLEAN DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas frequentes
CREATE INDEX idx_edital_fases_edital ON edital_fases(edital_id);
CREATE INDEX idx_edital_fases_fase ON edital_fases(fase);

-- RLS
ALTER TABLE edital_fases ENABLE ROW LEVEL SECURITY;

-- Acesso via edital (que já tem RLS por tenant)
CREATE POLICY "Acesso fases via edital" ON edital_fases
  FOR ALL USING (
    edital_id IN (SELECT id FROM editais WHERE tenant_id = auth.uid_tenant())
  );

-- Função para bloquear fases expiradas automaticamente
CREATE OR REPLACE FUNCTION bloquear_fases_expiradas()
RETURNS void AS $$
BEGIN
  UPDATE edital_fases
  SET bloqueada = true
  WHERE bloqueada = false
    AND data_fim IS NOT NULL
    AND data_fim < now();
END;
$$ LANGUAGE plpgsql;
