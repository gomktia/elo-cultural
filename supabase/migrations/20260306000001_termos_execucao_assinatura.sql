-- ============================================================================
-- MIGRATION: Termo de Execucao Cultural + Assinatura Digital
-- Data: 2026-03-06
-- Baseado nos documentos MIRASSOL (ANEXO X - 14 clausulas)
-- ============================================================================

-- 1. Tabela principal: Termos de Execucao Cultural
CREATE TABLE public.termos_execucao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),
    proponente_id UUID NOT NULL REFERENCES auth.users(id),

    -- Identificacao
    numero_termo TEXT NOT NULL,
    edital_referencia TEXT,

    -- Valores
    valor_total DECIMAL(12,2) NOT NULL,
    valor_extenso TEXT,

    -- Dados bancarios do agente cultural
    banco TEXT,
    agencia TEXT,
    conta_corrente TEXT,
    tipo_conta TEXT DEFAULT 'corrente' CHECK (tipo_conta IN ('corrente', 'poupanca')),

    -- Vigencia
    vigencia_inicio DATE,
    vigencia_fim DATE,
    vigencia_meses INTEGER DEFAULT 7,
    prorrogacao_meses INTEGER DEFAULT 2,

    -- Status do termo
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
        'rascunho',
        'pendente_assinatura_proponente',
        'pendente_assinatura_gestor',
        'assinado',
        'vigente',
        'encerrado',
        'rescindido'
    )),

    -- Prazo para assinatura
    prazo_assinatura_dias INTEGER DEFAULT 2,
    data_envio_para_assinatura TIMESTAMPTZ,

    -- PDF gerado
    pdf_storage_path TEXT,
    pdf_assinado_storage_path TEXT,

    -- Metadados
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id)
);

-- 2. Tabela de assinaturas digitais (reutilizavel para qualquer documento)
CREATE TABLE public.assinaturas_digitais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),

    -- Documento assinado (polimorfismo via tipo + id)
    documento_tipo TEXT NOT NULL CHECK (documento_tipo IN (
        'termo_execucao',
        'decisao_recurso',
        'prestacao_contas',
        'publicacao'
    )),
    documento_id UUID NOT NULL,

    -- Quem assinou
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    nome_signatario TEXT NOT NULL,
    cpf_signatario TEXT,
    papel_signatario TEXT NOT NULL CHECK (papel_signatario IN (
        'proponente',
        'gestor',
        'secretario',
        'parecerista',
        'coordenador'
    )),

    -- Metodo de assinatura
    metodo TEXT NOT NULL DEFAULT 'simples' CHECK (metodo IN ('simples', 'govbr')),

    -- Dados de verificacao (assinatura simples)
    hash_documento TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,

    -- Dados GOV.BR (quando metodo = govbr)
    govbr_certificado TEXT,
    govbr_transaction_id TEXT,

    -- Timestamp
    assinado_em TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de aditivos ao termo
CREATE TABLE public.termos_aditivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    termo_id UUID NOT NULL REFERENCES public.termos_execucao(id) ON DELETE CASCADE,

    numero_aditivo INTEGER NOT NULL DEFAULT 1,
    tipo TEXT NOT NULL CHECK (tipo IN (
        'prorrogacao',
        'alteracao_valor',
        'alteracao_objeto',
        'alteracao_equipe',
        'outro'
    )),

    justificativa TEXT NOT NULL,
    valor_alterado DECIMAL(12,2),
    nova_vigencia_fim DATE,

    requer_aprovacao BOOLEAN DEFAULT false,
    aprovado_por UUID REFERENCES auth.users(id),
    aprovado_em TIMESTAMPTZ,

    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'aprovado',
        'rejeitado'
    )),

    pdf_storage_path TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_by UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id)
);

-- 4. Tabela de pagamentos
CREATE TABLE public.pagamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    termo_id UUID NOT NULL REFERENCES public.termos_execucao(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),

    numero_parcela INTEGER DEFAULT 1,
    valor DECIMAL(12,2) NOT NULL,
    data_pagamento DATE,
    comprovante_storage_path TEXT,

    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
        'pendente',
        'liberado',
        'pago',
        'cancelado'
    )),

    observacoes TEXT,
    registrado_por UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Indices
