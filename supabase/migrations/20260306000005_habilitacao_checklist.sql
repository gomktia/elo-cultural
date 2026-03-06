-- ============================================================================
-- MIGRATION: Checklist de Habilitacao por Edital + Conferencia de Documentos
-- Data: 2026-03-06
-- Fase 5.1 - Habilitacao
-- ============================================================================

-- 1. Documentos exigidos por edital (gestor configura)
CREATE TABLE IF NOT EXISTS public.edital_docs_habilitacao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_id UUID NOT NULL REFERENCES public.editais(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    tipo_documento TEXT NOT NULL,
    nome TEXT NOT NULL,
    descricao TEXT,
    obrigatorio BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_edital_docs_hab_edital ON public.edital_docs_habilitacao(edital_id);

-- 2. Conferencia individual de cada documento por projeto
CREATE TABLE IF NOT EXISTS public.habilitacao_doc_conferencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    doc_exigido_id UUID NOT NULL REFERENCES public.edital_docs_habilitacao(id) ON DELETE CASCADE,
    documento_id UUID REFERENCES public.projeto_documentos(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    status TEXT NOT NULL DEFAULT 'pendente'
        CHECK (status IN ('pendente', 'aprovado', 'reprovado', 'pendencia')),
    observacao TEXT,
    conferido_por UUID REFERENCES auth.users(id),
    conferido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hab_conf_projeto ON public.habilitacao_doc_conferencia(projeto_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_hab_conf_unique ON public.habilitacao_doc_conferencia(projeto_id, doc_exigido_id);

-- 3. Diligencias (solicitacao de regularizacao)
CREATE TABLE IF NOT EXISTS public.habilitacao_diligencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    numero INTEGER DEFAULT 1,
    descricao TEXT NOT NULL,
    prazo_dias INTEGER DEFAULT 5,
    data_envio TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    data_resposta TIMESTAMPTZ,
    respondida BOOLEAN DEFAULT false,
    criado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_hab_dilig_projeto ON public.habilitacao_diligencias(projeto_id);

-- 4. RLS
ALTER TABLE public.edital_docs_habilitacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilitacao_doc_conferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habilitacao_diligencias ENABLE ROW LEVEL SECURITY;

-- edital_docs_habilitacao: staff manages, proponente reads
CREATE POLICY "staff_all_edital_docs_hab" ON public.edital_docs_habilitacao FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "proponente_select_edital_docs_hab" ON public.edital_docs_habilitacao FOR SELECT
USING (true);

-- habilitacao_doc_conferencia: staff manages, proponente reads own
CREATE POLICY "staff_all_hab_conf" ON public.habilitacao_doc_conferencia FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "proponente_select_hab_conf" ON public.habilitacao_doc_conferencia FOR SELECT
USING (projeto_id IN (SELECT pr.id FROM public.projetos pr WHERE pr.proponente_id = auth.uid()));

-- habilitacao_diligencias: staff manages, proponente reads own
CREATE POLICY "staff_all_hab_dilig" ON public.habilitacao_diligencias FOR ALL
USING (tenant_id IN (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')));

CREATE POLICY "proponente_select_hab_dilig" ON public.habilitacao_diligencias FOR SELECT
USING (projeto_id IN (SELECT pr.id FROM public.projetos pr WHERE pr.proponente_id = auth.uid()));
