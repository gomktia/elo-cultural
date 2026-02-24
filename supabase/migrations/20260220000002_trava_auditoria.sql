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
  FOR ALL USING (tenant_id = auth.uid_tenant());

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
