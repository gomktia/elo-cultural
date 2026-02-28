-- Migration: Módulo de Prestação de Contas
-- Data: 2026-02-26

-- 1. Criar tabela prestacoes_contas
CREATE TABLE public.prestacoes_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),
    proponente_id UUID NOT NULL REFERENCES auth.users(id),
    valor_total_executado DECIMAL(12,2),
    resumo_atividades TEXT,
    observacoes TEXT,
    status VARCHAR(50) DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviada', 'em_analise', 'aprovada', 'reprovada', 'com_pendencias')),
    parecer_gestor TEXT,
    analisado_por UUID REFERENCES auth.users(id),
    data_envio TIMESTAMP WITH TIME ZONE,
    data_analise TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Índices
CREATE INDEX idx_prestacoes_tenant ON public.prestacoes_contas(tenant_id);
CREATE INDEX idx_prestacoes_projeto ON public.prestacoes_contas(projeto_id);
CREATE INDEX idx_prestacoes_proponente ON public.prestacoes_contas(proponente_id);
CREATE INDEX idx_prestacoes_status ON public.prestacoes_contas(status);

-- 3. RLS
ALTER TABLE public.prestacoes_contas ENABLE ROW LEVEL SECURITY;

-- Proponente vê/edita apenas suas próprias prestações
CREATE POLICY "Proponente acessa próprias prestações"
ON public.prestacoes_contas
FOR ALL
USING (proponente_id = auth.uid())
WITH CHECK (proponente_id = auth.uid());

-- Gestor/Admin vê todas do tenant
CREATE POLICY "Gestor e Admin acessam prestações do tenant"
ON public.prestacoes_contas
FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
    )
);

-- 4. Expandir tipo de documento (adicionar novos tipos ao check constraint)
-- Nota: Se o constraint existir, precisa ser recriado
ALTER TABLE public.projeto_documentos DROP CONSTRAINT IF EXISTS projeto_documentos_tipo_check;
ALTER TABLE public.projeto_documentos ADD CONSTRAINT projeto_documentos_tipo_check
    CHECK (tipo IN ('identidade', 'proposta', 'orcamento', 'complementar', 'comprovante_despesa', 'relatorio_atividade', 'prestacao_contas'));
