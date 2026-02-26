# IA para Triagem Automática — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-powered screening module that analyzes edital projects for document qualification, criterion-based scoring suggestions, and plagiarism/irregularity detection using OpenAI GPT-4.

**Architecture:** Síncrono server-side processing triggered by gestor button click. Three new DB tables store execution history, per-project results, and per-criterion score suggestions. OpenAI GPT-4 for text analysis, text-embedding-3-small for similarity detection. Results shown in dedicated admin page + inline hints in avaliador and habilitação views.

**Tech Stack:** OpenAI SDK (GPT-4 + embeddings), Supabase (Postgres + RLS), Next.js API routes, React server/client components, Tailwind CSS.

---

### Task 1: Install OpenAI SDK

**Files:**
- Modify: `package.json`

**Step 1: Install the package**

Run: `npm install openai`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai SDK dependency"
```

---

### Task 2: Create database migration

**Files:**
- Create: `supabase/migrations/20260226_triagem_ia.sql`

**Step 1: Write the migration**

```sql
-- ============================================================
-- Triagem IA — Tabelas para análise automatizada de projetos
-- ============================================================

-- 1. Execuções de triagem
CREATE TABLE public.triagem_ia_execucoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    edital_id UUID NOT NULL REFERENCES public.editais(id),
    executado_por UUID NOT NULL REFERENCES auth.users(id),
    tipo VARCHAR(50) DEFAULT 'completa' CHECK (tipo IN ('habilitacao', 'avaliacao', 'irregularidades', 'completa')),
    status VARCHAR(50) DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'concluida', 'erro')),
    total_projetos INTEGER DEFAULT 0,
    projetos_analisados INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    concluida_em TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_triagem_exec_tenant ON public.triagem_ia_execucoes(tenant_id);
CREATE INDEX idx_triagem_exec_edital ON public.triagem_ia_execucoes(edital_id);

ALTER TABLE public.triagem_ia_execucoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam execuções do tenant"
ON public.triagem_ia_execucoes FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
    )
);

CREATE POLICY "Avaliador lê execuções do tenant"
ON public.triagem_ia_execucoes FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'avaliador'
    )
);

-- 2. Resultados por projeto
CREATE TABLE public.triagem_ia_resultados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execucao_id UUID NOT NULL REFERENCES public.triagem_ia_execucoes(id) ON DELETE CASCADE,
    projeto_id UUID NOT NULL REFERENCES public.projetos(id),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id),
    habilitacao_sugerida VARCHAR(50) CHECK (habilitacao_sugerida IN ('habilitado', 'inabilitado', 'pendencia')),
    habilitacao_motivo TEXT,
    docs_completos BOOLEAN DEFAULT false,
    docs_problemas JSONB DEFAULT '[]'::jsonb,
    irregularidades_flags JSONB DEFAULT '[]'::jsonb,
    similaridade_max DECIMAL(5,4) DEFAULT 0,
    projeto_similar_id UUID REFERENCES public.projetos(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_triagem_res_execucao ON public.triagem_ia_resultados(execucao_id);
CREATE INDEX idx_triagem_res_projeto ON public.triagem_ia_resultados(projeto_id);

ALTER TABLE public.triagem_ia_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam resultados do tenant"
ON public.triagem_ia_resultados FOR ALL
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.profiles
        WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
    )
);

CREATE POLICY "Avaliador lê resultados de projetos atribuídos"
ON public.triagem_ia_resultados FOR SELECT
USING (
    projeto_id IN (
        SELECT projeto_id FROM public.avaliacoes
        WHERE avaliador_id = auth.uid()
    )
);

