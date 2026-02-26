# Módulo de Prestação de Contas — Design

Data: 2026-02-26

## Contexto

Após aprovação de projetos culturais (homologação), proponentes precisam prestar contas da execução financeira e das atividades realizadas. Atualmente o sistema não tem nenhuma infraestrutura pós-aprovação.

## Decisões

- **Foco:** Execução financeira + relatório de atividades
- **Análise:** Gestor aprova/rejeita com parecer técnico
- **Abordagem:** Tabela dedicada `prestacoes_contas` com workflow simples

## Banco de Dados

### Nova tabela: `prestacoes_contas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid PK | |
| tenant_id | uuid FK → tenants | Isolamento multi-tenant |
| projeto_id | uuid FK → projetos | Projeto aprovado |
| proponente_id | uuid FK → profiles | Quem envia |
| valor_total_executado | decimal(12,2) | Valor gasto reportado |
| resumo_atividades | text | Relatório descritivo |
| observacoes | text | Notas adicionais |
| status | text | rascunho, enviada, em_analise, aprovada, reprovada, com_pendencias |
| parecer_gestor | text | Análise técnica |
| analisado_por | uuid FK → profiles | Gestor que analisou |
| data_envio | timestamptz | Quando foi enviada |
| data_analise | timestamptz | Quando foi analisada |
| created_at | timestamptz | |

### Expandir `projeto_documentos.tipo`

Adicionar: `comprovante_despesa`, `relatorio_atividade`, `prestacao_contas`

## Workflow

```
Proponente: rascunho → preenche → anexa comprovantes → envia
Gestor: recebe → analisa documentos → escreve parecer → aprova/reprova/pendências
Se pendências: proponente corrige e reenvia
```

## Páginas

1. **Proponente** — `/projetos/[id]/prestacao-contas`: formulário + upload + status
2. **Gestor** — `/gestor/prestacao-contas`: tabela de prestações + análise com parecer

## Segurança (RLS)

- Proponente: CRUD próprias prestações
- Gestor: leitura + parecer no seu tenant
- Admin/super_admin: acesso total
- Auditoria em cada mudança de status
