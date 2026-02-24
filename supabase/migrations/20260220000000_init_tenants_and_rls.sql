-- 1. Habilita extensões nativas do Postgres para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da Tabela Tenants
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    dominio VARCHAR(255) UNIQUE NOT NULL, -- O domínio que o Middleware Next.js vai procurar
    logo_url TEXT,
    tema_cores JSONB DEFAULT '{"primary": "#1A56DB", "secondary": "#F3F4F6"}', -- Base para o CSS Tailwind
    status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, suspenso
    
    -- Campos Obrigatórios de Governança
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    version INTEGER DEFAULT 1
);

-- Indexação essencial para o Middleware Next.js encontrar a prefeitura rapidamente
CREATE INDEX idx_tenants_dominio ON public.tenants(dominio);

-- 3. Trigger para manter a versão de controle de concorrência e o campo updated_at
CREATE OR REPLACE FUNCTION update_tenant_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_version
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenant_version();

-- 4. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: Leitura Pública
CREATE POLICY "Leitura pública permitida para tenants ativos" 
ON public.tenants
FOR SELECT 
USING (status = 'ativo');

-- POLÍTICA 2: Inserção no Banco
CREATE POLICY "Apenas Super Admins podem cadastrar Tenants" 
ON public.tenants
FOR INSERT
WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'super_admin' = 'true'
);

-- POLÍTICA 3: Atualização Segura pelo Gestor da Prefeitura
CREATE POLICY "Gestores podem editar os dados de seu próprio Tenant" 
ON public.tenants
FOR UPDATE 
USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);
