-- Fase 7.5: Relatório Financeiro (quando exigido)
-- Solicitado quando objeto não comprovado ou denúncia de irregularidade

CREATE TABLE IF NOT EXISTS relatorios_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  projeto_id uuid NOT NULL REFERENCES projetos(id) ON DELETE CASCADE,
  prestacao_id uuid REFERENCES prestacoes_contas(id) ON DELETE SET NULL,
  proponente_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'enviado', 'em_analise', 'aprovado', 'reprovado')),
  motivo text NOT NULL DEFAULT 'objeto_nao_comprovado'
    CHECK (motivo IN ('objeto_nao_comprovado', 'denuncia_irregularidade', 'solicitacao_gestor')),
  data_notificacao timestamptz DEFAULT now(),
  prazo_dias integer DEFAULT 120,
  data_envio timestamptz,
  saldo_remanescente numeric(12,2) DEFAULT 0,
  saldo_devolvido boolean DEFAULT false,
  observacoes text,
  parecer_gestor text,
  data_analise timestamptz,
  analisado_por uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pagamentos detalhados do relatório financeiro
CREATE TABLE IF NOT EXISTS relatorio_financeiro_pagamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id uuid NOT NULL REFERENCES relatorios_financeiros(id) ON DELETE CASCADE,
  data_pagamento date NOT NULL,
  descricao text NOT NULL,
  valor numeric(12,2) NOT NULL,
  comprovante_path text,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE relatorios_financeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE relatorio_financeiro_pagamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage relatorios" ON relatorios_financeiros
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND tenant_id = relatorios_financeiros.tenant_id AND role IN ('gestor', 'admin', 'super_admin'))
  );

CREATE POLICY "Proponente can manage own relatorio" ON relatorios_financeiros
  FOR ALL USING (proponente_id = auth.uid());

CREATE POLICY "Staff can manage pagamentos" ON relatorio_financeiro_pagamentos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM relatorios_financeiros rf
      JOIN profiles p ON p.id = auth.uid() AND p.tenant_id = rf.tenant_id AND p.role IN ('gestor', 'admin', 'super_admin')
      WHERE rf.id = relatorio_financeiro_pagamentos.relatorio_id)
  );

CREATE POLICY "Proponente can manage own pagamentos" ON relatorio_financeiro_pagamentos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM relatorios_financeiros rf
      WHERE rf.id = relatorio_financeiro_pagamentos.relatorio_id AND rf.proponente_id = auth.uid())
  );

CREATE TRIGGER set_updated_at_relatorio_financeiro BEFORE UPDATE ON relatorios_financeiros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
