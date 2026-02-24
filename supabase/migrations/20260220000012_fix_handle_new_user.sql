-- Fix: handle_new_user() fails when tenant_id is not in app_metadata
-- This causes "Database error saving new user" on signup
-- Also: include cpf_cnpj, telefone, consentimento_lgpd from user_meta_data

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  -- Try to get tenant_id from app_metadata first
  _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;

  -- Fallback: if tenant_id is not set, use the first active tenant
  IF _tenant_id IS NULL THEN
    SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'ativo' ORDER BY created_at ASC LIMIT 1;
  END IF;

  -- If still null, we cannot create a profile
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
