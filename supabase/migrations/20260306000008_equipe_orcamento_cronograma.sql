-- ============================================================================
-- MIGRATION: Equipe + Orcamento + Cronograma do Projeto
-- Data: 2026-03-06
-- Fase 1.6 - Ficha Tecnica / Equipe
-- Fase 1.7 - Planilha Orcamentaria Estruturada
-- Fase 1.8 - Cronograma de Execucao Estruturado
-- ============================================================================

-- =====================
-- FASE 1.6 - Equipe do Projeto
-- =====================

CREATE TABLE IF NOT EXISTS public.projeto_equipe (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    nome TEXT NOT NULL,
    funcao TEXT NOT NULL,
    cpf_cnpj TEXT,
    minicurriculo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projeto_equipe_projeto ON public.projeto_equipe(projeto_id);

-- =====================
-- FASE 1.7 - Planilha Orcamentaria
-- =====================

CREATE TABLE IF NOT EXISTS public.projeto_orcamento_itens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    categoria TEXT NOT NULL
        CHECK (categoria IN ('producao', 'divulgacao', 'acessibilidade', 'outras_fontes')),
    item TEXT NOT NULL,
    unidade_medida TEXT,
    quantidade INTEGER DEFAULT 1,
    valor_unitario NUMERIC(12,2) DEFAULT 0,
    valor_total NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projeto_orcamento_projeto ON public.projeto_orcamento_itens(projeto_id);

-- =====================
-- FASE 1.8 - Cronograma de Execucao
-- =====================

CREATE TABLE IF NOT EXISTS public.projeto_cronograma (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    fase TEXT NOT NULL
        CHECK (fase IN ('pre_producao', 'divulgacao', 'producao', 'pos_producao')),
    atividade TEXT NOT NULL,
    data_inicio DATE,
    data_fim DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projeto_cronograma_projeto ON public.projeto_cronograma(projeto_id);

-- =====================
-- RLS
-- =====================

ALTER TABLE public.projeto_equipe ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_orcamento_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projeto_cronograma ENABLE ROW LEVEL SECURITY;

-- projeto_equipe
CREATE POLICY "proponente_all_own_equipe" ON public.projeto_equipe FOR ALL
USING (projeto_id IN (SELECT p.id FROM public.projetos p WHERE p.proponente_id = auth.uid()));

CREATE POLICY "staff_all_equipe" ON public.projeto_equipe FOR ALL
USING (tenant_id IN (SELECT pr.tenant_id FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('gestor','admin','super_admin')));

-- projeto_orcamento_itens
CREATE POLICY "proponente_all_own_orcamento" ON public.projeto_orcamento_itens FOR ALL
USING (projeto_id IN (SELECT p.id FROM public.projetos p WHERE p.proponente_id = auth.uid()));

CREATE POLICY "staff_all_orcamento" ON public.projeto_orcamento_itens FOR ALL
USING (tenant_id IN (SELECT pr.tenant_id FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('gestor','admin','super_admin')));

-- projeto_cronograma
CREATE POLICY "proponente_all_own_cronograma" ON public.projeto_cronograma FOR ALL
USING (projeto_id IN (SELECT p.id FROM public.projetos p WHERE p.proponente_id = auth.uid()));

CREATE POLICY "staff_all_cronograma" ON public.projeto_cronograma FOR ALL
USING (tenant_id IN (SELECT pr.tenant_id FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('gestor','admin','super_admin')));
