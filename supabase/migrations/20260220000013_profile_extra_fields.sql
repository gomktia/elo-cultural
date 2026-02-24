-- Extra profile fields per role type

-- Proponente fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS areas_atuacao TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tempo_atuacao TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS renda TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS genero TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orientacao_sexual TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raca_etnia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado TEXT;

-- Avaliador fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS curriculo_descricao TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS areas_avaliacao TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lattes_url TEXT;

-- Gestor fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orgao_vinculado TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS funcao_cargo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS matricula TEXT;
