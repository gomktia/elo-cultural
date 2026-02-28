# Onda 1: Critical Bugfixes for Demo Readiness

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 10 critical bugs that would break during a live demo presentation to a municipal government client in ~30 days.

**Architecture:** Next.js 16 app router with Supabase backend. Server actions for mutations, client components for interactive UI. Supabase RLS for tenant isolation.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL + Auth), TypeScript, Tailwind CSS 4

---

### Task 1: Fix `pontuacao_total` never computed on evaluation finalize

**Files:**
- Modify: `src/app/(dashboard)/avaliacao/[projetoId]/page.tsx:148-192`

**Context:** When an evaluator finalizes their evaluation (`salvarNotas(true)`), the code saves individual criterion scores but never calculates or writes `pontuacao_total` to the `avaliacoes` row. This means `consolidarRanking` (which filters `.not('pontuacao_total', 'is', null)`) will find zero evaluations, and ranking is permanently empty.

**Step 1: Add pontuacao_total calculation before finalizing**

In `src/app/(dashboard)/avaliacao/[projetoId]/page.tsx`, replace lines 179-183:

```tsx
// OLD (line 179-183):
// Update avaliacao status
const updateData: any = { justificativa }
if (finalizar) updateData.status = 'finalizada'

await supabase.from('avaliacoes').update(updateData).eq('id', avaliacao.id)
```

With:

```tsx
// NEW:
// Calculate pontuacao_total (weighted average)
const updateData: any = { justificativa }
if (finalizar) {
  updateData.status = 'finalizada'
  const notasPreenchidas = criterios.filter(c => c.nota !== '')
  if (notasPreenchidas.length > 0) {
    let somaNotasPeso = 0
    let somaPesos = 0
    for (const c of notasPreenchidas) {
      somaNotasPeso += parseFloat(c.nota) * c.peso
      somaPesos += c.peso
    }
    updateData.pontuacao_total = somaPesos > 0
      ? Math.round((somaNotasPeso / somaPesos) * 100) / 100
      : 0
  }
}

await supabase.from('avaliacoes').update(updateData).eq('id', avaliacao.id)
```

**Step 2: Verify** — Run `npm run build` to check for TypeScript errors.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/avaliacao/\[projetoId\]/page.tsx
git commit -m "fix: compute pontuacao_total when evaluator finalizes avaliacao"
```

---

### Task 2: Add "Consolidar Ranking" button to ranking page

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/[id]/ranking/page.tsx`

**Context:** `consolidarRanking` server action exists but is never invoked. The ranking page shows `nota_final` from DB which is always null. Need a button that calls the action and refreshes.

**Step 1: Add consolidar button and filter only habilitados**

Replace the entire file `src/app/(dashboard)/admin/editais/[id]/ranking/page.tsx` with:

