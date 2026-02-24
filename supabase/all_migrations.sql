-- 1. Habilita extensões nativas do Postgres para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Criação da Tabela Tenants
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    dominio VARCHAR(255) UNIQUE NOT NULL, -- O domínio que o Middleware Next.js vai procurar
    logo_url TEXT,
    tema_cores JSONB DEFAULT '{"primary": "#1A56DB", "secondary": "#F3F4F6"}', -- Base para o CSS Tailwind
    status VARCHAR(50) DEFAULT 'ativo', -- ativo, inativo, suspenso
    
    -- Campos Obrigatórios de Governança
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    version INTEGER DEFAULT 1
);

-- Indexação essencial para o Middleware Next.js encontrar a prefeitura rapidamente
CREATE INDEX idx_tenants_dominio ON public.tenants(dominio);

-- 3. Trigger para manter a versão de controle de concorrência e o campo updated_at
CREATE OR REPLACE FUNCTION update_tenant_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tenant_version
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION update_tenant_version();

-- 4. ROW LEVEL SECURITY (RLS) E POLÍTICAS DE ACESSO
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- POLÍTICA 1: Leitura Pública
CREATE POLICY "Leitura pública permitida para tenants ativos" 
ON public.tenants
FOR SELECT 
USING (status = 'ativo');

-- POLÍTICA 2: Inserção no Banco
CREATE POLICY "Apenas Super Admins podem cadastrar Tenants" 
ON public.tenants
FOR INSERT
WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'super_admin' = 'true'
);

-- POLÍTICA 3: Atualização Segura pelo Gestor da Prefeitura
CREATE POLICY "Gestores podem editar os dados de seu próprio Tenant" 
ON public.tenants
FOR UPDATE 
USING (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
    AND 
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
WITH CHECK (
    id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::uuid
);
-- 1. Definição das Fases do Edital conforme o padrão de Banca
CREATE TYPE fase_edital AS ENUM (
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada', 
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao', 
  'resultado_definitivo_habilitacao', 'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 
  'recurso_avaliacao', 'resultado_final', 'homologacao', 'arquivamento'
);

-- Função auxiliar para o JWT referenciada na política abaixo (deve vir antes)
CREATE OR REPLACE FUNCTION public.uid_tenant()
RETURNS UUID AS $$
  SELECT (COALESCE(current_setting('request.jwt.claim.app_metadata', true)::jsonb->>'tenant_id', '00000000-0000-0000-0000-000000000000'))::UUID;
$$ LANGUAGE SQL STABLE;

-- 2. Tabela de Editais Robusta
CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  numero_edital TEXT NOT NULL, -- Ex: 001/2026
  titulo TEXT NOT NULL,
  descricao TEXT,
  status fase_edital DEFAULT 'criacao',
  
  -- Cronograma (Datas Críticas para bloqueio automático)
  inicio_inscricao TIMESTAMPTZ,
  fim_inscricao TIMESTAMPTZ,
  inicio_recurso TIMESTAMPTZ,
  fim_recurso TIMESTAMPTZ,
  
  versao INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID -- Referência ao Admin que criou (Ainda vamos criar a tabela users, então deixamos só UUID)
);

-- 3. Tabela de Critérios de Avaliação (O cérebro do Ranking)
CREATE TABLE criterios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL, -- Ex: "Mérito Cultural"
  nota_minima DECIMAL DEFAULT 0,
  nota_maxima DECIMAL NOT NULL,
  peso INTEGER DEFAULT 1,
  ordem INTEGER,
  tenant_id UUID REFERENCES tenants(id) NOT NULL
);

-- Tabela de Logs de Auditoria (Para suportar o diferencial GO MKT solicitado)
CREATE TABLE logs_auditoria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) NOT NULL,
    usuario_id UUID, -- Idealmente foreign key para users
    acao TEXT NOT NULL,
    tabela_afetada TEXT NOT NULL,
    registro_id UUID NOT NULL,
    dados_antigos JSONB,
    dados_novos JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Habilitar RLS para garantir que uma prefeitura não veja editais de outra
