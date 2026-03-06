-- Fase 10: Cultura Viva (PNCV) support
-- Adds tipo_edital enum value + cultura_viva specific tables

-- Add cultura_viva to tipo_edital if not exists
DO $$
BEGIN
  -- Check if tipo_edital column exists and add cultura_viva option
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'editais' AND column_name = 'tipo_edital') THEN
    -- tipo_edital is text, no enum change needed
    NULL;
  ELSE
    ALTER TABLE editais ADD COLUMN tipo_edital text DEFAULT 'fomento';
  END IF;
END $$;

-- Certificação de Ponto de Cultura (Fase 10.3)
CREATE TABLE IF NOT EXISTS certificacoes_cultura_viva (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  edital_id uuid REFERENCES editais(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'nao_certificado'
    CHECK (status IN ('nao_certificado', 'pre_certificado', 'certificado')),
  nota_bloco1 numeric(6,2),
  nota_bloco2 numeric(6,2),
  nota_final numeric(6,2),
  certificado_minc boolean DEFAULT false,
  data_certificacao timestamptz,
  portaria_numero text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Comitê Gestor (Fase 10.5)
CREATE TABLE IF NOT EXISTS comite_gestor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  nome_entidade text NOT NULL,
  cnpj text,
  tipo text NOT NULL DEFAULT 'sociedade_civil'
    CHECK (tipo IN ('sociedade_civil', 'servico_publico')),
  representante_nome text,
  representante_cpf text,
  created_at timestamptz DEFAULT now()
);

-- Metas padronizadas (Fase 10.4)
CREATE TABLE IF NOT EXISTS cultura_viva_metas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  numero_meta integer NOT NULL,
  titulo text NOT NULL,
  descricao text,
  obrigatoria boolean DEFAULT true,
  status text DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'nao_aplicavel')),
  evidencias text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE certificacoes_cultura_viva ENABLE ROW LEVEL SECURITY;
ALTER TABLE comite_gestor ENABLE ROW LEVEL SECURITY;
ALTER TABLE cultura_viva_metas ENABLE ROW LEVEL SECURITY;

-- Policies for certificacoes
CREATE POLICY "Staff can manage certificacoes" ON certificacoes_cultura_viva
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tenant_id = certificacoes_cultura_viva.tenant_id AND role IN ('gestor', 'admin', 'super_admin'))
  );

CREATE POLICY "Proponente can view own certificacao" ON certificacoes_cultura_viva
  FOR SELECT USING (profile_id = auth.uid());

-- Policies for comite_gestor
CREATE POLICY "Staff can manage comite" ON comite_gestor
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tenant_id = comite_gestor.tenant_id AND role IN ('gestor', 'admin', 'super_admin'))
  );

CREATE POLICY "Proponente can manage own comite" ON comite_gestor
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projetos WHERE id = comite_gestor.projeto_id AND proponente_id = auth.uid())
  );

-- Policies for metas
CREATE POLICY "Staff can manage metas" ON cultura_viva_metas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tenant_id = cultura_viva_metas.tenant_id AND role IN ('gestor', 'admin', 'super_admin'))
  );

CREATE POLICY "Proponente can manage own metas" ON cultura_viva_metas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projetos WHERE id = cultura_viva_metas.projeto_id AND proponente_id = auth.uid())
  );

-- Add triggers
CREATE TRIGGER set_updated_at_certificacoes BEFORE UPDATE ON certificacoes_cultura_viva
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_metas BEFORE UPDATE ON cultura_viva_metas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
