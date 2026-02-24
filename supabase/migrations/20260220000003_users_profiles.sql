-- 1. Enum de roles do sistema
CREATE TYPE user_role AS ENUM ('proponente', 'avaliador', 'gestor', 'admin');

-- 2. Tabela de perfis (ligada ao auth.users do Supabase)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  nome TEXT NOT NULL,
  cpf_cnpj TEXT,
  telefone TEXT,
  role user_role DEFAULT 'proponente',
  consentimento_lgpd BOOLEAN DEFAULT false,
  data_consentimento TIMESTAMPTZ,
  avatar_url TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  version INTEGER DEFAULT 1
);

-- Índices
CREATE INDEX idx_profiles_tenant ON profiles(tenant_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- 3. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Usuarios veem apenas perfis do seu tenant
CREATE POLICY "Usuarios veem apenas seu tenant" ON profiles
  FOR SELECT USING (tenant_id = auth.uid_tenant());

-- Usuario edita apenas seu proprio perfil
CREATE POLICY "Usuario edita proprio perfil" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin pode ver e editar todos do tenant
CREATE POLICY "Admin gerencia perfis do tenant" ON profiles
  FOR ALL USING (
    tenant_id = auth.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Permitir INSERT para novos registros (trigger de signup)
CREATE POLICY "Service role pode inserir perfis" ON profiles
  FOR INSERT WITH CHECK (true);

-- 4. Trigger para auto-create profile no signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tenant_id, nome, role)
  VALUES (
    NEW.id,
    (NEW.raw_app_meta_data->>'tenant_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    COALESCE((NEW.raw_app_meta_data->>'role')::user_role, 'proponente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 5. Trigger para updated_at e version
CREATE OR REPLACE FUNCTION update_profile_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_version
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_version();

-- 6. Adicionar FK em projetos para profiles
ALTER TABLE projetos ADD CONSTRAINT fk_projetos_proponente
  FOREIGN KEY (proponente_id) REFERENCES profiles(id);
