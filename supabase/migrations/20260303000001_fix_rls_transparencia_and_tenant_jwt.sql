-- ============================================================================
-- MIGRATION: Fix RLS transparência para usuários autenticados + tenant no JWT
-- ============================================================================
-- PROBLEMA 1: Políticas *_select_transparencia só funcionam para anônimos
--   (auth.uid() IS NULL). Um proponente logado cujo JWT não carrega tenant_id
--   no app_metadata não vê nenhum edital.
--
-- PROBLEMA 2: handle_new_user cria o profile com tenant_id mas NÃO propaga
--   o tenant_id para auth.users.raw_app_meta_data, então uid_tenant() retorna
--   NULL para esses usuários e todas as policies de tenant falham.
--
-- CORREÇÃO 1: Recriar as políticas de transparência SEM a restrição
--   auth.uid() IS NULL. Editais, critérios, projetos e perfis públicos são
--   documentos de acesso público (LAI - Lei 12.527/2011) e devem ser legíveis
--   por qualquer pessoa, autenticada ou não.
--
-- CORREÇÃO 2: Atualizar handle_new_user para propagar tenant_id e role
--   para raw_app_meta_data, garantindo que uid_tenant() funcione no JWT.
-- ============================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 1: Recriar políticas de transparência sem restrição de auth.uid()
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Editais
DROP POLICY IF EXISTS "editais_select_transparencia" ON editais;
CREATE POLICY "editais_select_transparencia"
ON editais FOR SELECT
USING (active = true);

-- Critérios
DROP POLICY IF EXISTS "criterios_select_transparencia" ON criterios;
CREATE POLICY "criterios_select_transparencia"
ON criterios FOR SELECT
USING (
  edital_id IN (SELECT id FROM editais WHERE active = true)
);

-- Projetos
DROP POLICY IF EXISTS "projetos_select_transparencia" ON projetos;
CREATE POLICY "projetos_select_transparencia"
ON projetos FOR SELECT
USING (
  edital_id IN (SELECT id FROM editais WHERE active = true)
);

-- Profiles (apenas proponentes ativos, para mapa e indicadores)
DROP POLICY IF EXISTS "profiles_select_transparencia" ON profiles;
CREATE POLICY "profiles_select_transparencia"
ON profiles FOR SELECT
USING (role = 'proponente' AND active = true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 2: handle_new_user propaga tenant_id e role para app_metadata
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
  _role TEXT;
BEGIN
  -- 1. Resolver tenant_id: app_metadata > user_metadata > primeiro tenant ativo
  _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;

  IF _tenant_id IS NULL THEN
    _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  END IF;

  IF _tenant_id IS NULL THEN
    SELECT id INTO _tenant_id FROM public.tenants WHERE status = 'ativo' ORDER BY created_at ASC LIMIT 1;
  END IF;

  IF _tenant_id IS NULL THEN
    RAISE EXCEPTION 'No active tenant available for user signup';
  END IF;

  -- 2. Resolver role
  _role := COALESCE(NEW.raw_app_meta_data->>'role', 'proponente');

  -- 3. Criar profile
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

  -- 4. Propagar tenant_id e role para app_metadata (necessário para uid_tenant() no JWT)
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('tenant_id', _tenant_id::text, 'role', _role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
