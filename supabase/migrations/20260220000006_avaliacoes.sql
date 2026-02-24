-- 1. Tabela de avaliacoes
CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) NOT NULL,
  avaliador_id UUID REFERENCES profiles(id) NOT NULL,
  pontuacao_total DECIMAL(5,2),
  justificativa TEXT,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'bloqueada')),
  versao INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de notas por criterio
CREATE TABLE avaliacao_criterios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avaliacao_id UUID REFERENCES avaliacoes(id) ON DELETE CASCADE,
  criterio_id UUID REFERENCES criterios(id),
  nota DECIMAL(5,2) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_avaliacoes_projeto ON avaliacoes(projeto_id);
CREATE INDEX idx_avaliacoes_avaliador ON avaliacoes(avaliador_id);
CREATE INDEX idx_avaliacao_criterios_avaliacao ON avaliacao_criterios(avaliacao_id);

-- 3. Trigger: calcula pontuacao_total automaticamente
CREATE OR REPLACE FUNCTION calcular_pontuacao_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE avaliacoes SET pontuacao_total = (
    SELECT SUM(ac.nota * c.peso) / NULLIF(SUM(c.peso), 0)
    FROM avaliacao_criterios ac
    JOIN criterios c ON c.id = ac.criterio_id
    WHERE ac.avaliacao_id = NEW.avaliacao_id
  ) WHERE id = NEW.avaliacao_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calc_pontuacao
AFTER INSERT OR UPDATE ON avaliacao_criterios
FOR EACH ROW EXECUTE FUNCTION calcular_pontuacao_total();

-- 4. RLS
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacao_criterios ENABLE ROW LEVEL SECURITY;

-- Avaliador so ve projetos atribuidos a ele
CREATE POLICY "Avaliador ve suas avaliacoes" ON avaliacoes
  FOR SELECT USING (
    avaliador_id = auth.uid()
    OR tenant_id = auth.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );

CREATE POLICY "Avaliador edita suas avaliacoes" ON avaliacoes
  FOR UPDATE USING (avaliador_id = auth.uid() AND status = 'em_andamento');

CREATE POLICY "Admin gerencia avaliacoes" ON avaliacoes
  FOR ALL USING (
    tenant_id = auth.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Acesso criterios avaliacao" ON avaliacao_criterios
  FOR ALL USING (
    avaliacao_id IN (
      SELECT id FROM avaliacoes WHERE avaliador_id = auth.uid()
      UNION
      SELECT id FROM avaliacoes WHERE tenant_id = auth.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
    )
  );