-- 3. Sugestões de nota por critério
CREATE TABLE public.triagem_ia_notas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resultado_id UUID NOT NULL REFERENCES public.triagem_ia_resultados(id) ON DELETE CASCADE,
    criterio_id UUID NOT NULL REFERENCES public.criterios(id),
    nota_sugerida DECIMAL(5,2) NOT NULL,
    justificativa TEXT NOT NULL,
    confianca DECIMAL(3,2) DEFAULT 0.5 CHECK (confianca >= 0 AND confianca <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_triagem_notas_resultado ON public.triagem_ia_notas(resultado_id);
CREATE INDEX idx_triagem_notas_criterio ON public.triagem_ia_notas(criterio_id);

ALTER TABLE public.triagem_ia_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gestor/Admin acessam notas do tenant"
ON public.triagem_ia_notas FOR ALL
USING (
    resultado_id IN (
        SELECT id FROM public.triagem_ia_resultados
        WHERE tenant_id IN (
            SELECT tenant_id FROM public.profiles
            WHERE id = auth.uid() AND role IN ('gestor', 'admin', 'super_admin')
        )
    )
);

CREATE POLICY "Avaliador lê notas de projetos atribuídos"
ON public.triagem_ia_notas FOR SELECT
USING (
    resultado_id IN (
        SELECT r.id FROM public.triagem_ia_resultados r
        JOIN public.avaliacoes a ON a.projeto_id = r.projeto_id
        WHERE a.avaliador_id = auth.uid()
    )
);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260226_triagem_ia.sql
git commit -m "feat(db): add triagem_ia tables (execucoes, resultados, notas)"
```

---

### Task 3: Add TypeScript types

**Files:**
- Modify: `src/types/database.types.ts`

**Step 1: Add new types at end of file**

```typescript
// ============================================================
// Triagem IA
// ============================================================

export type TipoTriagem = 'habilitacao' | 'avaliacao' | 'irregularidades' | 'completa'
export type StatusTriagem = 'em_andamento' | 'concluida' | 'erro'
export type SugestaoHabilitacao = 'habilitado' | 'inabilitado' | 'pendencia'

export interface TriagemExecucao {
  id: string
  tenant_id: string
  edital_id: string
  executado_por: string
  tipo: TipoTriagem
  status: StatusTriagem
  total_projetos: number
  projetos_analisados: number
  erro_mensagem: string | null
  created_at: string
  concluida_em: string | null
}

export interface TriagemResultado {
  id: string
  execucao_id: string
  projeto_id: string
  tenant_id: string
  habilitacao_sugerida: SugestaoHabilitacao | null
  habilitacao_motivo: string | null
  docs_completos: boolean
  docs_problemas: string[]
  irregularidades_flags: string[]
  similaridade_max: number
  projeto_similar_id: string | null
  created_at: string
}

export interface TriagemNota {
  id: string
  resultado_id: string
  criterio_id: string
  nota_sugerida: number
  justificativa: string
  confianca: number
  created_at: string
}

// Joined types
export type TriagemResultadoWithProjeto = TriagemResultado & {
  projetos: Pick<Projeto, 'titulo' | 'numero_protocolo' | 'resumo' | 'orcamento_total'> | null
  projeto_similar: Pick<Projeto, 'titulo' | 'numero_protocolo'> | null
}

export type TriagemResultadoWithNotas = TriagemResultado & {
  triagem_ia_notas: (TriagemNota & {
    criterios: Pick<Criterio, 'descricao' | 'nota_minima' | 'nota_maxima' | 'peso'> | null
  })[]
}

export type TriagemExecucaoWithResults = TriagemExecucao & {
  triagem_ia_resultados: TriagemResultadoWithProjeto[]
}
```

**Step 2: Commit**

```bash
git add src/types/database.types.ts
git commit -m "feat(types): add TriagemIA types"
```

---

### Task 4: Create OpenAI client helper

**Files:**
- Create: `src/lib/openai.ts`

**Step 1: Create the helper**

```typescript
import OpenAI from 'openai'

let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    client = new OpenAI({ apiKey })
  }
  return client
}
```

**Step 2: Add env var to `.env.local.example` if it exists, or document it**

Add `OPENAI_API_KEY=sk-...` to environment.

**Step 3: Commit**

```bash
git add src/lib/openai.ts
git commit -m "feat: add OpenAI client helper"
```

---

### Task 5: Create AI prompt templates

**Files:**
- Create: `src/lib/ia/prompts.ts`

**Step 1: Write prompt templates**

The file should export 3 functions that build structured prompts for GPT-4:

1. `buildHabilitacaoPrompt(projeto, edital)` — Analyzes if project documents are complete and meets basic requirements. Returns JSON with `{ sugestao: "habilitado"|"inabilitado"|"pendencia", motivo: string, docs_completos: boolean, problemas: string[] }`.

2. `buildAvaliacaoPrompt(projeto, criterio)` — For each criterion, evaluates the project and returns JSON with `{ nota: number, justificativa: string, confianca: number }`. The nota must be within the criterion's min/max range.

3. `buildIrregularidadesPrompt(projeto, outrosProjetos)` — Not used directly with GPT-4. This is handled by embeddings comparison instead.

All prompts must:
- Be in Portuguese
- Request JSON output explicitly
- Include the edital context (title, objective)
- Include project data (resumo, descricao_tecnica, orcamento_total, cronograma_execucao)

**Step 2: Commit**

```bash
git add src/lib/ia/prompts.ts
git commit -m "feat: add AI prompt templates for triagem"
```

---

### Task 6: Create similarity detection utility

**Files:**
- Create: `src/lib/ia/similaridade.ts`

**Step 1: Write the similarity module**

This module should:
1. Take an array of projects with their text content (resumo + descricao_tecnica)
2. Call OpenAI `text-embedding-3-small` to generate embeddings for each project
3. Compute cosine similarity between all pairs
4. Return pairs with similarity > 0.85 as flags
5. Also check for duplicate `orcamento_total` values across projects

Export function: `detectarIrregularidades(projetos: ProjetoForAnalysis[]): Promise<IrregularidadeResult[]>`

Where `IrregularidadeResult` has: `{ projetoId, projetoSimilarId, similaridade, tipo: "texto_similar" | "orcamento_duplicado" }`

**Step 2: Commit**

```bash
git add src/lib/ia/similaridade.ts
git commit -m "feat: add similarity detection via OpenAI embeddings"
```

---

### Task 7: Create main triagem API route (POST)

**Files:**
- Create: `src/app/api/ia/triagem/route.ts`

**Step 1: Write the API route**

POST handler that:
1. Validates auth (must be gestor/admin/super_admin)
2. Accepts `{ edital_id }` in body
3. Creates `triagem_ia_execucoes` record with status `em_andamento`
4. Fetches all projects for the edital with their documents
5. Fetches all criteria for the edital
6. For each project:
   a. Calls GPT-4 with habilitacao prompt → parses JSON response
   b. For each criterion, calls GPT-4 with avaliacao prompt → parses JSON response
   c. Saves `triagem_ia_resultados` record
   d. Saves `triagem_ia_notas` records (one per criterion)
   e. Updates `projetos_analisados` counter on execution record
7. After all projects: calls `detectarIrregularidades()` and updates resultado records with similarity data
8. Updates execution status to `concluida`
9. Returns execution ID

Error handling: if any step fails, update execution to `erro` with message.

Auth pattern (from existing codebase):
```typescript
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) {
  return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 })
}
// Check role via profiles table
const { data: profile } = await supabase
  .from('profiles')
  .select('role, tenant_id')
  .eq('id', user.id)
  .single()
