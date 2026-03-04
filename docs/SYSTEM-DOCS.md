# Elo Cultural — Documentação Completa do Sistema

> Atualizado em: 2026-03-04

## Visão Geral

**Elo Cultural** é uma plataforma multi-tenant para gestão de editais culturais em municípios brasileiros. Oferece gerenciamento ponta-a-ponta de submissão de projetos, avaliações, aprovações e prestação de contas, com triagem assistida por IA.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript, Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| IA | OpenAI API (triagem e análise) |
| Email | Resend |
| PDF | @react-pdf/renderer |
| UI | Radix UI + Shadcn/ui |
| Gráficos | Recharts |
| Mapas | Leaflet + React Leaflet |
| Forms | React Hook Form + Zod |
| Animações | Framer Motion |
| Monitoramento | Sentry |

---

## Arquitetura Multi-Tenant

### Resolução de Tenant

1. **Domínio raiz** (`elocultural.com`) → plataforma genérica, sem tenant
2. **Subdomínio** (`pinhais.elocultural.com`) → tenant resolvido pelo subdomínio
3. **Dev mode** (`localhost:3000?tenant=pinhais`) → query parameter para desenvolvimento
4. **Proponente Global** → perfil único pode submeter projetos em múltiplos tenants

### Autenticação

- Login por Email/CPF/CNPJ + Senha
- OAuth Gov.br (botão na tela de login)
- RBAC (Role-Based Access Control) via JWT
- Sessão gerenciada por Supabase SSR + middleware
- Contexto de tenant em cookies com domínio compartilhado

---

## Roles e Permissões

| Role | Escopo | Funcionalidades |
|------|--------|----------------|
| **proponente** | Global ou tenant | Submeter projetos, ver resultados, recursos, gerenciar conta |
| **avaliador** | Tenant | Avaliar projetos atribuídos, pontuar critérios |
| **gestor** | Tenant | Dashboards, relatórios, rankings, análise de prestação de contas |
| **admin** | Tenant | Gestão completa de editais, usuários, configurações |
| **super_admin** | Cross-tenant | Gerenciar tenants, usuários globais, configurações da plataforma |

---

## Schema do Banco de Dados

### Tabelas Principais

#### tenants
- `id`, `nome`, `cnpj`, `dominio` (unique)
- `logo_url`, `logo_rodape_url`, `tema_cores` (JSON)
- `status` (ativo, inativo, suspenso)

#### profiles
- `id` (auth.users), `tenant_id` (nullable para proponentes globais)
- `nome`, `cpf_cnpj`, `telefone`, `avatar_url`
- `role` (proponente, avaliador, gestor, admin, super_admin)
- `consentimento_lgpd`, `aprovado`
- Campos proponente: `areas_atuacao[]`, `tempo_atuacao`, `renda`, `genero`, `orientacao_sexual`, `raca_etnia`, `pcd`, `endereco_completo`, `municipio`, `estado`
- Campos avaliador: `curriculo_descricao`, `areas_avaliacao[]`, `lattes_url`
- Campos gestor: `orgao_vinculado`, `funcao_cargo`, `matricula`

#### editais
- `id`, `tenant_id`, `numero_edital`, `titulo`, `descricao`, `tipo_edital`
- `status` (FaseEdital enum — 15+ fases)
- Datas de inscrição e 3 pares de recurso (inscrição, seleção, habilitação)
- Configs: `config_cotas`, `config_desempate`, `config_pontuacao_extra`, `config_reserva_vagas`
- `cancelado`, `justificativa_cancelamento`

#### edital_categorias
- `id`, `edital_id`, `tenant_id`, `nome`, `vagas`

#### criterios
- `id`, `edital_id`, `tenant_id`, `descricao`, `nota_minima`, `nota_maxima`, `peso`, `ordem`

#### edital_fases
- `id`, `edital_id`, `fase`, `data_inicio`, `data_fim`, `bloqueada`

#### edital_documentos
- `id`, `edital_id`, `tenant_id`, `tipo`, `nome_arquivo`, `storage_path`, `tamanho_bytes`

#### projetos
- `id`, `tenant_id`, `edital_id`, `proponente_id`, `categoria_id`
- `numero_protocolo`, `titulo`, `resumo`, `descricao_tecnica`, `orcamento_total`
- `status_habilitacao`, `nota_final`, `campos_extras` (JSON dinâmico)

#### projeto_documentos
- `id`, `projeto_id`, `tenant_id`, `tipo`, `nome_arquivo`, `storage_path`

