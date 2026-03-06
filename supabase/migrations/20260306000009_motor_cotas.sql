-- ============================================================================
-- MIGRATION: Motor de Cotas Inteligente
-- Data: 2026-03-06
-- Fase 3.1 - Cotas com dupla concorrencia e remanejamento
-- ============================================================================

-- 1. Campo classificacao_tipo no projeto (como foi classificado)
ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS classificacao_tipo TEXT
    CHECK (classificacao_tipo IS NULL OR classificacao_tipo IN (
      'ampla_concorrencia',
      'cota_pessoa_negra',
      'cota_pessoa_indigena',
      'cota_pessoa_pcd',
      'cota_areas_perifericas',
      'remanejamento'
    ));

-- 2. Tabela estruturada de cotas por edital (substitui config_cotas JSONB)
CREATE TABLE IF NOT EXISTS public.edital_cotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_id UUID NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    tipo_cota TEXT NOT NULL
        CHECK (tipo_cota IN ('pessoa_negra', 'pessoa_indigena', 'pessoa_pcd', 'areas_perifericas')),
    percentual NUMERIC(5,2) DEFAULT 0,
    vagas_fixas INTEGER DEFAULT 0,
    por_categoria BOOLEAN DEFAULT true,
    campo_perfil TEXT NOT NULL,
    valor_campo TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edital_cotas_edital ON public.edital_cotas(edital_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_edital_cotas_unique ON public.edital_cotas(edital_id, tipo_cota);

-- 3. RLS
ALTER TABLE public.edital_cotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_edital_cotas" ON public.edital_cotas FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "public_select_edital_cotas" ON public.edital_cotas FOR SELECT
USING (true);
