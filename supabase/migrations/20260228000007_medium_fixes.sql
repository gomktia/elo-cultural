-- Medium priority fixes from production audit
-- Date: 2026-02-28

-- M1: Remove duplicate FK on projetos.tenant_id
-- (fk_projetos_tenant and projetos_tenant_id_fkey both pointed to tenants(id))
ALTER TABLE public.projetos DROP CONSTRAINT IF EXISTS fk_projetos_tenant;

-- M5: Add CHECK constraints on status columns
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('proponente', 'avaliador', 'gestor', 'admin', 'super_admin'));

ALTER TABLE public.projetos
  ADD CONSTRAINT projetos_status_habilitacao_check
  CHECK (status_habilitacao IN ('pendente', 'em_analise', 'habilitado', 'inabilitado'));

ALTER TABLE public.tenants
  ADD CONSTRAINT tenants_status_check
  CHECK (status IN ('ativo', 'inativo', 'suspenso'));