#### avaliacoes
- `id`, `projeto_id`, `avaliador_id`, `tenant_id`
- `pontuacao_total`, `justificativa`, `status` (em_andamento, finalizada, bloqueada)

#### avaliacao_criterios
- `id`, `avaliacao_id`, `criterio_id`, `nota`, `comentario`

#### recursos
- `id`, `projeto_id`, `proponente_id`, `tenant_id`
- `tipo` (habilitacao, avaliacao), `fundamentacao`
- `status` (pendente, em_analise, deferido, indeferido), `decisao`

#### publicacoes
- `id`, `edital_id`, `tenant_id`, `tipo`, `titulo`, `conteudo`, `arquivo_pdf`

#### prestacao_contas
- `id`, `projeto_id`, `proponente_id`, `tenant_id`
- `valor_total_executado`, `resumo_atividades`, `status`, `parecer_gestor`

#### notificacoes
- `id`, `usuario_id`, `tenant_id`, `tipo`, `titulo`, `mensagem`, `lido`

#### triagem_ia_execucoes / triagem_ia_resultados / triagem_ia_notas
- Execuções de IA, resultados por projeto, notas sugeridas por critério

#### log_auditoria
- `id`, `usuario_id`, `tenant_id`, `acao`, `tabela_afetada`, `dados_antigos`, `dados_novos`

#### platform_settings
- Key-value store (JSONB) para configurações globais

---

## Fluxo do Edital (Lifecycle)

```
criacao → publicacao → inscricao → inscricao_encerrada →
divulgacao_inscritos → recurso_divulgacao_inscritos →
avaliacao_tecnica → resultado_preliminar_avaliacao → recurso_avaliacao →
habilitacao → resultado_preliminar_habilitacao → recurso_habilitacao →
resultado_definitivo_habilitacao → resultado_final → homologacao → arquivamento
```

---

## Rotas da Aplicação

### Autenticação (`/auth`)
| Rota | Descrição |
|------|-----------|
| `/login` | Login Email/CPF + Gov.br |
| `/cadastro` | Cadastro em 2 passos (dados pessoais + perfil) |
| `/esqueci-senha` | Recuperação de senha |

### Público
| Rota | Descrição |
|------|-----------|
| `/` | Homepage com slider de editais |
| `/editais` | Lista de editais publicados |
| `/editais/[id]` | Detalhes do edital |
| `/editais/[id]/resultados` | Rankings e resultados públicos |
| `/indicadores` | Dashboard de transparência |
| `/mapa` | Mapa cultural por município |
| `/privacidade` | Política de privacidade |
| `/termos` | Termos de uso |

### Dashboard — Proponente
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral, projetos recentes |
| `/projetos` | Lista de projetos |
| `/projetos/novo` | Submeter novo projeto |
| `/projetos/[id]` | Detalhes do projeto |
| `/projetos/[id]/prestacao-contas` | Prestação de contas |
| `/projetos/[id]/recurso` | Interpor recurso |
| `/editais` | Descobrir editais abertos |
| `/perfil` | Gerenciar perfil |
| `/notificacoes` | Central de notificações |

### Dashboard — Avaliador
| Rota | Descrição |
|------|-----------|
| `/dashboard` | Visão geral |
| `/avaliacao` | Projetos para avaliar |
| `/avaliacao/[projetoId]` | Formulário de avaliação |

### Dashboard — Gestor
| Rota | Descrição |
|------|-----------|
| `/gestor` | Dashboard com KPIs |
| `/gestor/relatorios` | Relatórios detalhados (Excel) |
| `/gestor/rankings` | Rankings por categoria |
| `/gestor/prestacao-contas` | Análise de prestações |

### Dashboard — Admin
| Rota | Descrição |
|------|-----------|
| `/admin/editais` | Gerenciar editais |
| `/admin/editais/novo` | Criar edital (com upload, recurso deadlines, form builder) |
| `/admin/editais/[id]` | Overview do edital |
| `/admin/editais/[id]/editar` | Editar detalhes |
| `/admin/editais/[id]/formulario` | Configurar formulário de inscrição |
| `/admin/editais/[id]/criterios` | Critérios de avaliação |
| `/admin/editais/[id]/cronograma` | Datas das fases |
| `/admin/editais/[id]/habilitacao` | Habilitação de projetos |
| `/admin/editais/[id]/ranking` | Rankings finais |
| `/admin/editais/[id]/triagem-ia` | Triagem por IA |
| `/admin/editais/[id]/atribuicoes` | Atribuir projetos a avaliadores |
| `/admin/editais/[id]/recursos` | Gerenciar recursos |
| `/admin/editais/[id]/publicacoes` | Publicar resultados |
| `/admin/usuarios` | Gestão de usuários |
| `/admin/auditoria` | Logs de auditoria |
| `/admin/configuracoes` | Configurações do tenant (logos, cores) |

