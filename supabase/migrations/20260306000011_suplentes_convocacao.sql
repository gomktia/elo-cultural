-- ============================================================================
-- MIGRATION: Sistema de Suplentes e Convocações
-- Data: 2026-03-06
-- Fase 3.3 - Workflow de convocação de suplentes
-- ============================================================================

-- 1. Tabela de convocações
CREATE TABLE IF NOT EXISTS public.convocacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_id UUID NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    numero_chamada INTEGER NOT NULL DEFAULT 1,
    motivo TEXT NOT NULL,
    projeto_substituido_id UUID REFERENCES public.projetos(id),
    data_convocacao TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    prazo_habilitacao TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'convocado'
        CHECK (status IN ('convocado', 'habilitado', 'inabilitado', 'desistente', 'prazo_expirado')),
    convocado_por UUID REFERENCES public.profiles(id),
    observacao TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_convocacoes_edital ON public.convocacoes(edital_id);
CREATE INDEX IF NOT EXISTS idx_convocacoes_projeto ON public.convocacoes(projeto_id);

-- 2. RLS
ALTER TABLE public.convocacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_convocacoes" ON public.convocacoes FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "proponente_select_convocacoes" ON public.convocacoes FOR SELECT
USING (projeto_id IN (SELECT pr.id FROM public.projetos pr WHERE pr.proponente_id = auth.uid()));
