-- Create the 'documentos' storage bucket used for:
-- - Edital PDFs and attachments (EditalFileUpload)
-- - Tenant logos (admin/configuracoes)
-- - Projeto documents

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documentos',
  'documentos',
  true,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their tenant folder
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos');

CREATE POLICY "Authenticated users can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');

CREATE POLICY "Public can read documentos" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'documentos');