### Dashboard — Super Admin
| Rota | Descrição |
|------|-----------|
| `/super/dashboard` | Stats cross-tenant |
| `/super/tenants` | Gerenciar tenants |
| `/super/tenants/novo` | Criar tenant |
| `/super/usuarios` | Usuários globais |
| `/super/configuracoes` | Configurações da plataforma |

---

## API Routes

### Autenticação
- `POST /api/auth/cpf-lookup` — Buscar email por CPF/CNPJ
- `GET /api/auth/govbr/authorize` — Iniciar OAuth Gov.br
- `GET /api/auth/govbr/callback` — Callback Gov.br

### Email
- `POST /api/email/notify-inscricao` — Confirmação de inscrição
- `POST /api/email/notify-prestacao` — Notificação de prestação

### IA / Triagem
- `POST /api/ia/triagem` — Executar triagem
- `GET /api/ia/triagem/[editalId]/status` — Status da triagem
- `GET /api/ia/triagem/[editalId]` — Resultados

### Notificações
- `GET /api/notificacoes` — Listar notificações
- `POST /api/notificacoes/read` — Marcar como lida

### LGPD
- `POST /api/lgpd/exportar-dados` — Exportar dados do usuário
- `POST /api/lgpd/solicitar-exclusao` — Solicitar exclusão

### Documentos
- `POST /api/gerar-recibo` — Gerar recibo PDF

### Cron
- `POST /api/cron/bloqueio-fases` — Bloquear fases expiradas + auto-avanço

### Transparência (pública)
- `GET /api/transparencia/editais` — Editais publicados
- `GET /api/transparencia/estatisticas` — Estatísticas agregadas

### Configurações
- `GET/POST /api/platform-settings` — Configurações da plataforma

---

## Estrutura de Componentes

### Layout
- **AppSidebar** — Navegação lateral por role (dark navy)
- **UserMenu** — Menu dropdown do usuário
- **NotificationBell** — Sino de notificações
- **TenantHeader** — Header com branding do tenant
- **FooterLogo** — Footer com logo do tenant

### Edital (`/components/edital`)
- EditalCard, EditalSlider, EditalTimeline, EditalCountdown
- EditalConfigManager, EditalStatusBadge, EditalFileUpload
- FaseManager, CriteriosTable, PublicacoesManager
- FormBuilderManager, AvancarEtapaButton, ReciboButton

### Projeto (`/components/projeto`)
- InscricaoForm (dinâmico), DocumentUpload, ProjetoTimeline, StatusTracker

### Avaliação (`/components/avaliacao`)
- RankingTable, AtribuicaoMatrix (upsert logic)

### Recurso (`/components/recurso`)
- RecursoForm, DecisaoForm

### Prestação de Contas (`/components/prestacao`)
- PrestacaoForm, PrestacaoAnalise, PrestacaoStatusBadge

### IA (`/components/ia`)
- TriagemPanel — Executar e revisar triagem

### Cadastro (`/components/cadastro`)
- ProponenteForm, AvaliadorForm, GestorForm, GovBrButton

### Outros
- MapaCultural, IndicadoresCharts, TenantProvider

---

## Segurança

### Middleware (`src/middleware.ts`)
1. Extrai hostname → identifica domínio raiz, subdomínio ou dev mode
2. Obtém sessão Supabase (cookie-based)
3. Resolve tenant_id do subdomínio/cookie
4. Aplica proteção de auth (redirect para `/login` se não autenticado)
5. Bloqueia rotas staff no domínio raiz

### RLS (Row Level Security)
- Todas as tabelas têm `tenant_id` com políticas RLS
- JWT carrega `tenant_id` e `role` em app_metadata
- Proponentes globais têm políticas especiais cross-tenant

### Headers de Segurança
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- CSP restritivo (self + Supabase + OpenAI + Sentry)
- Permissions-Policy: sem camera/mic

---

## Design System

### Cores da Marca
- **Azul (Primary):** `#0047AB`
- **Amarelo:** `#eeb513`
- **Rosa:** `#e32a74`
- **Verde:** `#77a80b`

