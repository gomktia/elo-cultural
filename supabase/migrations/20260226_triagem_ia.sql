-- ============================================================
-- Triagem IA — Tabelas para análise automatizada de projetos
-- ============================================================

-- 1. Execuções de triagem
CREATE TABLE public.triagem_ia_execucoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    edital_id UUID NOT NULL REFERENCES public.editais(id),
    executado_por UUID NOT NULL REFERENCES auth.users(id),
    tipo VARCHAR(50) DEFAULT 'completa' CHECK (tipo IN ('habilitacao', 'avaliacao', 'irregularidades', 'completa')),
    status VARCHAR(50) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'erro')),
    total_projetos INTEGER DEFAULT 0,
    projetos_analisados INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    concluida_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_triagem_exec_tenant ON public.triagem_ia_execucoes(tenant_id);
CREATE INDEX idx_triagem_exec_edital ON public.triagem_ia_execucoes(edital_id);

ALTER TABLE public.triagem_ia_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam execucoes do tenant"
ON public.triagem_ia_execucoes FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
    )
);

CREATE POLICY "Avaliador le execucoes do tenant"
ON public.triagem_ia_execucoes FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'avaliador'
    )
);

-- 2. Resultados por projeto
CREATE TABLE public.triagem_ia_resultados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execucao_id UUID NOT NULL REFERENCES public.triagem_ia_execucoes(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    habilitacao_sugerida VARCHAR(50) CHECK (habilitacao_sugerida IN ('habilitado', 'inabilitado', 'pendencia')),
    habilitacao_motivo TEXT,
    docs_completos BOOLEAN DEFAULT false,
    docs_problemas JSONB DEFAULT '[]'::jsonb,
    irregularidades_flags JSONB DEFAULT '[]'::jsonb,
    similaridade_max DECIMAL(5,4) DEFAULT 0,
    projeto_similar_id UUID REFERENCES public.projetos(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_triagem_res_execucao ON public.triagem_ia_resultados(execucao_id);
CREATE INDEX idx_triagem_res_projeto ON public.triagem_ia_resultados(projeto_id);

ALTER TABLE public.triagem_ia_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam resultados do tenant"
ON public.triagem_ia_resultados FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
    )
);

CREATE POLICY "Avaliador le resultados de projetos atribuidos"
ON public.triagem_ia_resultados FOR SELECT
USING (
    projeto_id IN (
        SELECT projeto_id FROM public.avaliacoes
        WHERE avaliador_id = auth.uid()
    )
);

-- 3. Sugestões de nota por critério
CREATE TABLE public.triagem_ia_notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resultado_id UUID NOT NULL REFERENCES public.triagem_ia_resultados(id) ON DELETE CASCADE,
    criterio_id UUID NOT NULL REFERENCES public.criterios(id),
    nota_sugerida DECIMAL(5,2) NOT NULL,
    justificativa TEXT NOT NULL,
    confianca DECIMAL(3,2) DEFAULT 0.5 CHECK (confianca >= 0 AND confianca <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_triagem_notas_resultado ON public.triagem_ia_notas(resultado_id);
CREATE INDEX idx_triagem_notas_criterio ON public.triagem_ia_notas(criterio_id);

ALTER TABLE public.triagem_ia_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam notas do tenant"
ON public.triagem_ia_notas FOR ALL
USING (
    resultado_id IN (
        SELECT id FROM public.triagem_ia_resultados
        WHERE tenant_id IN (
            SELECT tenant_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
        )
    )
);

CREATE POLICY "Avaliador le notas de projetos atribuidos"
ON public.triagem_ia_notas FOR SELECT
USING (
    resultado_id IN (
        SELECT r.id FROM public.triagem_ia_resultados r
        JOIN public.avaliacoes a ON a.projeto_id = r.projeto_id
        WHERE a.avaliador_id = auth.uid()
    )
);
