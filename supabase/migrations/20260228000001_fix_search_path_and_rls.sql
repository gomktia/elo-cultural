-- ============================================================================
-- MIGRATION: Fix security warnings from Supabase Linter
-- ============================================================================
-- 1. Set search_path on all 11 functions (function_search_path_mutable)
-- 2. Fix profiles_insert_signup RLS policy (rls_policy_always_true)
-- ============================================================================


-- FIX 1: set_audit_fields
CREATE OR REPLACE FUNCTION public.set_audit_fields()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- FIX 2: uid_role
CREATE OR REPLACE FUNCTION public.uid_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE
SET search_path = public;

-- FIX 3: is_tenant_admin_or_gestor
CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_gestor()
RETURNS BOOLEAN AS $$
  SELECT public.uid_role() IN ('admin', 'gestor');
$$ LANGUAGE SQL STABLE
SET search_path = public;

-- FIX 4: uid_tenant
CREATE OR REPLACE FUNCTION public.uid_tenant()
RETURNS UUID AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE
SET search_path = public;

-- FIX 5: handle_new_user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
BEGIN
  _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;

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

-- FIX 6: update_profile_version
CREATE OR REPLACE FUNCTION update_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 7: bloquear_fases_expiradas
CREATE OR REPLACE FUNCTION bloquear_fases_expiradas()
RETURNS void AS $$
BEGIN
  UPDATE edital_fases
  SET bloqueada = true
  WHERE bloqueada = false
    AND data_fim IS NOT NULL
    AND data_fim < now();
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 8: calcular_pontuacao_total
CREATE OR REPLACE FUNCTION calcular_pontuacao_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE avaliacoes SET pontuacao_total = (
    SELECT SUM(ac.nota * c.peso) / NULLIF(SUM(c.peso), 0)
    FROM avaliacao_criterios ac
    JOIN criterios c ON c.id = ac.criterio_id
    WHERE ac.avaliacao_id = NEW.avaliacao_id
  ) WHERE id = NEW.avaliacao_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 9: validar_prazo_inscricao
CREATE OR REPLACE FUNCTION validar_prazo_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  v_fim_inscricao TIMESTAMPTZ;
  v_status_edital fase_edital;
BEGIN
  SELECT fim_inscricao, status INTO v_fim_inscricao, v_status_edital
  FROM public.editais
  WHERE id = NEW.edital_id;

  IF v_status_edital != 'inscricao' THEN
    RAISE EXCEPTION 'HTTP 403 Forbidden: O edital nao se encontra na fase de inscricoes abertas. Fase atual: %', v_status_edital;
  END IF;

  IF now() > v_fim_inscricao THEN
    RAISE EXCEPTION 'HTTP 403 Forbidden: Prazo de inscricao encerrado em %.', v_fim_inscricao;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 10: update_tenant_version
CREATE OR REPLACE FUNCTION update_tenant_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- FIX 11: audit_mudanca_status_edital
CREATE OR REPLACE FUNCTION audit_mudanca_status_edital()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.logs_auditoria(
      tenant_id,
      usuario_id,
      acao,
      tabela_afetada,
      registro_id,
      dados_antigos,
      dados_novos,
      ip_address
    )
    VALUES(
      NEW.tenant_id,
      NEW.created_by,
      'MUDANCA DE FASE EDITAL',
      'editais',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      current_setting('request.headers', true)::json->>'x-forwarded-for'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;


-- FIX 12: profiles_insert_signup — restringir WITH CHECK
DROP POLICY IF EXISTS "profiles_insert_signup" ON profiles;

CREATE POLICY "profiles_insert_signup"
ON profiles FOR INSERT
WITH CHECK (id = auth.uid());