if (!profile || !['gestor', 'admin', 'super_admin'].includes(profile.role)) {
  return NextResponse.json({ error: 'Permissao negada' }, { status: 403 })
}
```

**Step 2: Commit**

```bash
git add src/app/api/ia/triagem/route.ts
git commit -m "feat(api): add POST /api/ia/triagem - main AI screening endpoint"
```

---

### Task 8: Create triagem results API route (GET)

**Files:**
- Create: `src/app/api/ia/triagem/[editalId]/route.ts`

**Step 1: Write the GET handler**

Returns the latest completed triagem for a given edital:
1. Auth check (any authenticated user — RLS handles visibility)
2. Fetch latest `triagem_ia_execucoes` where `edital_id = param` and `status = 'concluida'`, ordered by `created_at DESC`, limit 1
3. Fetch all `triagem_ia_resultados` for that execution, joined with `projetos(titulo, numero_protocolo, resumo, orcamento_total)` and `projeto_similar:projetos!projeto_similar_id(titulo, numero_protocolo)`
4. For each resultado, fetch `triagem_ia_notas` joined with `criterios(descricao, nota_minima, nota_maxima, peso)`
5. Return combined data

**Step 2: Create status sub-route**

- Create: `src/app/api/ia/triagem/[editalId]/status/route.ts`

GET handler that returns the latest execution (any status) for polling progress:
```json
{ "status": "em_andamento", "total_projetos": 25, "projetos_analisados": 12 }
```

**Step 3: Commit**

```bash
git add src/app/api/ia/triagem/
git commit -m "feat(api): add GET triagem results and status endpoints"
```

---

### Task 9: Create main triagem page

**Files:**
- Create: `src/app/(dashboard)/admin/editais/[id]/triagem-ia/page.tsx`
- Create: `src/components/ia/TriagemPanel.tsx`

**Step 1: Create the page (server component)**

Follow exact pattern from `admin/auditoria/page.tsx`:
- Fetch edital info from Supabase
- Fetch latest triagem execution + results
- Pass data to `<TriagemPanel>` client component

**Step 2: Create TriagemPanel client component**

This is the main UI. It should have:

**Header section:**
- Title: "Triagem por IA" with the brand accent bar
- Subtitle: edital title
- Button: "Executar Triagem Completa" (calls POST /api/ia/triagem)
- When running: progress bar + "Analisando projeto X de Y..."

**3 Tabs** (use simple state-based tabs, not a library):

**Tab 1 — Habilitação:**
- Table with columns: Protocolo, Título, Sugestão IA (badge), Motivo, Docs
- Badge colors: green for habilitado, red for inabilitado, amber for pendência
- Each row expandable to show document problems list

**Tab 2 — Avaliação:**
- Table with columns: Protocolo, Título, Nota Média Sugerida, Confiança
- Each row expandable to show per-criterion breakdown (nota, justificativa, confiança bar)

**Tab 3 — Irregularidades:**
- Cards for each flag: "Possível cópia" with both project names + % similarity
- Cards for duplicate budgets
- Empty state if no irregularities found

**Styling:** Follow exact codebase patterns:
- `rounded-[32px]` containers, `border-slate-100`, `shadow-sm`
- `text-xs uppercase tracking-wide` for table headers
- `animate-in fade-in` animations
- `var(--brand-primary)` for accent color
- Lucide icons: `Brain`, `Sparkles`, `AlertTriangle`, `CheckCircle`, `XCircle`

**Step 3: Commit**

```bash
git add src/app/(dashboard)/admin/editais/[id]/triagem-ia/
git add src/components/ia/
git commit -m "feat(ui): add triagem IA page with tabs (habilitação, avaliação, irregularidades)"
```

---

### Task 10: Add AI hints to avaliador page

**Files:**
- Modify: `src/app/(dashboard)/avaliacao/[projetoId]/page.tsx`

**Step 1: Fetch triagem data**

In the server component, after fetching the project and criteria, also fetch:
```typescript
const { data: triagemNotas } = await supabase
  .from('triagem_ia_notas')
  .select('criterio_id, nota_sugerida, justificativa, confianca')
  .eq('resultado_id', resultadoId)
