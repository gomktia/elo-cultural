# Design: Proponente Global + Multi-Tenant Login + Gov.br

**Data:** 2026-03-04
**Status:** Aprovado

## Problema

1. Proponente está preso a um único tenant (prefeitura) — não pode participar de editais de outras cidades
2. Login não filtra por tenant — qualquer usuário loga de qualquer domínio
3. Não há integração com gov.br (desejado para credibilidade)
4. Páginas públicas mostram editais de todos os tenants (deveria filtrar por domínio)

## Decisões de Design

- **Perfil único global** — mesmos dados pessoais para todas as prefeituras
- **Domínio raiz** (`eloculturas.com.br`) — acessível por super_admin e proponente
- **Gov.br** — botão visual + estrutura OAuth preparada (ativa quando credenciais disponíveis)
- **Proponente não pertence a tenant** — seus projetos pertencem (via edital.tenant_id)

## Arquitetura

### 1. Banco de Dados

#### 1.1 Profiles: tenant_id nullable para proponentes

```sql
ALTER TABLE profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- Constraint: non-proponente roles MUST have tenant_id
ALTER TABLE profiles ADD CONSTRAINT check_tenant_required_for_staff
  CHECK (role = 'proponente' OR tenant_id IS NOT NULL);
```

#### 1.2 Helper functions

```sql
CREATE OR REPLACE FUNCTION public.is_global_proponente()
RETURNS BOOLEAN AS $$
  SELECT public.uid_role() = 'proponente'
     AND public.uid_tenant() IS NULL;
$$ LANGUAGE SQL STABLE;
```

#### 1.3 RLS policies adicionais (não substituem as existentes)

```sql
-- Proponente global vê SEUS projetos em qualquer tenant
CREATE POLICY "projetos_select_proponente_global"
ON projetos FOR SELECT
USING (is_global_proponente() AND proponente_id = auth.uid());

-- Proponente global insere projeto (tenant vem do edital)
CREATE POLICY "projetos_insert_proponente_global"
ON projetos FOR INSERT
WITH CHECK (is_global_proponente() AND proponente_id = auth.uid());

-- Proponente global vê editais ativos de qualquer tenant
CREATE POLICY "editais_select_proponente_global"
ON editais FOR SELECT
USING (is_global_proponente() AND active = true);

-- Proponente global vê seu próprio perfil
CREATE POLICY "profiles_select_own_global"
ON profiles FOR SELECT
USING (is_global_proponente() AND id = auth.uid());

-- Proponente global atualiza seu próprio perfil
CREATE POLICY "profiles_update_own_global"
ON profiles FOR UPDATE
USING (is_global_proponente() AND id = auth.uid());
```

#### 1.4 Trigger handle_new_user ajustado

```sql
-- Se role = proponente → tenant_id = NULL, app_metadata.tenant_id = NULL
-- Se role != proponente → tenant_id obrigatório (do domínio)
```

#### 1.5 Migrar proponentes existentes

```sql
-- Proponentes existentes passam a ter tenant_id = NULL
-- Seus projetos continuam vinculados via edital_id (não muda)
UPDATE profiles SET tenant_id = NULL WHERE role = 'proponente';

-- Atualizar JWT metadata dos proponentes existentes
UPDATE auth.users SET raw_app_meta_data =
  raw_app_meta_data || '{"tenant_id": null}'::jsonb
WHERE id IN (SELECT id FROM profiles WHERE role = 'proponente');
```

### 2. Login — Validação por Domínio

#### 2.1 Fluxo pós-autenticação (login/page.tsx)

```
Supabase autentica (email + senha) → sucesso
  → Busca profile (role, tenant_id)
  → Detecta contexto do domínio (cookie tenant_id)

  SUPER_ADMIN: permite em qualquer domínio
  PROPONENTE (tenant_id = NULL): permite em qualquer domínio
  ADMIN|GESTOR|AVALIADOR:
    - Domínio raiz → erro: "Acesse pelo domínio do seu município"
    - Subdomínio correto (profile.tenant_id = cookie.tenant_id) → OK
    - Subdomínio errado → erro: "Sua conta pertence a [município]. Acesse em [url]"
```

#### 2.2 Mensagens de erro

| Situação | Mensagem |
|----------|----------|
| Credenciais erradas | "Credenciais inválidas ou acesso não autorizado." |
| Rate limit | "Muitas tentativas. Aguarde alguns minutos." |
| Staff no domínio raiz | "Acesse pelo domínio do seu município." |
| Staff no domínio errado | "Sua conta pertence a {município}. Acesse em {url}." |
| Email não confirmado | "E-mail ainda não confirmado." |

### 3. Middleware — Ajustes

#### 3.1 Domínio raiz (eloculturas.com.br)

- Mantém comportamento atual: limpa cookies de tenant
- Permite acesso a /login, /cadastro, /projetos, /perfil, /super
- Bloqueia /admin, /gestor, /avaliacao (rotas de staff)

#### 3.2 Subdomínios

- Mantém comportamento atual: resolve tenant, seta cookies
- Filtra editais públicos pelo tenant do domínio
- Login valida role vs domínio (ver seção 2)

### 4. Cadastro

#### 4.1 Em subdomínio (pinhais.eloculturas.com.br/cadastro)

