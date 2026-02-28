-- ============================================================================
-- MIGRATION: platform_settings — global platform configuration
-- ============================================================================
-- Stores key-value pairs for platform-wide settings (IA config, etc.)
-- Only super_admin can read/write these settings.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only super_admin can SELECT
CREATE POLICY "platform_settings_select_super_admin"
ON public.platform_settings FOR SELECT
USING (public.uid_role() = 'super_admin');

-- Only super_admin can INSERT
CREATE POLICY "platform_settings_insert_super_admin"
ON public.platform_settings FOR INSERT
WITH CHECK (public.uid_role() = 'super_admin');

-- Only super_admin can UPDATE
CREATE POLICY "platform_settings_update_super_admin"
ON public.platform_settings FOR UPDATE
USING (public.uid_role() = 'super_admin');

-- Seed default IA settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('ia_enabled', 'true'),
  ('ia_model', 'gpt-4'),
  ('ia_embedding_model', 'text-embedding-3-small'),
  ('openai_api_key', '')
ON CONFLICT (key) DO NOTHING;
