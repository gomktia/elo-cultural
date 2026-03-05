# Análise das Notas do Sócio vs. Estado Atual do Sistema

**Data:** 2026-03-03

---

## PERFIL GESTOR

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| **1** | Editar edital (trocar arquivos, alterar cronograma, voltar fluxo, errata, cancelar com justificativa) | Parcial | Alta | Cronograma editável existe (`FaseManager.tsx`). Upload de documentos existe (`EditalFileUpload.tsx`). **Falta:** voltar fluxo (reverter fase), publicar errata, cancelar publicação com justificativa obrigatória. O avanço de fase é unidirecional hoje. |
| **2** | Publicações: adicionar campo "Etapa" (habilitação, seleção...) + tipologia em branco | Parcial | Média | `PublicacoesManager.tsx` tem 4 tipos fixos (`resultado_preliminar`, `resultado_final`, `ata`, `homologacao`). **Falta:** campo de "etapa" associada + opção de tipo em branco/customizado. |
| **3** | Botão "publicar resultado" sem função + "editar edital" redirecionando errado | Bug | Baixa | Bugs confirmáveis na UI. Precisa verificar os handlers dos botões na página do edital. |
| **4** | Filtros no relatório (categoria, cotas, avaliados, pendentes, nome, CPF, bairro, gênero...) | Não existe | Alta | Relatórios (`RelatorioButtons.tsx`) geram PDFs diretos sem filtros. Não há nenhum sistema de filtros implementado. |
| **5** | Melhorar atribuição de projetos a avaliadores (filtros + selecionar todos) | Parcial | Média | `AtribuicaoMatrix.tsx` usa checkbox individual. **Falta:** filtro por categoria e "selecionar todos". Com 120-200 projetos, isso é crítico para usabilidade. |
| **7** | Editar cronograma na página de cronograma | Já existe | - | `FaseManager.tsx` já permite editar datas das fases. Talvez o gestor não tenha acesso à rota (é rota `/admin/`). **Verificar:** se gestor tem permissão de acesso. |
| **8** | Filtros no ranking por categoria + exportar .xls | Não existe | Alta | Ranking não tem filtros por categoria. **Export XLS não existe em lugar nenhum** — nenhuma lib de planilha instalada. Precisa instalar `xlsx` ou `exceljs`. |
| **9** | Formulário de edital: tipo, categorias livres, critérios, pontuação extra, cotas, desempate, reserva de vagas | Não existe | Muito Alta | O edital hoje tem campos básicos. **Falta tudo isso:** tipo de edital (fomento/premiação/credenciamento/outros), categorias de seleção configuráveis, pontuação extra (LGBTQIAPN+, mulheres, negros, vulnerabilidade social), cotas, critérios de desempate, reserva de vagas regionais. É a maior feature pendente. |
| **10** | Relatório sem link | Bug | Baixa | Provável link quebrado ou rota não mapeada no sidebar do gestor. |
| **11** | Confirmar se fluxo avança automaticamente após prazo | Não funciona | Média | O cron (`/api/cron/bloqueio-fases`) apenas **bloqueia** fases expiradas, **não avança** o status do edital automaticamente. |
| **12** | Configurar formulário de inscrição no cadastro do edital (tipo form builder) + presets por tipo | Não existe | Muito Alta | `InscricaoForm.tsx` tem campos fixos. **Não existe form builder dinâmico.** Seria necessário criar: schema de perguntas por edital, UI de configuração, e renderização dinâmica. |

---

## PERFIL AVALIADOR

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| **1** | Nota < 6 obriga justificativa no comentário | Não existe | Baixa | Validação condicional no formulário de avaliação (`/avaliacao/[projetoId]`). |
| **2** | Comentário Geral obrigatório | Não existe | Baixa | Campo `justificativa` em `avaliacoes` existe no DB. Basta tornar obrigatório na UI. |
| **3** | Avaliador precisa acessar projetos (lista navegável + link no nome) | Parcial | Média | Avaliador vê lista em `/avaliacao`, mas **não tem link direto para ver o projeto completo** durante avaliação. Precisa criar view de detalhes do projeto acessível ao avaliador. |
| **4** | Checkbox de documentos obrigatórios (anuências, declarações, autodeclarações) | Não existe | Média | Não há checklist de documentos na tela de avaliação. Precisa criar componente de verificação documental. |

---

## PERFIL ADMINISTRADOR

| # | Solicitação | Status | Observação |
|---|---|---|---|
| **1** | Admin = Gestor? Diferença? | Diferente | No sistema, `admin` tem acesso completo (CRUD editais, usuários, config, auditoria). `gestor` só vê dashboard, rankings, relatórios e prestação de contas. **Admin >> Gestor.** Precisa esclarecer com o sócio se o gestor deveria ter mais permissões. |

---

