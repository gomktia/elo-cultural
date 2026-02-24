-- =============================================
-- SEED: Tenant teste + usuário admin
-- Execute APÓS as migrations (all_migrations.sql)
-- =============================================

-- 1. Criar tenant de teste
INSERT INTO public.tenants (nome, dominio, tema_cores, active)
VALUES (
  'Prefeitura Teste',
  'localhost',
  '{"primary": "#1A56DB", "secondary": "#7E3AF2"}',
  true
)
ON CONFLICT (dominio) DO NOTHING;

-- 2. Promover usuário a gestor (substitua pelo email usado no cadastro)
-- Execute DEPOIS de criar a conta em /cadastro
-- UPDATE public.profiles
-- SET
--   role = 'gestor',
--   tenant_id = (SELECT id FROM public.tenants WHERE dominio = 'localhost')
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'SEU_EMAIL_AQUI'
-- );
