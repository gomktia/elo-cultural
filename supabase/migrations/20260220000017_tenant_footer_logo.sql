-- Add footer logo URL for government branding
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_rodape_url TEXT;
