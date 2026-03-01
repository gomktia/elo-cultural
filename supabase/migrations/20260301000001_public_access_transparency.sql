-- ============================================================================
-- MIGRATION: Acesso público anônimo para páginas de transparência
-- ============================================================================
-- Adiciona políticas SELECT para usuários anônimos (não autenticados) nas
-- tabelas consultadas pelas páginas públicas: editais, criterios, projetos,
-- profiles.
--
-- Segue o mesmo padrão de publicacoes_select_transparencia (LAI).
-- Anônimo: auth.uid() IS NULL → acesso de leitura
-- Autenticado: policies de tenant existentes continuam em vigor
--
-- Páginas afetadas:
--   /editais           → editais
--   /editais/[id]      → editais, criterios
--   /editais/[id]/resultados → editais, projetos
--   /indicadores       → editais, projetos, profiles
--   /mapa              → projetos, profiles
-- ============================================================================


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. EDITAIS: anônimo pode ler editais ativos
-- Lei 12.527/2011 (LAI) — editais são documentos públicos
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "editais_select_transparencia"
ON editais FOR SELECT
USING (auth.uid() IS NULL AND active = true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. CRITERIOS: anônimo pode ler critérios de editais ativos
-- Necessário para exibir regras de avaliação na página do edital
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "criterios_select_transparencia"
ON criterios FOR SELECT
USING (
  auth.uid() IS NULL
  AND edital_id IN (SELECT id FROM editais WHERE active = true)
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. PROJETOS: anônimo pode ler projetos de editais ativos
-- Necessário para: resultados (ranking), mapa (geolocalização),
-- indicadores (contagens e orçamento)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "projetos_select_transparencia"
ON projetos FOR SELECT
USING (
  auth.uid() IS NULL
  AND edital_id IN (SELECT id FROM editais WHERE active = true)
);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. PROFILES: anônimo pode ler perfis de proponentes ativos
-- Necessário para: mapa (município/estado via FK projetos→profiles),
-- indicadores (áreas de atuação)
-- Restrito a role='proponente' para não expor admin/gestor/avaliador
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE POLICY "profiles_select_transparencia"
ON profiles FOR SELECT
USING (auth.uid() IS NULL AND role = 'proponente' AND active = true);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- VERIFICAÇÃO PÓS-MIGRATION
-- Execute para confirmar que as novas policies foram criadas:
--
-- SELECT tablename, policyname
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND policyname LIKE '%transparencia%'
-- ORDER BY tablename;
--
-- Resultado esperado:
-- | tablename   | policyname                      |
-- |-------------|---------------------------------|
-- | criterios   | criterios_select_transparencia  |
-- | editais     | editais_select_transparencia    |
-- | profiles    | profiles_select_transparencia   |
-- | projetos    | projetos_select_transparencia   |
-- | publicacoes | publicacoes_select_transparencia| (já existente)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