CREATE INDEX idx_termos_execucao_tenant ON public.termos_execucao(tenant_id);
CREATE INDEX idx_termos_execucao_projeto ON public.termos_execucao(projeto_id);
CREATE INDEX idx_termos_execucao_proponente ON public.termos_execucao(proponente_id);
CREATE INDEX idx_termos_execucao_status ON public.termos_execucao(status);
CREATE UNIQUE INDEX idx_termos_execucao_numero ON public.termos_execucao(tenant_id, numero_termo);

CREATE INDEX idx_assinaturas_documento ON public.assinaturas_digitais(documento_tipo, documento_id);
CREATE INDEX idx_assinaturas_usuario ON public.assinaturas_digitais(usuario_id);
CREATE INDEX idx_assinaturas_tenant ON public.assinaturas_digitais(tenant_id);

CREATE INDEX idx_termos_aditivos_termo ON public.termos_aditivos(termo_id);
CREATE INDEX idx_termos_aditivos_tenant ON public.termos_aditivos(tenant_id);

CREATE INDEX idx_pagamentos_termo ON public.pagamentos(termo_id);
CREATE INDEX idx_pagamentos_projeto ON public.pagamentos(projeto_id);
CREATE INDEX idx_pagamentos_tenant ON public.pagamentos(tenant_id);

-- 6. RLS
ALTER TABLE public.termos_execucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas_digitais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.termos_aditivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Termos: proponente ve apenas os seus
CREATE POLICY "proponente_select_termos"
ON public.termos_execucao FOR SELECT
USING (proponente_id = auth.uid());

CREATE POLICY "proponente_update_termos"
ON public.termos_execucao FOR UPDATE
USING (proponente_id = auth.uid())
WITH CHECK (proponente_id = auth.uid());

-- Termos: gestor/admin acessa todos do tenant
CREATE POLICY "staff_all_termos"
ON public.termos_execucao FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);

-- Termos: acesso publico para transparencia (LAI)
CREATE POLICY "public_select_termos"
ON public.termos_execucao FOR SELECT
USING (status IN ('assinado', 'vigente', 'encerrado'));

-- Assinaturas: usuario ve as suas
CREATE POLICY "usuario_select_assinaturas"
ON public.assinaturas_digitais FOR SELECT
USING (usuario_id = auth.uid());

-- Assinaturas: usuario cria a propria
CREATE POLICY "usuario_insert_assinaturas"
ON public.assinaturas_digitais FOR INSERT
WITH CHECK (usuario_id = auth.uid());

-- Assinaturas: staff ve do tenant
CREATE POLICY "staff_all_assinaturas"
ON public.assinaturas_digitais FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);

-- Aditivos: proponente ve dos seus termos
CREATE POLICY "proponente_select_aditivos"
ON public.termos_aditivos FOR SELECT
USING (
    termo_id IN (
        SELECT t.id FROM public.termos_execucao t
        WHERE t.proponente_id = auth.uid()
    )
);

-- Aditivos: staff acessa do tenant
CREATE POLICY "staff_all_aditivos"
ON public.termos_aditivos FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);

-- Pagamentos: proponente ve dos seus projetos
CREATE POLICY "proponente_select_pagamentos"
ON public.pagamentos FOR SELECT
USING (
    projeto_id IN (
        SELECT pr.id FROM public.projetos pr
        WHERE pr.proponente_id = auth.uid()
    )
);

-- Pagamentos: staff acessa do tenant
CREATE POLICY "staff_all_pagamentos"
ON public.pagamentos FOR ALL
USING (
    tenant_id IN (
        SELECT p.tenant_id FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('gestor', 'admin', 'super_admin')
    )
);

-- Pagamentos: transparencia publica
CREATE POLICY "public_select_pagamentos"
ON public.pagamentos FOR SELECT
USING (status IN ('liberado', 'pago'));

-- 7. Triggers de auditoria
CREATE TRIGGER set_termos_execucao_audit
    BEFORE UPDATE ON public.termos_execucao
    FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER set_termos_aditivos_audit
    BEFORE UPDATE ON public.termos_aditivos
    FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();

CREATE TRIGGER set_pagamentos_audit
    BEFORE UPDATE ON public.pagamentos
    FOR EACH ROW EXECUTE FUNCTION public.set_audit_fields();
