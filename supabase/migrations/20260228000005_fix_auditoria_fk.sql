-- Fix: Add FK constraint from logs_auditoria.usuario_id to profiles.id
-- This enables PostgREST to resolve the `profiles(nome)` join syntax.
-- Without this FK, the audit page shows empty user name cells.

-- Only add if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'logs_auditoria_usuario_id_fkey_profiles'
    AND table_name = 'logs_auditoria'
  ) THEN
    ALTER TABLE public.logs_auditoria
      ADD CONSTRAINT logs_auditoria_usuario_id_fkey_profiles
      FOREIGN KEY (usuario_id) REFERENCES public.profiles(id)
      ON DELETE SET NULL;
  END IF;
END $$;