- Proponente → `tenant_id = NULL`, `app_metadata.tenant_id = null`
- Gestor/Admin/Avaliador → `tenant_id = cookie.tenant_id`

#### 4.2 Em domínio raiz (eloculturas.com.br/cadastro)

- Só permite cadastro de proponente
- Oculta opções gestor/admin/avaliador
- Mensagem: "Para se cadastrar como gestor ou avaliador, acesse o domínio do seu município."

### 5. Dashboard — Cores por Contexto

| Domínio | Quem | Cores |
|---------|------|-------|
| `pinhais.eloculturas.com.br` | Qualquer logado | tema_cores de Pinhais |
| `curitiba.eloculturas.com.br` | Qualquer logado | tema_cores de Curitiba |
| `eloculturas.com.br` | Proponente | Cores padrão Elo Cultural |
| `eloculturas.com.br` | Super admin | Cores padrão Elo Cultural |

#### 5.1 Dashboard layout ajustado

```typescript
// Em subdomínio: cores do tenant (via cookie)
// Em domínio raiz: cores padrão Elo Cultural
// Proponente global: usa cores do domínio atual (não do perfil, que é null)
```

### 6. Painel Unificado do Proponente (eloculturas.com.br)

#### 6.1 Rota: /projetos (domínio raiz)

```
Projetos agrupados por município:

📍 Pinhais/PR
├─ Festival de Teatro — Em Avaliação
└─ Sarau Literário — Aprovado

📍 Curitiba/PR
└─ Mostra de Cinema — Enviado

[Explorar editais abertos →]
```

#### 6.2 Query

```sql
SELECT p.*, e.titulo as edital_titulo, e.numero_edital,
       t.nome as municipio, t.dominio, t.tema_cores
FROM projetos p
JOIN editais e ON p.edital_id = e.id
JOIN tenants t ON e.tenant_id = t.id
WHERE p.proponente_id = auth.uid()
ORDER BY t.nome, p.created_at DESC
```

#### 6.3 Links

Ao clicar num projeto, redireciona para o subdomínio correto:
`https://{tenant.dominio}.eloculturas.com.br/projetos/{projeto.id}`

### 7. Filtro de Editais Públicos por Tenant

#### 7.1 Páginas públicas (subdomínio)

```typescript
// Antes: mostra editais de TODOS os tenants
const { data } = await supabase.from('editais').select('*').eq('active', true)

// Depois: filtra pelo tenant do domínio
const { data } = await supabase.from('editais').select('*')
  .eq('active', true)
  .eq('tenant_id', tenantId) // do cookie
```

#### 7.2 Páginas públicas (domínio raiz)

- Mostra editais de todos os tenants (marketplace)
- Agrupados por município
- Ou: página institucional sem listagem (decisão futura)

### 8. Gov.br — Preparação

#### 8.1 Botão visual

```tsx
// Em login/page.tsx, abaixo do botão "Entrar"
<div className="relative my-4">
  <div className="absolute inset-0 flex items-center">
    <span className="w-full border-t" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white px-2 text-muted-foreground">ou</span>
  </div>
</div>

<Button variant="outline" onClick={handleGovBr}>
  <GovBrLogo /> Entrar com gov.br
</Button>
```

#### 8.2 Comportamento ao clicar

- Se `GOVBR_CLIENT_ID` não está configurado → toast "Integração gov.br em breve"
- Se configurado → redireciona para OAuth flow

#### 8.3 Estrutura OAuth (desativada por padrão)

```
/api/auth/govbr/authorize → redireciona para sso.acesso.gov.br
/api/auth/govbr/callback  → recebe código, troca por token, cria/vincula conta
```

#### 8.4 Env vars

```env
GOVBR_CLIENT_ID=        # Deixar vazio até aprovação
GOVBR_CLIENT_SECRET=     # Deixar vazio até aprovação
GOVBR_REDIRECT_URI=https://eloculturas.com.br/api/auth/govbr/callback
```

#### 8.5 Fluxo quando ativo

```
Clica "Entrar com gov.br"
→ Redireciona para sso.acesso.gov.br/authorize
→ Usuário autentica no gov.br (CPF + senha/biometria)
→ Callback retorna: CPF, nome, email, nível confiança
→ Sistema busca profile por CPF:
  - Existe? → Loga direto
  - Não existe? → Cria conta (proponente global, tenant_id = NULL)
→ Redireciona para dashboard
```

## Ordem de Implementação

1. **Migration SQL** — tenant_id nullable + constraint + RLS + helper functions
2. **Migrar proponentes existentes** — UPDATE tenant_id = NULL
3. **Login** — validação role vs domínio + mensagens de erro
4. **Cadastro** — proponente global + restrição de roles no domínio raiz
5. **Middleware** — bloquear rotas de staff no domínio raiz
6. **Filtro editais públicos** — por tenant do domínio
7. **Dashboard layout** — cores por contexto (domínio vs perfil)
8. **Painel unificado** — /projetos no domínio raiz
9. **Gov.br** — botão + estrutura OAuth

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Proponentes existentes perdem acesso | Migration UPDATE cuidadosa + teste antes |
| RLS quebra para proponentes globais | Policies ADICIONAIS, não substituem as existentes |
| JWT com tenant_id null causa problemas | uid_tenant() já retorna NULL safe |
| Gov.br demora para aprovar | Botão visual preparado, sistema funciona 100% sem |