ALTER TABLE editais ENABLE ROW LEVEL SECURITY;
ALTER TABLE criterios ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs_auditoria ENABLE ROW LEVEL SECURITY;

-- Políticas Editais
CREATE POLICY "Acesso isolado por prefeitura" ON editais
  FOR ALL USING (tenant_id = public.uid_tenant()); 

-- Políticas Critérios
CREATE POLICY "Acesso isolado por prefeitura criterios" ON criterios
  FOR ALL USING (tenant_id = public.uid_tenant()); 

-- Políticas Logs
CREATE POLICY "Acesso isolado por prefeitura logs" ON logs_auditoria
  FOR ALL USING (tenant_id = public.uid_tenant());
-- 1. TABELA DE PROJETOS (INSCRIÇÕES)
CREATE TABLE projetos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  edital_id UUID REFERENCES editais(id) NOT NULL,
  proponente_id UUID NOT NULL, -- será FK para a tabela users
  numero_protocolo TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  resumo TEXT,
  status_atual TEXT DEFAULT 'enviado',
  
  -- Controle de envio
  data_envio TIMESTAMPTZ DEFAULT now(),
  ip_submissao TEXT,
  
  CONSTRAINT fk_projetos_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Habilitar RLS
ALTER TABLE projetos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso isolado por prefeitura projetos" ON projetos
  FOR ALL USING (tenant_id = public.uid_tenant());

-- 2. FUNÇÃO SERVER-SIDE (POSTGRES) PARA TRAVA DE INSCRIÇÃO RÍGIDA
-- Nenhuma inserção ou atualização de projeto pode ocorrer se o edital estiver fora do prazo 
-- ou do status correto.
CREATE OR REPLACE FUNCTION validar_prazo_inscricao()
RETURNS TRIGGER AS $$
DECLARE
  v_fim_inscricao TIMESTAMPTZ;
  v_status_edital fase_edital;
BEGIN
  -- Buscar dados do edital relacionado
  SELECT fim_inscricao, status INTO v_fim_inscricao, v_status_edital
  FROM public.editais
  WHERE id = NEW.edital_id;
  
  -- Checagem 1: O edital está na fase de inscrição?
  IF v_status_edital != 'inscricao' THEN
    RAISE EXCEPTION 'HTTP 403 Forbidden: O edital não encontra-se na fase de inscrições abertas. Fase atual: %', v_status_edital;
  END IF;

  -- Checagem 2: A data atual ultrapassou o fim_inscricao estabelecido?
  IF now() > v_fim_inscricao THEN
    RAISE EXCEPTION 'HTTP 403 Forbidden: Prazo de inscrição encerrado em %.', v_fim_inscricao;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atrelar o gatilho (Trigger) à tabela de projetos
CREATE TRIGGER trigger_trava_seguranca_projetos
BEFORE INSERT OR UPDATE ON public.projetos
FOR EACH ROW
EXECUTE FUNCTION validar_prazo_inscricao();

