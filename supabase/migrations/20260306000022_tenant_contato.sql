-- Add contact fields to tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS whatsapp_suporte text DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email_suporte text DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS site_url text DEFAULT NULL;
