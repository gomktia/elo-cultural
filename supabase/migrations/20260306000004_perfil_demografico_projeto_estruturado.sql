-- ============================================================================
-- MIGRATION: Perfil Demografico Completo + Projeto Estruturado
-- Data: 2026-03-06
-- Fase 1.1 (Perfil Proponente) + Fase 1.4 (Formulario Inscricao)
-- ============================================================================

-- ============================================================
-- PARTE 1: Campos demograficos no perfil (Fase 1.1)
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS tipo_pessoa TEXT DEFAULT 'fisica'
    CHECK (tipo_pessoa IN ('fisica', 'juridica', 'coletivo_sem_cnpj')),
  ADD COLUMN IF NOT EXISTS nome_artistico TEXT,
  ADD COLUMN IF NOT EXISTS data_nascimento DATE,
  ADD COLUMN IF NOT EXISTS comunidade_tradicional TEXT DEFAULT 'nenhuma'
    CHECK (comunidade_tradicional IN (
      'nenhuma', 'extrativistas', 'ribeirinhas', 'rurais', 'indigenas',
      'ciganos', 'pescadores', 'terreiro', 'quilombolas', 'outra'
    )),
  ADD COLUMN IF NOT EXISTS tipo_deficiencia TEXT
    CHECK (tipo_deficiencia IS NULL OR tipo_deficiencia IN (
      'auditiva', 'fisica', 'intelectual', 'multipla', 'visual', 'outra'
    )),
  ADD COLUMN IF NOT EXISTS escolaridade TEXT
    CHECK (escolaridade IS NULL OR escolaridade IN (
      'sem_educacao_formal', 'fundamental_incompleto', 'fundamental_completo',
      'medio_incompleto', 'medio_completo', 'tecnico',
      'superior_incompleto', 'superior_completo', 'pos_graduacao'
    )),
  ADD COLUMN IF NOT EXISTS beneficiario_programa_social TEXT DEFAULT 'nenhum'
    CHECK (beneficiario_programa_social IN ('nenhum', 'bolsa_familia', 'bpc', 'outro')),
  ADD COLUMN IF NOT EXISTS funcao_cultural TEXT
    CHECK (funcao_cultural IS NULL OR funcao_cultural IN (
      'artista', 'instrutor', 'curador', 'produtor', 'gestor', 'tecnico', 'consultor', 'outro'
    ));

-- ============================================================
-- PARTE 2: Campos estruturados no projeto (Fase 1.4)
-- ============================================================

ALTER TABLE public.projetos
  ADD COLUMN IF NOT EXISTS areas_projeto TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS minicurriculo_proponente TEXT,
  ADD COLUMN IF NOT EXISTS objetivos TEXT,
  ADD COLUMN IF NOT EXISTS metas_projeto TEXT,
  ADD COLUMN IF NOT EXISTS perfil_publico TEXT,
  ADD COLUMN IF NOT EXISTS publico_prioritario TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS local_execucao TEXT,
  ADD COLUMN IF NOT EXISTS periodo_execucao_inicio DATE,
  ADD COLUMN IF NOT EXISTS periodo_execucao_fim DATE,
  ADD COLUMN IF NOT EXISTS estrategia_divulgacao TEXT,
  ADD COLUMN IF NOT EXISTS outras_fontes_recurso BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS outras_fontes_detalhamento TEXT,
  ADD COLUMN IF NOT EXISTS venda_produtos_ingressos BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS venda_detalhamento TEXT,
  ADD COLUMN IF NOT EXISTS contrapartida_social TEXT,
  ADD COLUMN IF NOT EXISTS concorre_cota BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tipo_cota TEXT
    CHECK (tipo_cota IS NULL OR tipo_cota IN ('negra', 'indigena', 'pcd'));
