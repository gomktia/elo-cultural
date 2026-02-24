-- 1. Tabela de recursos administrativos
CREATE TABLE recursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) NOT NULL,
  proponente_id UUID REFERENCES profiles(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('habilitacao', 'avaliacao')),
  numero_protocolo TEXT UNIQUE NOT NULL,
  fundamentacao TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'deferido', 'indeferido')),
  decisao TEXT,
  decidido_por UUID REFERENCES profiles(id),
  data_decisao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Anexos do recurso
CREATE TABLE recurso_anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_recursos_projeto ON recursos(projeto_id);
CREATE INDEX idx_recursos_proponente ON recursos(proponente_id);
CREATE INDEX idx_recursos_status ON recursos(status);

-- 3. RLS
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurso_anexos ENABLE ROW LEVEL SECURITY;

-- Proponente ve seus recursos
CREATE POLICY "Proponente ve seus recursos" ON recursos
  FOR SELECT USING (proponente_id = auth.uid());

-- Proponente cria recurso
CREATE POLICY "Proponente cria recurso" ON recursos
  FOR INSERT WITH CHECK (proponente_id = auth.uid());

-- Admin gerencia recursos do tenant
CREATE POLICY "Admin gerencia recursos" ON recursos
  FOR ALL USING (
    tenant_id = auth.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );

-- Anexos seguem o recurso
CREATE POLICY "Acesso anexos recurso" ON recurso_anexos
  FOR ALL USING (
    recurso_id IN (
      SELECT id FROM recursos WHERE proponente_id = auth.uid()
      UNION
      SELECT id FROM recursos WHERE tenant_id = auth.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
    )
  );
