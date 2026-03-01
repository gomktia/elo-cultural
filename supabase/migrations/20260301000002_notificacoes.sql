-- Migration: Sistema de Notificacoes In-App
-- Data: 2026-03-01

-- 1. Criar tabela notificacoes
CREATE TABLE public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    usuario_id UUID NOT NULL REFERENCES auth.users(id),
    tipo TEXT NOT NULL CHECK (tipo IN (
        'projeto_status',
        'habilitacao_resultado',
        'recurso_decisao',
        'avaliacao_atribuida',
        'edital_fase',
        'prestacao_status',
        'sistema'
    )),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    lida BOOLEAN NOT NULL DEFAULT false,
    link TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Indices
CREATE INDEX idx_notificacoes_tenant ON public.notificacoes(tenant_id);
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_nao_lidas ON public.notificacoes(usuario_id, lida) WHERE lida = false;
CREATE INDEX idx_notificacoes_created ON public.notificacoes(created_at DESC);

-- 3. RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Usuario ve apenas suas proprias notificacoes
CREATE POLICY "Usuario le proprias notificacoes"
ON public.notificacoes
FOR SELECT
USING (usuario_id = auth.uid());

-- Usuario marca apenas suas proprias notificacoes como lidas
CREATE POLICY "Usuario atualiza proprias notificacoes"
ON public.notificacoes
FOR UPDATE
USING (usuario_id = auth.uid())
WITH CHECK (usuario_id = auth.uid());

-- Insert via service role (sem policy de INSERT para anon/authenticated)
-- Notificacoes sao criadas apenas pelo backend com service role
