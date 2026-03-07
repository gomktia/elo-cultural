# Design: Formulário Condicional por Tipo de Edital + Requerimentos de Execução

Data: 2026-03-07

## Feature 1: Tipo de Edital → Formulário Condicional

O `tipo_edital` define um perfil de seções visíveis no `InscricaoForm`. Cada tipo mostra/esconde seções específicas.

### Mapa de visibilidade por tipo

| Seção | fomento | premiacao | credenciamento | chamamento_publico | cultura_viva |
|-------|---------|-----------|----------------|-------------------|-------------|
| Dados básicos | sim | sim | sim | sim | sim |
| Objetivos/Metas | sim | nao | nao | sim | sim |
| Equipe técnica | sim | nao | sim | sim | sim |
| Orçamento detalhado | sim | nao | nao | sim | sim |
| Cronograma | sim | nao | nao | sim | sim |
| Acessibilidade | sim | sim | nao | sim | sim |
| Contrapartida social | sim | nao | nao | sim | sim |
| Documentos | sim | sim | sim | sim | sim |
| Cultura Viva extras | nao | nao | nao | nao | sim |

### Implementação

- Objeto `PERFIL_FORMULARIO` mapeia cada tipo para `{ secoesVisiveis: string[] }`
- `InscricaoForm` recebe `tipoEdital` como prop
- Renderização condicional por seção
- Etapas do stepper ajustadas conforme seções visíveis

## Feature 2: Requerimentos durante Execução

### Tipos pré-definidos

- `prorrogacao` — Prorrogação de prazo
- `alteracao_equipe` — Alteração de equipe
- `remanejamento_recursos` — Remanejamento de recursos
- `alteracao_cronograma` — Alteração de cronograma
- `substituicao_item` — Substituição de item orçamentário
- `outros` — Outros

### Fluxo com diligência (max 2)

```
pendente → em_analise → [diligencia → respondida →]* → deferido/indeferido
```

### Tabela `requerimentos`

- `id`, `tenant_id`, `projeto_id`, `termo_id`, `proponente_id`
- `tipo` (enum dos tipos acima)
- `justificativa` (TEXT)
- `valor_envolvido` (DECIMAL, opcional)
- `documentos` (JSONB, array de arquivos)
- `status`: pendente, em_analise, diligencia, respondida, deferido, indeferido
- `diligencia_count` (max 2)
- `diligencia_texto`, `diligencia_resposta`
- `decisao_texto`, `decidido_por`, `decidido_em`
- `created_at`, `updated_at`, `created_by`

### UI

- Proponente: botão "Novo Requerimento" na página do projeto (só quando termo vigente)
- Admin/Gestor: listagem de requerimentos com filtros por status/tipo, painel de decisão
