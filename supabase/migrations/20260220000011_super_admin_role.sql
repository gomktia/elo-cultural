-- ============================================================================
-- Migration: Adiciona role super_admin (dono da plataforma)
-- Super admin tem acesso cross-tenant para suporte e manutencao
-- ============================================================================

-- 1. Adicionar super_admin ao enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- 2. RLS: super_admin pode ler TODOS os tenants (cross-tenant)
CREATE POLICY "super_admin_select_all_tenants"
ON tenants FOR SELECT
USING (public.uid_role() = 'super_admin');

CREATE POLICY "super_admin_manage_tenants"
ON tenants FOR ALL
USING (public.uid_role() = 'super_admin');

-- 3. Super admin pode gerenciar todos os profiles (cross-tenant)
CREATE POLICY "super_admin_all_profiles"
ON profiles FOR ALL
USING (public.uid_role() = 'super_admin');

-- 4. Super admin pode ler todos os editais (cross-tenant)
CREATE POLICY "super_admin_all_editais"
ON editais FOR SELECT
USING (public.uid_role() = 'super_admin');

-- 5. Super admin pode ler logs de auditoria cross-tenant
CREATE POLICY "super_admin_all_logs"
ON logs_auditoria FOR SELECT
USING (public.uid_role() = 'super_admin');
