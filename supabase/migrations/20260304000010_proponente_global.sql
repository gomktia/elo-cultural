-- ============================================================================
-- MIGRATION: Proponente Global — tenant_id nullable + RLS + trigger update
-- ============================================================================
-- Proponentes become "global citizens" with tenant_id = NULL.
-- Staff roles (admin, gestor, avaliador) still require tenant_id.
-- New RLS policies allow global proponentes to:
--   - See active editais from any tenant
--   - Insert/select their own projects across tenants
--   - Read/update their own profile
-- ============================================================================

-- 1. Allow NULL tenant_id for proponentes
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Constraint: staff roles MUST have tenant_id
ALTER TABLE public.profiles ADD CONSTRAINT check_tenant_required_for_staff
  CHECK (role = 'proponente' OR tenant_id IS NOT NULL);

-- 3. Helper function: check if current user is a global proponente
CREATE OR REPLACE FUNCTION public.is_global_proponente()
RETURNS BOOLEAN AS $$
  SELECT public.uid_role() = 'proponente'
     AND public.uid_tenant() IS NULL;
$$ LANGUAGE SQL STABLE;

-- 4. RLS: Proponente global can SELECT their own projects (any tenant)
CREATE POLICY "projetos_select_proponente_global"
ON public.projetos FOR SELECT
USING (public.is_global_proponente() AND proponente_id = auth.uid());

-- 5. RLS: Proponente global can INSERT projects (tenant comes from edital)
CREATE POLICY "projetos_insert_proponente_global"
ON public.projetos FOR INSERT
WITH CHECK (
  public.is_global_proponente()
  AND proponente_id = auth.uid()
);

-- 6. RLS: Proponente global can see active editais from any tenant
CREATE POLICY "editais_select_proponente_global"
ON public.editais FOR SELECT
USING (public.is_global_proponente() AND active = true);

-- 7. RLS: Proponente global can read/update own profile
CREATE POLICY "profiles_select_own_global"
ON public.profiles FOR SELECT
USING (public.is_global_proponente() AND id = auth.uid());

CREATE POLICY "profiles_update_own_global"
ON public.profiles FOR UPDATE
USING (public.is_global_proponente() AND id = auth.uid());

-- 8. RLS: Proponente global can see active tenants (for unified dashboard)
CREATE POLICY "tenants_select_proponente_global"
ON public.tenants FOR SELECT
USING (public.is_global_proponente() AND status = 'ativo');

-- 9. RLS: Proponente global can read edital categories (for inscricao)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'edital_categorias') THEN
    EXECUTE 'CREATE POLICY "edital_categorias_select_proponente_global"
      ON public.edital_categorias FOR SELECT
      USING (public.is_global_proponente())';
  END IF;
END $$;

-- 10. Update handle_new_user trigger: proponente gets NULL tenant_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
  _role TEXT;
BEGIN
  -- Determine role (default: proponente)
  _role := COALESCE(NEW.raw_app_meta_data->>'role', 'proponente');

  -- For proponentes: tenant_id is always NULL (global citizen)
  IF _role = 'proponente' THEN
    _tenant_id := NULL;
  ELSE
    -- Staff: resolve tenant_id (required)
    _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;
    IF _tenant_id IS NULL THEN
      _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
    END IF;
    IF _tenant_id IS NULL THEN
      RAISE EXCEPTION 'Staff signup requires a tenant_id';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, consentimento_lgpd, data_consentimento, role)
  VALUES (
    NEW.id,
    _tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'cpf_cnpj',
    NEW.raw_user_meta_data->>'telefone',
    COALESCE((NEW.raw_user_meta_data->>'consentimento_lgpd')::BOOLEAN, false),
    CASE WHEN (NEW.raw_user_meta_data->>'consentimento_lgpd')::BOOLEAN = true THEN now() ELSE NULL END,
    _role::user_role
  );

  -- Propagate to JWT app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', _tenant_id::text,
    'role', _role
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