```

Where `resultadoId` comes from the latest triagem execution for this project's edital.

**Step 2: Pass to client component and show inline hints**

For each criterion in the evaluation form, if there's a matching triagem nota:
- Show a small `Sparkles` icon (lucide) next to the criterion name
- On click/hover: show a tooltip/popover with:
  - "Sugestão IA: 8.5/10"
  - "Justificativa: ..."
  - Confidence bar (visual)
  - Disclaimer: "Apenas sugestão — sua avaliação independente é o que conta."

Use existing Tooltip component from `@/components/ui/tooltip`.

**Step 3: Commit**

```bash
git add src/app/(dashboard)/avaliacao/
git commit -m "feat(ui): add AI score hints in avaliador evaluation page"
```

---

### Task 11: Add AI suggestion column to habilitação table

**Files:**
- Modify: `src/components/admin/HabilitacaoTable.tsx`
- Modify: `src/app/(dashboard)/admin/editais/[id]/habilitacao/page.tsx`

**Step 1: Fetch triagem results in the page**

In the habilitação page server component, fetch the latest triagem results for the edital:
```typescript
const { data: triagemResultados } = await supabase
  .from('triagem_ia_resultados')
  .select('projeto_id, habilitacao_sugerida, habilitacao_motivo, docs_completos')
  .eq('execucao_id', latestExecucaoId)
