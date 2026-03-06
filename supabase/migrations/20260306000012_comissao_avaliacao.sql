-- ============================================================================
-- MIGRATION: Comissão de Avaliação
-- Data: 2026-03-06
-- Fase 2.4 - Cadastro de membros da comissão por edital
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.edital_comissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_id UUID NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nome TEXT NOT NULL,
    cpf TEXT,
    qualificacao TEXT,
    tipo TEXT NOT NULL DEFAULT 'sociedade_civil'
        CHECK (tipo IN ('sociedade_civil', 'poder_executivo', 'suplente')),
    portaria_numero TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edital_comissao_edital ON public.edital_comissao(edital_id);

-- RLS
ALTER TABLE public.edital_comissao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_all_edital_comissao" ON public.edital_comissao FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "public_select_edital_comissao" ON public.edital_comissao FOR SELECT
USING (true);
