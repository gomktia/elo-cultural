-- Allow public (anon) to verify signatures by hash
-- This enables the /verificar-assinatura page to work without authentication
CREATE POLICY "public_verificar_assinatura"
ON public.assinaturas_digitais FOR SELECT
TO anon
USING (true);
