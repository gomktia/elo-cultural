-- ============================================================================
-- MIGRATION: Set existing proponentes to global (tenant_id = NULL)
-- ============================================================================

-- 1. Clear tenant_id from all proponente profiles
UPDATE public.profiles
SET tenant_id = NULL, updated_at = now()
WHERE role = 'proponente' AND tenant_id IS NOT NULL;

-- 2. Update JWT app_metadata for existing proponentes
-- This ensures uid_tenant() returns NULL for them
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"tenant_id": null}'::jsonb
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'proponente');
