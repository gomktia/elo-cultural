-- ============================================================================
-- MIGRATION: Correção de Vulnerabilidades RLS (V-01 a V-06)
-- ============================================================================
-- V-01 [CRÍTICA]: uid_tenant() retorna UUID zero em vez de NULL
-- V-02 [ALTA]:    Avaliacoes — branch avaliador sem isolamento de tenant
-- V-03 [ALTA]:    Recursos — branch proponente sem isolamento de tenant
-- V-04 [MÉDIA]:   Publicacoes — USING(true) vaza dados cross-tenant
-- V-05 [MÉDIA]:   Projetos — sem policy INSERT explícita com tenant check
-- V-06 [BAIXA]:   edital_fases — referência auth.uid_tenant() inexistente
-- GERAL:          Padronizar TODAS as policies para public.uid_tenant()
--
-- NOTA: NÃO usa BEGIN/COMMIT — Supabase CLI auto-wraps migrations em transação.
-- ============================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 0: Limpar TODAS as policies existentes das tabelas afetadas
-- Usa SQL dinâmico para ser resiliente contra policies criadas manualmente
-- no dashboard Supabase ou via SQL fora das migrations.
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DO $$
DECLARE
  _tbl TEXT;
  _pol RECORD;
BEGIN
  -- Lista de TODAS as tabelas que terão policies recriadas do zero
  -- (exceto tenants, que usa auth.jwt() diretamente e está correta)
  FOR _tbl IN
    SELECT unnest(ARRAY[
      'editais', 'criterios', 'logs_auditoria',
      'projetos', 'profiles',
      'edital_fases', 'projeto_documentos',
      'avaliacoes', 'avaliacao_criterios',
      'recursos', 'recurso_anexos',
      'publicacoes'
    ])
  LOOP
    -- Drop CADA policy existente nessa tabela, independente do nome
    FOR _pol IN
      SELECT policyname
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = _tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
      RAISE NOTICE 'Dropped policy % on %', _pol.policyname, _tbl;
    END LOOP;
  END LOOP;
END;
$$;


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 1: V-01 [CRÍTICA] — uid_tenant() retorna NULL em vez de UUID zero
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- ANTES: COALESCE(..., '00000000-0000-0000-0000-000000000000')
-- RISCO: Usuário sem tenant_id no JWT fazia match com qualquer row que tivesse
--        tenant_id = '00000000...' — condição que poderia existir por erro.
-- DEPOIS: Retorna NULL. tenant_id = NULL é sempre FALSE em SQL 3-valued logic.

CREATE OR REPLACE FUNCTION public.uid_tenant()
RETURNS UUID AS $$
  SELECT NULLIF(
    (current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id'),
    ''
  )::UUID;
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.uid_tenant() IS
  'Extrai tenant_id do JWT (formato PostgREST v12+). Retorna NULL quando ausente, '
  'garantindo que tenant_id = uid_tenant() seja FALSE por padrão.';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 2: Funções auxiliares para centralizar leitura de JWT
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.uid_role()
RETURNS TEXT AS $$
  SELECT current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.uid_role() IS
  'Extrai role do JWT app_metadata (formato PostgREST v12+). Retorna NULL quando ausente.';

CREATE OR REPLACE FUNCTION public.is_tenant_admin_or_gestor()
RETURNS BOOLEAN AS $$
  SELECT public.uid_role() IN ('admin', 'gestor');
$$ LANGUAGE SQL STABLE;

COMMENT ON FUNCTION public.is_tenant_admin_or_gestor() IS
  'Retorna TRUE se o usuário autenticado é admin ou gestor (via JWT).';


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- PASSO 3: Recriar TODAS as policies — editais
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "editais_select_tenant"
ON editais FOR SELECT
USING (tenant_id = public.uid_tenant());

CREATE POLICY "editais_insert_admin"
ON editais FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "editais_update_admin"
ON editais FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "editais_delete_admin"
ON editais FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- criterios
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "criterios_select_tenant"
ON criterios FOR SELECT
USING (tenant_id = public.uid_tenant());

CREATE POLICY "criterios_insert_admin"
ON criterios FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "criterios_update_admin"
ON criterios FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "criterios_delete_admin"
ON criterios FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- logs_auditoria
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "logs_select_admin"
ON logs_auditoria FOR SELECT
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "logs_insert_system"
ON logs_auditoria FOR INSERT
WITH CHECK (tenant_id = public.uid_tenant());


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- V-05: projetos — policies separadas por operação
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "projetos_select_tenant"
ON projetos FOR SELECT
USING (tenant_id = public.uid_tenant());

CREATE POLICY "projetos_insert_proponente"
ON projetos FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND proponente_id = auth.uid()
);

