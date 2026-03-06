# Design: Dashboards por Perfil

**Data:** 2026-03-05
**Escopo:** Criar dashboards personalizados para Admin/Gestor, Avaliador e Proponente

---

## 1. Migration

- `ALTER TABLE editais ADD COLUMN valor_total DECIMAL(12,2)` — dotacao orcamentaria do edital
- Campo no formulario de criacao/edicao do edital

---

## 2. Dashboard Admin + Gestor (Centro de Comando)

**Rota:** `/gestor` (admin redireciona aqui ao inves de `/admin/editais`)

### Layout 2 colunas (lg:grid-cols-3)

**Coluna esquerda (lg:col-span-2):**

1. **Header** — saudacao + data + botao "Novo Edital"

2. **Cards metricas** (grid 2x2):
   - Editais Ativos (count)
   - Inscricoes (count + % habilitados)
   - Orcamento (soma valor_total editais vs soma orcamento_total projetos selecionados, barra de progresso)
   - Avaliacoes (concluidas vs total, barra de progresso)

3. **Graficos** (grid 2 colunas, Recharts):
   - Distribuicao por Categoria — PieChart/donut
   - Orcamento por Edital — BarChart horizontal (dotacao vs comprometido)

4. **Pipeline dos Editais** — lista compacta:
   - Titulo + numero + status badge
   - Barra de progresso da fase (16 fases = % visual)
   - Mini stats inline: inscritos | habilitados | avaliados

**Coluna direita (lg:col-span-1):**

5. **Painel de Pendencias** — feed de alertas:
   - Habilitacoes pendentes (projetos aguardando revisao documental)
   - Avaliacoes atrasadas (atribuidas sem nota)
   - Recursos sem resposta (status pendente)
   - Prazos proximos (< 3 dias para fim de inscricao/recurso)
   - Prestacoes aguardando (status enviada)
   - Cada item: icone + contagem + link direto

6. **Acesso Rapido** — atalhos existentes

---

## 3. Dashboard Avaliador

**Rota:** `/avaliacao` (substitui a lista simples atual)

1. **Cards** (grid 4):
   - Total Atribuidas
   - Concluidas
   - Pendentes
   - Nota Media

2. **Barra de progresso** — "X de Y avaliacoes concluidas"

3. **Lista priorizada**:
   - Pendentes primeiro (com botao "Avaliar")
   - Concluidas depois (nota exibida)
   - Editais em que participa
   - Prazo mais proximo

---

## 4. Dashboard Proponente

**Rota:** `/projetos` (adiciona header com dashboard antes da lista)

1. **Cards** (grid 4):
   - Projetos Inscritos
   - Selecionados/Aprovados
   - Pendentes
   - Editais Abertos (do tenant)

2. **Lista de projetos** (mantida, com StatusTracker)

3. **Alertas inline** — "Projeto X habilitado", "Prazo de recurso ate dd/mm"

---

## Tecnologias

- **Graficos:** Recharts (ja instalado)
- **Queries:** Server-side no page.tsx (SSR)
- **Componentes client:** Apenas graficos e interacoes
