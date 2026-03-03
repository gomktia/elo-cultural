-- ============================================================================
-- MIGRATION: email settings — Resend integration config
-- ============================================================================

INSERT INTO public.platform_settings (key, value) VALUES
  ('email_enabled', 'false'),
  ('resend_api_key', ''),
  ('sender_email', 'noreply@eloculturas.com.br'),
  ('sender_name', 'Elo Cultura Digital')
ON CONFLICT (key) DO NOTHING;