```tsx
import { Suspense } from 'react'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { RankingTable } from '@/components/avaliacao/RankingTable'
import { RankingTableSkeleton } from '@/components/avaliacao/RankingTableSkeleton'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { consolidarRanking } from '@/lib/actions/consolidar-ranking'
import { revalidatePath } from 'next/cache'
import type { RankingItem } from '@/components/avaliacao/RankingTable'

export default async function RankingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: edital } = await supabase
    .from('editais')
    .select('id, titulo, numero_edital')
    .eq('id', id)
    .single()

  if (!edital) notFound()

  // Only habilitado projects should appear in ranking
  const { data: projetos } = await supabase
    .from('projetos')
    .select('id, titulo, numero_protocolo, status_atual, nota_final, avaliacoes(id)')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
    .eq('avaliacoes.status', 'finalizada')
    .order('nota_final', { ascending: false, nullsFirst: false })

  const items: RankingItem[] = (projetos || []).map((p, idx) => ({
    posicao: idx + 1,
    titulo: p.titulo,
    protocolo: p.numero_protocolo,
    nota_media: p.nota_final ? Number(p.nota_final) : null,
    num_avaliacoes: Array.isArray(p.avaliacoes) ? p.avaliacoes.length : 0,
    status: p.status_atual,
  }))

  async function handleConsolidar() {
    'use server'
    await consolidarRanking(id)
    revalidatePath(`/admin/editais/${id}/ranking`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/admin/editais/${id}`}>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Ranking</h1>
            <p className="text-sm text-slate-500 font-medium">{edital.titulo} — {edital.numero_edital}</p>
          </div>
        </div>
        <form action={handleConsolidar}>
          <Button type="submit" variant="outline" className="rounded-xl border-slate-200 font-semibold text-xs uppercase tracking-wide gap-2">
            <RefreshCw className="h-4 w-4" />
            Consolidar Ranking
          </Button>
        </form>
      </div>

      <Suspense fallback={<RankingTableSkeleton />}>
        <RankingTable items={items} />
      </Suspense>
    </div>
  )
}
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/admin/editais/\[id\]/ranking/page.tsx
git commit -m "fix: add consolidar ranking button and filter only habilitados"
```

---

### Task 3: Fix `justificativa` not saved + revalidation path in habilitação

**Files:**
- Modify: `src/lib/actions/projeto-actions.ts`

**Context:** The `atualizarHabilitacao` action receives `justificativa` but never writes it to DB. Also `revalidatePath` points to wrong route.

**Step 1: Fix the server action**

Replace the entire file `src/lib/actions/projeto-actions.ts`:

```tsx
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function atualizarHabilitacao(
    projetoId: string,
    status: 'habilitado' | 'inabilitado',
    justificativa: string
) {
    const supabase = await createClient()

    // Fetch the project's edital_id for proper revalidation
    const { data: projeto } = await supabase
        .from('projetos')
        .select('edital_id')
        .eq('id', projetoId)
        .single()

    const { error } = await supabase
        .from('projetos')
        .update({
            status_habilitacao: status,
            justificativa_habilitacao: justificativa || null,
        })
        .eq('id', projetoId)

    if (error) {
        console.error('Erro ao atualizar habilitacao:', error)
        return { success: false, error: error.message }
    }

    // Revalidate the specific habilitacao page
    if (projeto?.edital_id) {
        revalidatePath(`/admin/editais/${projeto.edital_id}/habilitacao`)
    }
    revalidatePath(`/admin/editais`, 'layout')
    return { success: true }
}
```

**Note:** If the column `justificativa_habilitacao` doesn't exist yet in the `projetos` table, we need to add it. Check with:
```sql
-- Run in Supabase SQL editor if column doesn't exist:
ALTER TABLE projetos ADD COLUMN IF NOT EXISTS justificativa_habilitacao TEXT;
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/lib/actions/projeto-actions.ts
git commit -m "fix: save justificativa in habilitacao and revalidate correct path"
```

---

### Task 4: Fix HabilitacaoTable not refreshing after save

**Files:**
- Modify: `src/components/admin/HabilitacaoTable.tsx`
- Modify: `src/components/admin/HabilitacaoSheet.tsx`

**Context:** The table is a client component with stale props. After saving a decision in the sheet, the badge still shows "Pendente" until manual page refresh.

**Step 1: Add `onSuccess` callback to HabilitacaoSheet**

In `src/components/admin/HabilitacaoSheet.tsx`, modify the interface and component:

At line 21, update the interface:
```tsx
interface HabilitacaoSheetProps {
    projeto: Projeto | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}