-- 3. TRIGGER AUTOMÁTICA DE AUDITORIA GOV.BR/TCE
-- Criação da função de auditoria genérica (Audit Trail)
CREATE OR REPLACE FUNCTION audit_mudanca_status_edital()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o campo 'status' mudou
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.logs_auditoria(
      tenant_id, 
      usuario_id, 
      acao, 
      tabela_afetada, 
      registro_id, 
      dados_antigos, 
      dados_novos,
      ip_address
    )
    VALUES(
      NEW.tenant_id,
      NEW.created_by, -- Usuário modificador
      'MUDANÇA DE FASE EDITAL',
      'editais',
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      current_setting('request.headers', true)::json->>'x-forwarded-for' -- Captura de IP via Supabase Headers
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atrelar auditoria na tabela editais
CREATE TRIGGER trigger_auditoria_editais
AFTER UPDATE ON public.editais
FOR EACH ROW
EXECUTE FUNCTION audit_mudanca_status_edital();
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
  FOR SELECT USING (tenant_id = public.uid_tenant());

-- Usuario edita apenas seu proprio perfil
CREATE POLICY "Usuario edita proprio perfil" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admin pode ver e editar todos do tenant
CREATE POLICY "Admin gerencia perfis do tenant" ON profiles
  FOR ALL USING (
    tenant_id = public.uid_tenant()
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
-- Tabela de fases com datas individuais por edital
CREATE TABLE edital_fases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  fase fase_edital NOT NULL,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  bloqueada BOOLEAN DEFAULT false,
  observacao TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índice para consultas frequentes
CREATE INDEX idx_edital_fases_edital ON edital_fases(edital_id);
CREATE INDEX idx_edital_fases_fase ON edital_fases(fase);

-- RLS
ALTER TABLE edital_fases ENABLE ROW LEVEL SECURITY;

-- Acesso via edital (que já tem RLS por tenant)
CREATE POLICY "Acesso fases via edital" ON edital_fases
  FOR ALL USING (
    edital_id IN (SELECT id FROM editais WHERE tenant_id = public.uid_tenant())
  );

-- Função para bloquear fases expiradas automaticamente
CREATE OR REPLACE FUNCTION bloquear_fases_expiradas()
RETURNS void AS $$
BEGIN
  UPDATE edital_fases
  SET bloqueada = true
  WHERE bloqueada = false
    AND data_fim IS NOT NULL
    AND data_fim < now();
END;
$$ LANGUAGE plpgsql;
-- Adicionar campos faltantes em projetos
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS descricao_tecnica TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS orcamento_total DECIMAL(12,2);
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS cronograma_execucao TEXT;
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS status_habilitacao TEXT DEFAULT 'pendente';
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS nota_final DECIMAL(5,2);

-- Tabela de documentos anexados
CREATE TABLE projeto_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('identidade', 'proposta', 'orcamento', 'complementar')),
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_projeto_documentos_projeto ON projeto_documentos(projeto_id);

ALTER TABLE projeto_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso docs por tenant" ON projeto_documentos
  FOR ALL USING (tenant_id = public.uid_tenant());
-- 1. Tabela de avaliacoes
CREATE TABLE avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) NOT NULL,
  avaliador_id UUID REFERENCES profiles(id) NOT NULL,
  pontuacao_total DECIMAL(5,2),
  justificativa TEXT,
  status TEXT DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'finalizada', 'bloqueada')),
  versao INTEGER DEFAULT 1,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de notas por criterio
CREATE TABLE avaliacao_criterios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  avaliacao_id UUID REFERENCES avaliacoes(id) ON DELETE CASCADE,
  criterio_id UUID REFERENCES criterios(id),
  nota DECIMAL(5,2) NOT NULL,
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_avaliacoes_projeto ON avaliacoes(projeto_id);
CREATE INDEX idx_avaliacoes_avaliador ON avaliacoes(avaliador_id);
CREATE INDEX idx_avaliacao_criterios_avaliacao ON avaliacao_criterios(avaliacao_id);

-- 3. Trigger: calcula pontuacao_total automaticamente
CREATE OR REPLACE FUNCTION calcular_pontuacao_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE avaliacoes SET pontuacao_total = (
    SELECT SUM(ac.nota * c.peso) / NULLIF(SUM(c.peso), 0)
    FROM avaliacao_criterios ac
    JOIN criterios c ON c.id = ac.criterio_id
    WHERE ac.avaliacao_id = NEW.avaliacao_id
  ) WHERE id = NEW.avaliacao_id;
  return NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calc_pontuacao
AFTER INSERT OR UPDATE ON avaliacao_criterios
FOR EACH ROW EXECUTE FUNCTION calcular_pontuacao_total();

