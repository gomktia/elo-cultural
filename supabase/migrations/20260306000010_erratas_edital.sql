-- ============================================================================
-- MIGRATION: Erratas do Edital
-- Data: 2026-03-06
-- Fase 9.1 - Registro e publicacao de erratas
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.edital_erratas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_id UUID NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    numero_errata INTEGER NOT NULL DEFAULT 1,
    descricao TEXT NOT NULL,
    campo_alterado TEXT,
    valor_anterior TEXT,
    valor_novo TEXT,
    publicado_em TIMESTAMPTZ,
    publicado_por UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edital_erratas_edital ON public.edital_erratas(edital_id);

-- RLS
ALTER TABLE public.edital_erratas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_edital_erratas" ON public.edital_erratas FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "public_select_edital_erratas" ON public.edital_erratas FOR SELECT
USING (publicado_em IS NOT NULL);