## NOVO CADASTRO

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| **2** | Texto de erro em inglês (ex: senha < 8 chars) | Bug | Baixa | Mensagens de validação do Supabase Auth vêm em inglês por padrão. Precisa interceptar e traduzir. |
| **3** | Perfis avaliador/gestor precisam aprovação de admin | Não implementado | Média | Hoje o cadastro concede acesso imediato a todos os perfis. Precisa criar fluxo de aprovação (campo `aprovado` em profiles + tela admin para aprovar). |

---

## PERFIL PROPONENTE

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| **1** | Prestação de contas após execução | Já existe | - | Módulo completo: `PrestacaoForm.tsx` (proponente), `PrestacaoAnalise.tsx` (gestor), rota `/projetos/[id]/prestacao-contas`. O sócio pede "descrever como" — o fluxo pode não estar claro na UI. |
| **2** | "Meu Perfil" não mostra dados já cadastrados | Bug | Média | A página `/perfil` existe e carrega dados básicos, mas **campos extras** (áreas de atuação, gênero, renda, etc.) **não são exibidos/editáveis** apesar de estarem no DB. |
| **3** | Edital com inscrição aberta não aparece | Bug | Média | Possível problema no filtro de status. O edital precisa estar na fase `inscricao` para aparecer. Pode ser bug na query ou na lógica de visibilidade por tenant. |

---

## ABA INDICADORES

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| - | Visível somente após finalizado? | Visível sempre | Baixa | `/indicadores` é público e mostra dados em tempo real. Precisa discutir se deve filtrar apenas editais finalizados. |
| - | Publicação dos projetos aprovados | Não existe | Média | Indicadores mostram estatísticas, mas não lista de projetos aprovados. Precisa criar seção/tabela. |
| - | Mapa com dados apenas do município | Parcial | Média | `MapaCultural.tsx` usa Leaflet mas pode estar mostrando dados além do município. Precisa ajustar bounds/filtros geográficos. |

---

## CRIAR CONTA

| # | Solicitação | Status | Complexidade | Observação |
|---|---|---|---|---|
| **2** | Formulário extra por perfil (proponente: áreas, renda, gênero; avaliador: currículo; gestor: órgão) | Já existe parcial | Média | O cadastro já tem `ProponenteForm.tsx`, `AvaliadorForm.tsx`, `GestorForm.tsx` com campos role-specific. Podem faltar campos. Precisa comparar campos existentes vs. lista completa. |

---

## Priorização Sugerida (atualizado 2026-03-05)

### Crítico (Bugs que impedem uso)
1. ~~Botão "publicar resultado" sem função (Gestor #3)~~ — Não é bug: usar "Gerenciar Publicações"
2. ~~Edital aberto não aparece para proponente (Proponente #3)~~ — CORRIGIDO: filtro status adicionado
3. ~~Perfil não mostra dados cadastrados (Proponente #2)~~ — CORRIGIDO: seção role-specific movida para cima
4. ~~Relatório sem link (Gestor #10)~~ — Não é bug: link existe e funciona
5. ~~Textos de erro em inglês (Cadastro #2)~~ — CORRIGIDO: translateAuthError() no login

### Alta Prioridade (Funcionalidades essenciais)
6. ~~Aprovação de avaliador/gestor por admin (Cadastro #3)~~ — JÁ EXISTIA + bloqueio de acesso adicionado
7. ~~Avaliador acessar projetos durante avaliação (Avaliador #3)~~ — CORRIGIDO: link "Ver Projeto Completo" adicionado
8. ~~Nota < 6 com justificativa obrigatória (Avaliador #1-2)~~ — JÁ EXISTIA
9. ~~Filtros no ranking + export XLS (Gestor #8)~~ — FEITO: filtro categoria + coluna no XLS
10. ~~Melhorar atribuição em massa (Gestor #5)~~ — JÁ EXISTIA (filtros + selecionar todos)
11. ~~Avanço automático de fase (Gestor #11)~~ — JÁ EXISTIA + logging melhorado

### Média Prioridade (Melhorias importantes)
12. ~~Publicações com campo etapa + tipo livre (Gestor #2)~~ — JÁ EXISTIA
13. ~~Reverter fase + cancelar com justificativa (Gestor #1)~~ — JÁ EXISTIA (na página cronograma)
14. ~~Filtros no relatório (Gestor #4)~~ — FEITO: filtros categoria + gênero adicionados
15. ~~Checklist documentos na avaliação (Avaliador #4)~~ — JÁ EXISTIA
16. Indicadores: projetos aprovados + mapa municipal (Indicadores) — PENDENTE

### Longo Prazo (Features complexas)
17. ~~Configuração completa de edital: tipo, categorias, cotas, desempate, reserva de vagas (Gestor #9)~~ — JÁ EXISTIA (EditalConfigManager.tsx)
18. Form builder dinâmico para inscrição (Gestor #12) — PENDENTE (já existe página /formulario com campos customizáveis)
