-- ============================================================================
-- MIGRATION: Perfil PJ + Coletivo sem CNPJ
-- Data: 2026-03-06
-- Fase 1.2 - Campos Pessoa Juridica no profiles
-- Fase 1.3 - Tabelas coletivos e coletivo_membros
-- ============================================================================

-- =====================
-- FASE 1.2 - Pessoa Juridica (campos no profiles)
-- =====================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS razao_social TEXT,
  ADD COLUMN IF NOT EXISTS nome_fantasia TEXT,
  ADD COLUMN IF NOT EXISTS endereco_sede TEXT,
  ADD COLUMN IF NOT EXISTS representante_nome TEXT,
  ADD COLUMN IF NOT EXISTS representante_cpf TEXT,
  ADD COLUMN IF NOT EXISTS representante_genero TEXT,
  ADD COLUMN IF NOT EXISTS representante_raca_etnia TEXT,
  ADD COLUMN IF NOT EXISTS representante_pcd BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS representante_escolaridade TEXT
    CHECK (representante_escolaridade IS NULL OR representante_escolaridade IN (
      'sem_educacao_formal', 'fundamental_incompleto', 'fundamental_completo',
      'medio_incompleto', 'medio_completo', 'tecnico',
      'superior_incompleto', 'superior_completo', 'pos_graduacao'
    ));

-- =====================
-- FASE 1.3 - Coletivo sem CNPJ
-- =====================

CREATE TABLE IF NOT EXISTS public.coletivos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nome_coletivo TEXT NOT NULL,
    ano_criacao INTEGER,
    quantidade_membros INTEGER DEFAULT 1,
    portfolio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coletivos_profile ON public.coletivos(profile_id);
CREATE INDEX IF NOT EXISTS idx_coletivos_nome ON public.coletivos(nome_coletivo);

CREATE TABLE IF NOT EXISTS public.coletivo_membros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coletivo_id UUID NOT NULL REFERENCES public.coletivos(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    cpf TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coletivo_membros_coletivo ON public.coletivo_membros(coletivo_id);

-- =====================
-- RLS
-- =====================

ALTER TABLE public.coletivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coletivo_membros ENABLE ROW LEVEL SECURITY;

-- coletivos: proponente manages own, staff reads all
CREATE POLICY "proponente_all_own_coletivo" ON public.coletivos FOR ALL
USING (profile_id = auth.uid());

CREATE POLICY "staff_select_coletivos" ON public.coletivos FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')
));

-- coletivo_membros: proponente manages own (via coletivo), staff reads all
CREATE POLICY "proponente_all_own_coletivo_membros" ON public.coletivo_membros FOR ALL
USING (coletivo_id IN (
    SELECT c.id FROM public.coletivos c WHERE c.profile_id = auth.uid()
));

CREATE POLICY "staff_select_coletivo_membros" ON public.coletivo_membros FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role IN ('gestor','admin','super_admin')
));