```

At line 27, update the destructuring:
```tsx
export function HabilitacaoSheet({ projeto, open, onOpenChange, onSuccess }: HabilitacaoSheetProps) {
```

At lines 65-67, add `onSuccess` call:
```tsx
        if (result.success) {
            toast.success('Habilitacao atualizada com sucesso')
            onOpenChange(false)
            onSuccess?.()
        }
```

**Step 2: Add `router.refresh()` in HabilitacaoTable**

In `src/components/admin/HabilitacaoTable.tsx`, add import and callback:

At line 1, add `useRouter`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
```

At line 36, add router:
```tsx
export function HabilitacaoTable({ projetos, aiSugestoes }: HabilitacaoTableProps) {
    const router = useRouter()
    const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null)
```

At lines 142-146, pass `onSuccess`:
```tsx
            <HabilitacaoSheet
                projeto={selectedProjeto}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
                onSuccess={() => router.refresh()}
            />
```

**Step 3: Verify** — Run `npm run build`.

**Step 4: Commit**
```bash
git add src/components/admin/HabilitacaoTable.tsx src/components/admin/HabilitacaoSheet.tsx
git commit -m "fix: refresh habilitacao table after saving decision"
```

---

### Task 5: Fix column name mismatches in triagem IA route

**Files:**
- Modify: `src/app/api/ia/triagem/route.ts:252-279`

**Context:** The POST route inserts with wrong column names:
- `sugestao_habilitacao` → should be `habilitacao_sugerida` (DB column)
- `motivo_habilitacao` → should be `habilitacao_motivo`
- `problemas_habilitacao` → should be `docs_problemas`
- `nota` → should be `nota_sugerida` (in `triagem_ia_notas`)

Verified against migration `20260226_triagem_ia.sql`:
- `triagem_ia_resultados` columns: `habilitacao_sugerida`, `habilitacao_motivo`, `docs_completos`, `docs_problemas`
- `triagem_ia_notas` columns: `nota_sugerida`, `justificativa`, `confianca`

**Step 1: Fix resultados insert (lines 252-263)**

Replace old insert code:
```tsx
      // OLD
      const { data: resultado, error: resultadoError } = await supabase
        .from('triagem_ia_resultados')
        .insert({
          execucao_id: execucao.id,
          projeto_id: projeto.id,
          sugestao_habilitacao: habResult.sugestao,
          motivo_habilitacao: habResult.motivo,
          docs_completos: habResult.docs_completos,
          problemas_habilitacao: habResult.problemas,
          nota_final_ia: notaFinal,
          irregularidades_flags: [],
        })
```

With:
```tsx
      // NEW — column names match DB schema
      const { data: resultado, error: resultadoError } = await supabase
        .from('triagem_ia_resultados')
        .insert({
          execucao_id: execucao.id,
          projeto_id: projeto.id,
          tenant_id,
          habilitacao_sugerida: habResult.sugestao,
          habilitacao_motivo: habResult.motivo,
          docs_completos: habResult.docs_completos,
          docs_problemas: habResult.problemas || [],
          irregularidades_flags: [],
        })
```

Note: `nota_final_ia` doesn't exist in the schema — removed. Also added `tenant_id` which is NOT NULL in the schema.

**Step 2: Fix notas insert (lines 273-279)**

Replace:
```tsx
      // OLD
      const notasInsert = notasResults.map((nr) => ({
          resultado_id: resultado.id,
          criterio_id: nr.criterio_id,
          nota: nr.nota,
          justificativa: nr.justificativa,
          confianca: nr.confianca,
        }))
```

With:
```tsx
      // NEW — nota_sugerida matches DB column
        const notasInsert = notasResults.map((nr) => ({
          resultado_id: resultado.id,
          criterio_id: nr.criterio_id,
          nota_sugerida: nr.nota,
          justificativa: nr.justificativa,
          confianca: nr.confianca,
        }))
```

**Step 3: Verify** — Run `npm run build`.

**Step 4: Commit**
```bash
git add src/app/api/ia/triagem/route.ts
git commit -m "fix: correct column names in triagem IA insert to match DB schema"
```

---

### Task 6: Sync EditalTimeline phase order with server action

**Files:**
- Modify: `src/components/edital/EditalTimeline.tsx:9-16`

**Context:** The server action (`edital-actions.ts`) uses the order: avaliacao_tecnica BEFORE habilitacao. The timeline component has them reversed. The server action is authoritative.

**Step 1: Fix the faseOrder array**

In `src/components/edital/EditalTimeline.tsx`, replace lines 9-16:

```tsx
// OLD:
const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'avaliacao_tecnica',
  'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'resultado_final', 'homologacao', 'arquivamento',
]
```

With:
```tsx
// NEW — matches FASE_ORDER in edital-actions.ts (avaliação before habilitação)
const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
]
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/components/edital/EditalTimeline.tsx
git commit -m "fix: sync EditalTimeline phase order with server action FASE_ORDER"
```

---

### Task 7: Wire dead buttons on edital detail page

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/[id]/page.tsx:147-152`

**Context:** "Publicar Resultado" and "Editar Edital" buttons have no onClick/href. Clicking them does nothing.

**Step 1: Wire both buttons to their respective pages**

Replace lines 147-152:

```tsx
                <Button className="w-full h-10 rounded-xl bg-white text-[var(--brand-primary)] font-semibold hover:bg-slate-50 transition-all text-xs uppercase tracking-wide shadow-sm">
                  Publicar Resultado
                </Button>
                <Button variant="outline" className="w-full h-10 rounded-xl border-white/40 bg-white/15 hover:bg-white/25 text-white font-semibold transition-all text-xs uppercase tracking-wide">
                  Editar Edital
                </Button>
```

With:
```tsx
                <Link href={`/admin/editais/${id}/publicacoes`} className="w-full">
                  <Button className="w-full h-10 rounded-xl bg-white text-[var(--brand-primary)] font-semibold hover:bg-slate-50 transition-all text-xs uppercase tracking-wide shadow-sm">
                    Publicar Resultado
                  </Button>
                </Link>
                <Link href={`/admin/editais/${id}/cronograma`} className="w-full">
                  <Button variant="outline" className="w-full h-10 rounded-xl border-white/40 bg-white/15 hover:bg-white/25 text-white font-semibold transition-all text-xs uppercase tracking-wide">
                    Editar Edital
                  </Button>
                </Link>
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/admin/editais/\[id\]/page.tsx
git commit -m "fix: wire Publicar Resultado and Editar Edital buttons to their pages"
```

---

### Task 8: Filter only habilitados in atribuições page

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/[id]/atribuicoes/page.tsx:32-35`

**Context:** The evaluator assignment matrix shows all projects including inabilitados. Only habilitado projects should be assignable.

**Step 1: Add habilitacao filter**

Replace lines 32-35:
```tsx
  // OLD
  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('edital_id', id)
```

With:
```tsx
  // NEW — only habilitado projects should be assigned to evaluators
  const { data: projetos } = await supabase
    .from('projetos')
    .select('*')
    .eq('edital_id', id)
    .eq('status_habilitacao', 'habilitado')
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/admin/editais/\[id\]/atribuicoes/page.tsx
git commit -m "fix: filter only habilitado projects in evaluator assignment matrix"
```

---

### Task 9: Add tenant_id filter to admin editais listing

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/page.tsx:10-17`

**Context:** The editais listing has no `tenant_id` filter. An admin from one prefeitura can see all editais from all prefeituras. Need to fetch current user's tenant_id and filter.

**Step 1: Add tenant filter**

Replace lines 10-17:
```tsx
// OLD
export default async function AdminEditaisPage() {
  const supabase = await createClient()
  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
```

With:
```tsx
// NEW — filter by tenant
export default async function AdminEditaisPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .eq('tenant_id', profile?.tenant_id)
    .order('created_at', { ascending: false })
```

Also add `redirect` import at top if not present:
```tsx
import { redirect } from 'next/navigation'
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/admin/editais/page.tsx
git commit -m "fix: add tenant_id filter to admin editais listing"
```

---

### Task 10: Hardcoded sidebar timeline on edital detail → dynamic

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/[id]/page.tsx:158-174`

**Context:** The "Linha do Tempo" sidebar always shows "Publicação: Pendente" and "Homologação: Pendente" regardless of actual edital status.

**Step 1: Make timeline dynamic based on edital status**

Replace lines 158-174:
```tsx
          <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-2xl p-6 space-y-6">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-2">Linha do Tempo</h3>
            <div className="space-y-5">
              {[
                { label: 'Criação', date: format(new Date(e.created_at), 'dd MMM, yyyy', { locale: ptBR }), active: true },
                { label: 'Publicação', date: 'Pendente', active: false },
                { label: 'Homologação', date: 'Pendente', active: false },
              ].map((step, i) => (
                <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                  {i !== 2 && <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200/50" />}
                  <div className={`h-4 w-4 rounded-full flex-shrink-0 border-[3px] border-white shadow-sm ${step.active ? 'bg-[var(--brand-primary)]' : 'bg-slate-200'}`} />
                  <div className="space-y-1">
                    <p className={`text-xs font-semibold leading-none ${step.active ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                    <p className="text-xs text-slate-400 font-normal tracking-wide lowercase">{step.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
```

With:
```tsx
          <Card className="border border-slate-200 shadow-sm bg-slate-50 rounded-2xl p-6 space-y-6">
            <h3 className="text-[11px] font-medium text-slate-400 uppercase tracking-wide leading-none mb-2">Linha do Tempo</h3>
            <div className="space-y-5">
              {(() => {
                const faseOrder = [
                  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
                  'divulgacao_inscritos', 'recurso_divulgacao_inscritos',
                  'avaliacao_tecnica', 'resultado_preliminar_avaliacao', 'recurso_avaliacao',
                  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
                  'resultado_definitivo_habilitacao', 'resultado_final', 'homologacao', 'arquivamento',
                ]
                const currentIdx = faseOrder.indexOf(e.status)
                const milestones = [
                  { label: 'Criação', fase: 'criacao' },
                  { label: 'Publicação', fase: 'publicacao' },
                  { label: 'Inscrição', fase: 'inscricao' },
                  { label: 'Avaliação', fase: 'avaliacao_tecnica' },
                  { label: 'Habilitação', fase: 'habilitacao' },
                  { label: 'Resultado Final', fase: 'resultado_final' },
                  { label: 'Homologação', fase: 'homologacao' },
                ]
                return milestones.map((step, i) => {
                  const stepIdx = faseOrder.indexOf(step.fase)
                  const isDone = currentIdx >= stepIdx
                  const isCurrent = e.status === step.fase
                  return (
                    <div key={i} className="flex gap-4 items-start relative pb-4 last:pb-0">
                      {i !== milestones.length - 1 && <div className="absolute left-2 top-5 bottom-0 w-0.5 bg-slate-200/50" />}
                      <div className={`h-4 w-4 rounded-full flex-shrink-0 border-[3px] border-white shadow-sm ${
                        isCurrent ? 'bg-[var(--brand-primary)]' : isDone ? 'bg-[var(--brand-success)]' : 'bg-slate-200'
                      }`} />
                      <div className="space-y-1">
                        <p className={`text-xs font-semibold leading-none ${isDone || isCurrent ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</p>
                        <p className="text-xs text-slate-400 font-normal tracking-wide lowercase">
                          {isCurrent ? 'Em andamento' : isDone ? 'Concluída' : 'Pendente'}
                        </p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </Card>
```

**Step 2: Verify** — Run `npm run build`.

**Step 3: Commit**
```bash
git add src/app/\(dashboard\)/admin/editais/\[id\]/page.tsx
git commit -m "fix: make sidebar timeline dynamic based on edital status"
```

---

## Execution Order

All 10 tasks are independent and can be executed in any order. Recommended order for fastest demo impact:

1. **Task 5** — Triagem IA column names (without this, AI feature is 100% broken)
2. **Task 1** — pontuacao_total (without this, ranking is 100% broken)
3. **Task 2** — Consolidar Ranking button (completes the ranking feature)
4. **Task 3** — Justificativa saved (habilitação data integrity)
5. **Task 4** — Table refresh (habilitação UX)
6. **Task 6** — Timeline sync (visual correctness)
7. **Task 8** — Atribuições filter (logical correctness)
8. **Task 9** — Tenant isolation (security)
9. **Task 7** — Dead buttons (UX)
10. **Task 10** — Sidebar timeline (visual polish)

After all tasks: run `npm run build` one final time to verify no regressions.
