-- ============================================================================
-- MIGRATION: Requerimentos durante Execução
-- Data: 2026-03-07
-- Permite proponentes solicitar alterações durante a execução do projeto
-- ============================================================================

-- 1. Tabela de Requerimentos
CREATE TABLE public.requerimentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),
    termo_id UUID REFERENCES public.termos_execucao(id),
    proponente_id UUID NOT NULL REFERENCES auth.users(id),

    -- Tipo do requerimento
    tipo TEXT NOT NULL CHECK (tipo IN (
        'prorrogacao',
        'alteracao_equipe',
        'remanejamento_recursos',
        'alteracao_cronograma',
        'substituicao_item',
        'outros'
    )),

    -- Dados do requerimento
    justificativa TEXT NOT NULL,
    valor_envolvido DECIMAL(12,2),
    documentos JSONB DEFAULT '[]'::jsonb,

    -- Status e fluxo
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'em_analise',
        'diligencia',
        'respondida',
        'deferido',
        'indeferido'
    )),

    -- Diligência (max 2)
    diligencia_count INTEGER DEFAULT 0,
    diligencia_texto TEXT,
    diligencia_resposta TEXT,
    diligencia_em TIMESTAMPTZ,
    diligencia_respondida_em TIMESTAMPTZ,

    -- Decisão
    decisao_texto TEXT,
    decidido_por UUID REFERENCES auth.users(id),
    decidido_em TIMESTAMPTZ,

    -- Metadados
    protocolo TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Índices
CREATE INDEX idx_requerimentos_tenant ON public.requerimentos(tenant_id);
CREATE INDEX idx_requerimentos_projeto ON public.requerimentos(projeto_id);
CREATE INDEX idx_requerimentos_proponente ON public.requerimentos(proponente_id);
CREATE INDEX idx_requerimentos_status ON public.requerimentos(status);
CREATE INDEX idx_requerimentos_tipo ON public.requerimentos(tipo);

-- 3. RLS
ALTER TABLE public.requerimentos ENABLE ROW LEVEL SECURITY;

-- Proponente vê apenas os seus
CREATE POLICY "proponente_select_requerimentos"
ON public.requerimentos FOR SELECT
USING (proponente_id = auth.uid());

-- Proponente pode criar e atualizar (responder diligência)
CREATE POLICY "proponente_insert_requerimentos"
ON public.requerimentos FOR INSERT
WITH CHECK (proponente_id = auth.uid());

CREATE POLICY "proponente_update_requerimentos"
ON public.requerimentos FOR UPDATE
USING (proponente_id = auth.uid())
WITH CHECK (proponente_id = auth.uid());

-- Staff acessa do tenant
CREATE POLICY "staff_all_requerimentos"
ON public.requerimentos FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);

-- 4. Trigger de auditoria
CREATE TRIGGER set_requerimentos_audit
    BEFORE UPDATE ON public.requerimentos
    FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
