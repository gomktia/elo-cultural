-- ============================================================================
-- MIGRATION: handle_new_user — resolve tenant_id from user_meta_data too
-- ============================================================================
-- Priority: raw_app_meta_data > raw_user_meta_data > first active tenant
-- This allows the signup page to pass tenant_id via user metadata
-- when the middleware resolves it from the domain hostname.
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- 1. Try app_metadata (set by admin/service role)
  _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;

  -- 2. Try user_metadata (set by signup form from domain cookie)
  IF _tenant_id IS NULL THEN
    _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  END IF;

  -- 3. Fallback to first active tenant
  IF _tenant_id IS NULL THEN
    SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'ativo' ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'No active tenant available for user signup';
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
    COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'proponente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
