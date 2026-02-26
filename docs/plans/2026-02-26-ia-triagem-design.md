# IA para Triagem Automática — Design Document

Data: 2026-02-26

## Decisões

- **Provedor:** OpenAI GPT-4
- **Acesso:** Gestor, Admin, Avaliador (todos veem sugestões)
- **Similaridade:** Comparação interna (projetos dentro do mesmo edital)
- **Trigger:** Botão manual do gestor ("Executar Triagem IA")
- **Arquitetura:** Processamento síncrono (sem fila/background jobs)

## Modelo de Dados

### `triagem_ia_execucoes`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| tenant_id | UUID FK | Isolamento multi-tenant |
| edital_id | UUID FK | Edital sendo analisado |
| executado_por | UUID FK | Usuário que iniciou |
| tipo | TEXT | `habilitacao` \| `avaliacao` \| `irregularidades` \| `completa` |
| status | TEXT | `em_andamento` \| `concluida` \| `erro` |
| total_projetos | INTEGER | Total de projetos a analisar |
| projetos_analisados | INTEGER | Progresso |
| erro_mensagem | TEXT | Mensagem de erro se falhou |
| created_at | TIMESTAMPTZ | |
| concluida_em | TIMESTAMPTZ | |

### `triagem_ia_resultados`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| execucao_id | UUID FK | Referência à execução |
| projeto_id | UUID FK | Projeto analisado |
| tenant_id | UUID FK | |
| habilitacao_sugerida | TEXT | `habilitado` \| `inabilitado` \| `pendencia` |
| habilitacao_motivo | TEXT | Explicação da IA |
| docs_completos | BOOLEAN | Todos os docs obrigatórios presentes |
| docs_problemas | JSONB | Lista de problemas nos documentos |
| irregularidades_flags | JSONB | Lista de flags detectados |
| similaridade_max | DECIMAL(5,4) | 0-1, maior similaridade encontrada |
| projeto_similar_id | UUID | Projeto mais similar |
| created_at | TIMESTAMPTZ | |

### `triagem_ia_notas`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | UUID PK | |
| resultado_id | UUID FK | Referência ao resultado |
| criterio_id | UUID FK | Critério avaliado |
| nota_sugerida | DECIMAL(5,2) | Nota sugerida pela IA |
| justificativa | TEXT | Justificativa gerada pela IA |
| confianca | DECIMAL(3,2) | 0-1, nível de confiança |
| created_at | TIMESTAMPTZ | |

## API Routes

### `POST /api/ia/triagem`

Executa triagem completa para um edital.

**Body:** `{ edital_id, tipo: "completa" }`

**Fluxo:**
1. Validação de permissão (gestor/admin/super_admin)
2. Cria registro em `triagem_ia_execucoes`
3. Busca projetos do edital + documentos + critérios
4. Para cada projeto:
   - Habilitação: GPT-4 analisa completude documental e requisitos básicos
   - Notas: GPT-4 avalia projeto contra cada critério (nota + justificativa + confiança)
   - Irregularidades: Embeddings OpenAI para cosine similarity entre projetos + checagem de orçamentos duplicados
5. Salva resultados em `triagem_ia_resultados` e `triagem_ia_notas`
6. Atualiza execução para `concluida`

### `GET /api/ia/triagem/[editalId]`

Retorna resultados da última triagem concluída.

### `GET /api/ia/triagem/[editalId]/status`

Status da execução em andamento (para polling de progresso).

## Prompts GPT-4

Cada chamada envia contexto do edital (nome, objetivo, critérios) + dados do projeto. Resposta pedida em JSON estruturado.

**Prompt de habilitação:** Analisa documentos enviados vs. requisitos do edital.

**Prompt de avaliação:** Para cada critério, avalia o projeto considerando resumo, descrição técnica, orçamento e cronograma. Retorna nota dentro do range [min, max], justificativa e nível de confiança.

**Similaridade:** Gera embeddings (`text-embedding-3-small`) para o texto de cada projeto, calcula cosine similarity par-a-par. Flag se > 0.85.

## Interface

### Página principal: `/admin/editais/[id]/triagem-ia`

- Header com botão "Executar Triagem Completa"
- Barra de progresso durante execução
- 3 tabs: Habilitação, Avaliação, Irregularidades
- Tabela habilitação: projeto, sugestão IA, motivo, confiança
- Tabela avaliação: projeto, nota média sugerida, expandir para ver por critério
- Cards de irregularidades: pares de projetos similares, orçamentos duplicados

### Na tela do avaliador: `/avaliacao/[projetoId]`

- Ícone discreto "dica IA" ao lado de cada critério
- Ao clicar: tooltip com nota sugerida, justificativa, confiança
- Puramente informativo — avaliador ignora se quiser

### Painel de habilitação existente

- Coluna extra "Sugestão IA" com badge verde/vermelho/amarelo
- Tooltip com motivo

## Segurança

- `OPENAI_API_KEY` como env var (nunca no client-side)
- Todas chamadas server-side via API routes
- RLS: resultados isolados por `tenant_id`
- Permissão de execução: gestor, admin, super_admin
- Permissão de leitura: avaliadores veem apenas projetos atribuídos a eles
- Auditoria: logs em `triagem_ia_execucoes` + `logs_auditoria`

## Custo Estimado

- ~2.000 tokens entrada + ~500 tokens saída por projeto
- 50 projetos × 4 critérios ≈ 200 chamadas GPT-4 ≈ $2-5 por triagem
- Embeddings: ~$0.01 por 50 projetos (text-embedding-3-small)