CREATE POLICY "projetos_update_admin"
ON projetos FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "projetos_delete_admin"
ON projetos FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- profiles — mantém RLS habilitado, recria policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Qualquer user do tenant pode ler perfis do tenant
CREATE POLICY "profiles_select_tenant"
ON profiles FOR SELECT
USING (tenant_id = public.uid_tenant());

-- User edita apenas seu próprio perfil (com tenant check)
CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (id = auth.uid() AND tenant_id = public.uid_tenant());

-- Admin gerencia todos os perfis do tenant
CREATE POLICY "profiles_admin_all"
ON profiles FOR ALL
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);

-- Signup trigger (SECURITY DEFINER) precisa inserir perfis
CREATE POLICY "profiles_insert_signup"
ON profiles FOR INSERT
WITH CHECK (true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- V-06: edital_fases — schema fix + granular policies
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "edital_fases_select"
ON edital_fases FOR SELECT
USING (
  edital_id IN (SELECT id FROM editais WHERE tenant_id = public.uid_tenant())
);

CREATE POLICY "edital_fases_insert_admin"
ON edital_fases FOR INSERT
WITH CHECK (
  edital_id IN (SELECT id FROM editais WHERE tenant_id = public.uid_tenant())
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "edital_fases_update_admin"
ON edital_fases FOR UPDATE
USING (
  edital_id IN (SELECT id FROM editais WHERE tenant_id = public.uid_tenant())
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "edital_fases_delete_admin"
ON edital_fases FOR DELETE
USING (
  edital_id IN (SELECT id FROM editais WHERE tenant_id = public.uid_tenant())
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- projeto_documentos
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "projeto_docs_select_tenant"
ON projeto_documentos FOR SELECT
USING (tenant_id = public.uid_tenant());

CREATE POLICY "projeto_docs_insert"
ON projeto_documentos FOR INSERT
WITH CHECK (tenant_id = public.uid_tenant());

CREATE POLICY "projeto_docs_update_admin"
ON projeto_documentos FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "projeto_docs_delete_admin"
ON projeto_documentos FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- V-02: avaliacoes — tenant_id obrigatório em TODAS as branches
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "avaliacoes_select"
ON avaliacoes FOR SELECT
USING (
  tenant_id = public.uid_tenant()
  AND (
    avaliador_id = auth.uid()
    OR public.is_tenant_admin_or_gestor()
  )
);

CREATE POLICY "avaliacoes_insert_admin"
ON avaliacoes FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "avaliacoes_update_avaliador"
ON avaliacoes FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND avaliador_id = auth.uid()
  AND status = 'em_andamento'
);

CREATE POLICY "avaliacoes_update_admin"
ON avaliacoes FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "avaliacoes_delete_admin"
ON avaliacoes FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- avaliacao_criterios — tenant enforcement via subquery
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "avaliacao_criterios_select"
ON avaliacao_criterios FOR SELECT
USING (
  avaliacao_id IN (
    SELECT id FROM avaliacoes
    WHERE tenant_id = public.uid_tenant()
      AND (avaliador_id = auth.uid() OR public.is_tenant_admin_or_gestor())
  )
);

CREATE POLICY "avaliacao_criterios_insert"
ON avaliacao_criterios FOR INSERT
WITH CHECK (
  avaliacao_id IN (
    SELECT id FROM avaliacoes
    WHERE tenant_id = public.uid_tenant()
      AND avaliador_id = auth.uid()
      AND status = 'em_andamento'
  )
);

CREATE POLICY "avaliacao_criterios_update"
ON avaliacao_criterios FOR UPDATE
USING (
  avaliacao_id IN (
    SELECT id FROM avaliacoes
    WHERE tenant_id = public.uid_tenant()
      AND avaliador_id = auth.uid()
      AND status = 'em_andamento'
  )
);

CREATE POLICY "avaliacao_criterios_delete_admin"
ON avaliacao_criterios FOR DELETE
USING (
  avaliacao_id IN (
    SELECT id FROM avaliacoes
    WHERE tenant_id = public.uid_tenant()
      AND public.uid_role() = 'admin'
  )
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- V-03: recursos — tenant_id obrigatório em TODAS as branches
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "recursos_select"
ON recursos FOR SELECT
USING (
  tenant_id = public.uid_tenant()
  AND (
    proponente_id = auth.uid()
    OR public.is_tenant_admin_or_gestor()
  )
);

CREATE POLICY "recursos_insert_proponente"
ON recursos FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND proponente_id = auth.uid()
);

CREATE POLICY "recursos_update_admin"
ON recursos FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "recursos_delete_admin"
ON recursos FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- recurso_anexos — tenant enforcement via subquery
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "recurso_anexos_select"
ON recurso_anexos FOR SELECT
USING (
  recurso_id IN (
    SELECT id FROM recursos
    WHERE tenant_id = public.uid_tenant()
      AND (proponente_id = auth.uid() OR public.is_tenant_admin_or_gestor())
  )
);

CREATE POLICY "recurso_anexos_insert"
ON recurso_anexos FOR INSERT
WITH CHECK (
  recurso_id IN (
    SELECT id FROM recursos
    WHERE tenant_id = public.uid_tenant()
      AND proponente_id = auth.uid()
  )
);

CREATE POLICY "recurso_anexos_delete_admin"
ON recurso_anexos FOR DELETE
USING (
  recurso_id IN (
    SELECT id FROM recursos
    WHERE tenant_id = public.uid_tenant()
      AND public.uid_role() = 'admin'
  )
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- V-04: publicacoes — isolamento por tenant + transparência pública (LAI)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Autenticados: isolamento por tenant
CREATE POLICY "publicacoes_select_tenant"
ON publicacoes FOR SELECT
USING (tenant_id = public.uid_tenant());

-- Anônimos: acesso irrestrito para leitura (transparência governamental)
-- Lei 12.527/2011 (LAI) + Lei 14.129/2021 (Governo Digital)
CREATE POLICY "publicacoes_select_transparencia"
ON publicacoes FOR SELECT
USING (auth.uid() IS NULL);

CREATE POLICY "publicacoes_insert_admin"
ON publicacoes FOR INSERT
WITH CHECK (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "publicacoes_update_admin"
ON publicacoes FOR UPDATE
USING (
  tenant_id = public.uid_tenant()
  AND public.is_tenant_admin_or_gestor()
);

CREATE POLICY "publicacoes_delete_admin"
ON publicacoes FOR DELETE
USING (
  tenant_id = public.uid_tenant()
  AND public.uid_role() = 'admin'
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICAÇÃO PÓS-MIGRATION
-- Execute manualmente para confirmar contagem esperada:
--
-- SELECT tablename, count(*) as policies
-- FROM pg_policies WHERE schemaname = 'public'
-- GROUP BY tablename ORDER BY tablename;
--
-- Resultado esperado:
-- | tablename            | policies |
-- |----------------------|----------|
-- | avaliacao_criterios  | 4        |
-- | avaliacoes           | 5        |
-- | criterios            | 4        |
-- | editais              | 4        |
-- | edital_fases         | 4        |
-- | logs_auditoria       | 2        |
-- | profiles             | 4        |
-- | projeto_documentos   | 4        |
-- | projetos             | 4        |
-- | publicacoes          | 5        |
-- | recurso_anexos       | 3        |
-- | recursos             | 4        |
-- | tenants              | 3        | (inalterado)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