```

Pass as prop to `HabilitacaoTable`.

**Step 2: Add column to table**

Add a new column "Sugestão IA" between Status and Ações:
- Badge with color: green (habilitado), red (inabilitado), amber (pendência)
- Tooltip on hover showing the motivo
- If no triagem has been run, show a muted "—"

**Step 3: Commit**

```bash
git add src/components/admin/HabilitacaoTable.tsx
git add src/app/(dashboard)/admin/editais/[id]/habilitacao/
git commit -m "feat(ui): add AI suggestion column to habilitação table"
```

---

### Task 12: Add sidebar navigation + link from edital detail

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

**Step 1: Add navigation entry**

The triagem page is per-edital (`/admin/editais/[id]/triagem-ia`), so it shouldn't be a top-level sidebar item. Instead, it's accessed from within the edital detail pages.

Check if there's an edital sub-navigation (tabs/links within the edital detail). If so, add "Triagem IA" with `Brain` icon. If not, the page is already accessible from the triagem-ia route — no sidebar changes needed.

Look at: `src/app/(dashboard)/admin/editais/[id]/layout.tsx` or the edital detail page for sub-navigation pattern.

**Step 2: Add link from edital admin pages if needed**

If there's an edital sub-nav with links to criterios, atribuicoes, habilitacao, ranking, recursos — add "Triagem IA" to that list.

**Step 3: Commit**

```bash
git add src/components/ src/app/(dashboard)/admin/editais/
git commit -m "feat(nav): add Triagem IA link to edital sub-navigation"
```

---

### Task 13: Build verification

**Step 1: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 2: Fix any build errors**

If there are errors, fix them.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete AI screening module (triagem automática por IA)"
```

---

## Execution Order & Dependencies

```
Task 1 (install openai)
  └→ Task 4 (openai client)
      └→ Task 5 (prompts)
      └→ Task 6 (similarity)
          └→ Task 7 (POST API) ← depends on 5+6
              └→ Task 8 (GET APIs)
                  └→ Task 9 (main page) ← depends on 8
                  └→ Task 10 (avaliador hints) ← depends on 8
                  └→ Task 11 (habilitação column) ← depends on 8

Task 2 (migration) ← independent, can run in parallel with 1
Task 3 (types) ← independent, can run in parallel with 1+2

Task 12 (navigation) ← depends on 9
Task 13 (build check) ← depends on all
```

**Parallelizable groups:**
- Group A: Tasks 1, 2, 3 (all independent)
- Group B: Tasks 4, 5, 6 (depend on Task 1)
- Group C: Tasks 7, 8 (sequential)
- Group D: Tasks 9, 10, 11 (depend on 8, but independent of each other)
- Group E: Tasks 12, 13 (final)