-- 4. RLS
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacao_criterios ENABLE ROW LEVEL SECURITY;

-- Avaliador so ve projetos atribuidos a ele
CREATE POLICY "Avaliador ve suas avaliacoes" ON avaliacoes
  FOR SELECT USING (
    avaliador_id = auth.uid()
    OR tenant_id = public.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );

CREATE POLICY "Avaliador edita suas avaliacoes" ON avaliacoes
  FOR UPDATE USING (avaliador_id = auth.uid() AND status = 'em_andamento');

CREATE POLICY "Admin gerencia avaliacoes" ON avaliacoes
  FOR ALL USING (
    tenant_id = public.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

CREATE POLICY "Acesso criterios avaliacao" ON avaliacao_criterios
  FOR ALL USING (
    avaliacao_id IN (
      SELECT id FROM avaliacoes WHERE avaliador_id = auth.uid()
      UNION
      SELECT id FROM avaliacoes WHERE tenant_id = public.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
    )
  );
-- 1. Tabela de recursos administrativos
CREATE TABLE recursos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  projeto_id UUID REFERENCES projetos(id) NOT NULL,
  proponente_id UUID REFERENCES profiles(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('habilitacao', 'avaliacao')),
  numero_protocolo TEXT UNIQUE NOT NULL,
  fundamentacao TEXT NOT NULL,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_analise', 'deferido', 'indeferido')),
  decisao TEXT,
  decidido_por UUID REFERENCES profiles(id),
  data_decisao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Anexos do recurso
CREATE TABLE recurso_anexos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recurso_id UUID REFERENCES recursos(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX idx_recursos_projeto ON recursos(projeto_id);
CREATE INDEX idx_recursos_proponente ON recursos(proponente_id);
CREATE INDEX idx_recursos_status ON recursos(status);

-- 3. RLS
ALTER TABLE recursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurso_anexos ENABLE ROW LEVEL SECURITY;

-- Proponente ve seus recursos
CREATE POLICY "Proponente ve seus recursos" ON recursos
  FOR SELECT USING (proponente_id = auth.uid());

-- Proponente cria recurso
CREATE POLICY "Proponente cria recurso" ON recursos
  FOR INSERT WITH CHECK (proponente_id = auth.uid());

-- Admin gerencia recursos do tenant
CREATE POLICY "Admin gerencia recursos" ON recursos
  FOR ALL USING (
    tenant_id = public.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );

-- Anexos seguem o recurso
CREATE POLICY "Acesso anexos recurso" ON recurso_anexos
  FOR ALL USING (
    recurso_id IN (
      SELECT id FROM recursos WHERE proponente_id = auth.uid()
      UNION
      SELECT id FROM recursos WHERE tenant_id = public.uid_tenant() AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
    )
  );
-- Tabela de publicacoes oficiais
CREATE TABLE publicacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  edital_id UUID REFERENCES editais(id) NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('resultado_preliminar', 'resultado_final', 'ata', 'homologacao')),
  numero_publicacao INTEGER NOT NULL,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  arquivo_pdf TEXT, -- storage path
  publicado_por UUID REFERENCES profiles(id),
  data_publicacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_publicacoes_edital ON publicacoes(edital_id);

ALTER TABLE publicacoes ENABLE ROW LEVEL SECURITY;

-- Publicacoes sao publicas para leitura
CREATE POLICY "Leitura publica de publicacoes" ON publicacoes
  FOR SELECT USING (true);

-- Somente admin pode criar/editar
CREATE POLICY "Admin gerencia publicacoes" ON publicacoes
  FOR ALL USING (
    tenant_id = public.uid_tenant()
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'gestor')
  );

-- 5. Novos campos para Habilitação Documental
ALTER TABLE public.projetos ADD COLUMN IF NOT EXISTS justificativa_habilitacao TEXT;
