-- ============================================================================
-- MIGRATION: Prestacao de Contas Completa (ANEXO XI - Relatorio Execucao)
-- Data: 2026-03-06
-- Baseado no ANEXO XI do edital PNAB (9 secoes)
-- ============================================================================

-- 1. Campos estruturados na prestacao de contas
ALTER TABLE public.prestacoes_contas
  ADD COLUMN IF NOT EXISTS acoes_realizadas TEXT DEFAULT 'sim_conforme'
    CHECK (acoes_realizadas IN ('sim_conforme', 'sim_com_adaptacoes', 'parcial', 'nao_conforme')),
  ADD COLUMN IF NOT EXISTS acoes_desenvolvidas TEXT,
  ADD COLUMN IF NOT EXISTS metas JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS produtos_gerados JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS produtos_disponibilizacao TEXT,
  ADD COLUMN IF NOT EXISTS resultados_gerados TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS publico_alcancado_quantidade INTEGER,
  ADD COLUMN IF NOT EXISTS publico_mensuracao TEXT,
  ADD COLUMN IF NOT EXISTS publico_justificativa TEXT,
  ADD COLUMN IF NOT EXISTS equipe_quantidade INTEGER,
  ADD COLUMN IF NOT EXISTS equipe_houve_mudancas BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS local_tipo TEXT DEFAULT 'presencial'
    CHECK (local_tipo IN ('presencial', 'virtual', 'hibrido')),
  ADD COLUMN IF NOT EXISTS local_plataformas TEXT,
  ADD COLUMN IF NOT EXISTS local_links TEXT,
  ADD COLUMN IF NOT EXISTS local_descricao TEXT,
  ADD COLUMN IF NOT EXISTS divulgacao TEXT,
  ADD COLUMN IF NOT EXISTS topicos_adicionais TEXT,
  ADD COLUMN IF NOT EXISTS julgamento TEXT
    CHECK (julgamento IS NULL OR julgamento IN (
      'aprovada_sem_ressalvas',
      'aprovada_com_ressalvas',
      'rejeitada_parcial',
      'rejeitada_total'
    )),
  ADD COLUMN IF NOT EXISTS plano_compensatorio TEXT,
  ADD COLUMN IF NOT EXISTS valor_devolucao DECIMAL(12,2);

-- 2. Equipe da prestacao de contas
CREATE TABLE IF NOT EXISTS public.prestacao_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prestacao_id UUID NOT NULL REFERENCES public.prestacoes_contas(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nome TEXT NOT NULL,
    funcao TEXT NOT NULL,
    cpf_cnpj TEXT,
    pessoa_negra_indigena BOOLEAN DEFAULT false,
    pessoa_pcd BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_prestacao_equipe_prestacao ON public.prestacao_equipe(prestacao_id);

-- 3. RLS
ALTER TABLE public.prestacao_equipe ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proponente_select_prestacao_equipe"
ON public.prestacao_equipe FOR SELECT
USING (
    prestacao_id IN (
        SELECT pc.id FROM public.prestacoes_contas pc
        WHERE pc.proponente_id = auth.uid()
    )
);

CREATE POLICY "proponente_insert_prestacao_equipe"
ON public.prestacao_equipe FOR INSERT
WITH CHECK (
    prestacao_id IN (
        SELECT pc.id FROM public.prestacoes_contas pc
        WHERE pc.proponente_id = auth.uid()
    )
);

CREATE POLICY "proponente_delete_prestacao_equipe"
ON public.prestacao_equipe FOR DELETE
USING (
    prestacao_id IN (
        SELECT pc.id FROM public.prestacoes_contas pc
        WHERE pc.proponente_id = auth.uid()
    )
);

CREATE POLICY "staff_all_prestacao_equipe"
ON public.prestacao_equipe FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);