### Tipografia
- **Display:** Sora (headings)
- **Body:** Inter (texto)
- h1: `text-2xl font-bold` (24px)
- h2: `text-lg font-semibold` (18px)
- h3: `text-base font-semibold` (16px)
- Body: `text-sm font-medium` (14px)
- Labels: `text-xs font-medium` (12px)
- Badges: `text-[11px] font-medium uppercase tracking-wide`

---

## Variáveis de Ambiente

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
CRON_SECRET=your-cron-secret
NEXT_PUBLIC_SENTRY_DSN=https://...
NEXT_PUBLIC_ROOT_DOMAIN=elocultural.com
```

---

## Migrations (27 arquivos)

| # | Arquivo | Descrição |
|---|---------|-----------|
| 1 | `20260220000000_init_tenants_and_rls` | Tenants, auth, RLS |
| 2 | `20260220000001_editais_criterios_fases` | Editais, fases, critérios |
| 3 | `20260220000002_trava_auditoria` | Auditoria |
| 4 | `20260220000003_users_profiles` | Profiles, roles |
| 5 | `20260220000004_edital_fases_datas` | Datas das fases |
| 6 | `20260220000005_projetos_documentos` | Projetos, documentos |
| 7 | `20260220000006_avaliacoes` | Avaliações |
| 8 | `20260220000007_recursos` | Recursos |
| 9 | `20260220000008_publicacoes` | Publicações |
| 10 | `20260220000010_fix_rls_vulnerabilities` | Fix RLS |
| 11 | `20260220000011_super_admin_role` | Super admin |
| 12 | `20260220000013_profile_extra_fields` | Campos demográficos |
| 13 | `20260220000014_edital_recurso_deadlines` | Prazos de recurso |
| 14 | `20260220000015_edital_documentos` | Documentos do edital |
| 15 | `20260220000016_add_divulgacao_phase` | Fase divulgação |
| 16 | `20260220000017_tenant_footer_logo` | Logo rodapé |
| 17 | `20260226000001_prestacao_contas` | Prestação de contas |
| 18 | `20260226000002_triagem_ia` | Triagem IA |
| 19 | `20260227000001_create_storage_bucket` | Storage bucket |
| 20 | `20260228000001_fix_search_path_and_rls` | Search path |
| 21 | `20260228000002_platform_settings` | Settings |
| 22 | `20260228000003_handle_new_user_tenant` | Tenant do metadata |
| 23 | `20260301000001_public_access_transparency` | Transparência |
| 24 | `20260301000002_notificacoes` | Notificações |
| 25 | `20260304000001_aprovacao_perfis` | Aprovação de perfis |
| 26 | `20260304000005_edital_configuracao_completa` | Config completa edital |
| 27 | `20260304000006_form_builder_inscricao` | Form builder |
| 28 | `20260304000010_proponente_global` | Proponente global |
| 29 | `20260304000011_migrate_existing_proponentes` | Migração dados |

---

## Features Implementadas

- [x] Multi-tenant com subdomínios
- [x] Proponente global (cross-tenant)
- [x] Login Gov.br (OAuth)
- [x] Cadastro em 2 passos por perfil
- [x] Gestão completa de editais (CRUD + fases + cronograma)
- [x] Form builder dinâmico para inscrição
- [x] Upload de documentos do edital (PDF + anexos)
- [x] Prazos de recurso configuráveis
- [x] Fase "Divulgação de Inscritos" no fluxo
- [x] Submissão de projetos com formulário dinâmico
- [x] Upload de documentos do projeto
- [x] Avaliação por critérios com pesos
- [x] Atribuição de avaliadores (matrix com upsert)
- [x] Triagem por IA (habilitação, duplicatas, notas sugeridas)
- [x] Sistema de recursos (habilitação e avaliação)
- [x] Rankings e resultados públicos
- [x] Publicação de atas e resultados
- [x] Prestação de contas
- [x] Mapa cultural interativo
- [x] Dashboard de transparência / indicadores
- [x] Notificações in-app
- [x] Email transacional (Resend)
- [x] Geração de PDF (recibos, rankings, atas)
- [x] LGPD (exportação de dados, exclusão)
- [x] Logs de auditoria
- [x] Auto-avanço de fases (cron)
- [x] Upload de logos (header + footer) nas configurações
- [x] Restrição de gestor (não altera perfis)
- [x] Aprovação de perfis staff
- [x] Cancelamento de edital
- [x] Headers de segurança + CSP
