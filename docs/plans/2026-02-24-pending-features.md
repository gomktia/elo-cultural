# Pending Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all remaining features requested for the elo-cultural platform: role-specific registration forms, edital enhancements (recurso deadlines, file upload, inscription form builder), evaluator assignment fixes, permission restrictions, logo upload in settings, and flow improvements.

**Architecture:** Next.js 16 app router with Supabase backend. Client components for interactive forms, server actions for mutations, Supabase Storage for file uploads, RLS policies for access control. New database columns added via migration files.

**Tech Stack:** Next.js 16, React 19, Supabase (PostgreSQL + Storage + Auth), TypeScript, Tailwind CSS 4, Radix UI, Zod validation, React Hook Form

---

### Task 1: Role-Specific Registration Form (after personal data)

**Files:**
- Create: `src/components/cadastro/ProponenteForm.tsx`
- Create: `src/components/cadastro/AvaliadorForm.tsx`
- Create: `src/components/cadastro/GestorForm.tsx`
- Modify: `src/app/(auth)/cadastro/page.tsx`
- Modify: `src/types/database.types.ts`
- Create: `supabase/migrations/20260220000013_profile_extra_fields.sql`

**Context:** After the user fills personal data (nome, email, CPF, telefone), a second step shows role-specific fields. Since all new signups default to `proponente`, the proponente form shows by default. A selector at the top lets them choose their profile type.

**Step 1: Create the migration for extra profile fields**

```sql
-- supabase/migrations/20260220000013_profile_extra_fields.sql

-- Proponente fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS areas_atuacao TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tempo_atuacao TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS renda TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS genero TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orientacao_sexual TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS raca_etnia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS endereco_completo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS estado TEXT;

-- Avaliador fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS curriculo_descricao TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS areas_avaliacao TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lattes_url TEXT;

-- Gestor fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS orgao_vinculado TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS funcao_cargo TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS matricula TEXT;
```

**Step 2: Update TypeScript types**

Add the new fields to the `Profile` interface in `src/types/database.types.ts`.

**Step 3: Create ProponenteForm component**

Fields: areas_atuacao (multi-select chips), tempo_atuacao (select: <1 ano, 1-3 anos, 3-5 anos, 5-10 anos, >10 anos), renda (select: faixas), genero (select), orientacao_sexual (select), raca_etnia (select), pcd (checkbox), endereco_completo, municipio, estado.

**Step 4: Create AvaliadorForm component**

Fields: curriculo_descricao (textarea), areas_avaliacao (multi-select chips), lattes_url (input URL).

**Step 5: Create GestorForm component**

Fields: orgao_vinculado (input), funcao_cargo (input), matricula (input).

**Step 6: Update cadastro page to 2-step flow**

Step 1: Personal data (existing form). Step 2: Role-specific form based on selector (proponente/avaliador/gestor). On submit step 2, update the profile with extra fields via supabase client.

**Step 7: Commit**

---

### Task 2: Edital Recurso Deadlines Configuration

**Files:**
- Modify: `src/app/(dashboard)/admin/editais/novo/page.tsx`
- Modify: `src/types/database.types.ts`
- Create: `supabase/migrations/20260220000014_edital_recurso_deadlines.sql`

**Context:** When creating a new edital, the admin should also configure deadlines for: recurso da lista de inscritos, recurso da seleção, recurso da habilitação documental.

**Step 1: Create migration for new deadline columns**

```sql
-- supabase/migrations/20260220000014_edital_recurso_deadlines.sql
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_inscricao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_inscricao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_selecao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_selecao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS inicio_recurso_habilitacao TIMESTAMPTZ;
ALTER TABLE editais ADD COLUMN IF NOT EXISTS fim_recurso_habilitacao TIMESTAMPTZ;
```

**Step 2: Update Edital TypeScript type**

Add the 6 new fields to the `Edital` interface.

**Step 3: Update NovoEditalPage form**

Add a new section "Prazos de Recurso" with 3 pairs of date inputs:
- Recurso da Lista de Inscritos (início/fim)
- Recurso da Seleção (início/fim)
- Recurso da Habilitação Documental (início/fim)

Insert these values along with the existing edital data on submit.

**Step 4: Commit**

---

### Task 3: Edital File Upload (Documents & Attachments)

**Files:**
- Create: `src/components/edital/EditalFileUpload.tsx`
- Modify: `src/app/(dashboard)/admin/editais/novo/page.tsx`
- Create: `supabase/migrations/20260220000015_edital_documentos.sql`

**Context:** Allow admins to upload the edital PDF and its attachments during edital creation.

**Step 1: Create migration for edital_documentos table**

```sql
-- supabase/migrations/20260220000015_edital_documentos.sql
CREATE TABLE edital_documentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  edital_id UUID REFERENCES editais(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'anexo', -- 'edital_pdf', 'anexo'
  nome_arquivo TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  tamanho_bytes BIGINT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE edital_documentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso isolado por tenant" ON edital_documentos
  FOR ALL USING (tenant_id = public.uid_tenant());
```

**Step 2: Create EditalFileUpload component**

Reuse pattern from DocumentUpload but for edital context. Upload to `{tenantId}/editais/{editalId}/{timestamp}-{filename}`. Accept PDF, DOC, DOCX, XLS, XLSX.

**Step 3: Add upload section to NovoEditalPage**

Add a section "Documentos do Edital" below the description with:
- Upload do edital (PDF principal)
- Upload de anexos (múltiplos arquivos)

Since the edital doesn't have an ID yet at creation time, store files temporarily and insert records after edital is created.

**Step 4: Commit**

---

### Task 4: Add "Divulgação de Inscritos" Phase to Flow

**Files:**
- Modify: `src/types/database.types.ts`
- Modify: `src/components/edital/FaseManager.tsx`
- Modify: `src/components/edital/EditalStatusBadge.tsx`
- Modify: `src/components/edital/AvancarEtapaButton.tsx`
- Modify: `src/lib/actions/edital-actions.ts`
- Create: `supabase/migrations/20260220000016_add_divulgacao_phase.sql`

**Context:** Add "divulgação de inscritos" and "recurso da divulgação" phases to the flow after inscription closes. New flow order:
criacao → publicacao → inscricao → inscricao_encerrada → **divulgacao_inscritos → recurso_divulgacao_inscritos** → avaliacao_tecnica → ...

**Step 1: Create migration to add new enum values**

```sql
ALTER TYPE fase_edital ADD VALUE IF NOT EXISTS 'divulgacao_inscritos' AFTER 'inscricao_encerrada';
ALTER TYPE fase_edital ADD VALUE IF NOT EXISTS 'recurso_divulgacao_inscritos' AFTER 'divulgacao_inscritos';
```

**Step 2: Update FaseEdital type, faseOrder arrays, labels in all components**

**Step 3: Update EditalStatusBadge with new phase styling**

**Step 4: Commit**

---

### Task 5: Fix Evaluator Assignment (Can't Edit/Add)

**Files:**
- Modify: `src/components/avaliacao/AtribuicaoMatrix.tsx`
- Modify: `src/app/(dashboard)/admin/editais/[id]/atribuicoes/page.tsx`

**Context:** The assignment matrix deletes all `em_andamento` evaluations and re-inserts. This may fail if RLS blocks the delete or if evaluations have already progressed. Fix the save logic and add ability to add new evaluators.

**Step 1: Fix AtribuicaoMatrix save logic**

- Instead of delete-all + re-insert, use upsert logic
- Add a link/button to navigate to user management to add new evaluators
- Show proper error messages
- Add loading states during save

**Step 2: Add "Adicionar Avaliador" flow**

Add a button that links to `/admin/usuarios` with a hint to change a user's role to avaliador, or add an inline quick-assign dropdown.

**Step 3: Commit**

---

### Task 6: Restrict Gestor from Changing Other Profiles

**Files:**
- Modify: `src/app/(dashboard)/admin/usuarios/page.tsx`

**Context:** Gestors should NOT be able to change other users' roles. Only admins should have this ability.

**Step 1: Add role check to the usuarios page**

Fetch the current user's role. If role is `gestor`, hide the role selector dropdown - show it as read-only badge instead. Only show the editable dropdown for `admin` and `super_admin` roles.

**Step 2: Commit**

---

### Task 7: Logo Upload in Settings (Header + Footer)

**Files:**
- Modify: `src/app/(dashboard)/admin/configuracoes/page.tsx`
- Modify: `src/components/layout/AppSidebar.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

**Context:** Allow admins to upload a custom logo (header) and footer logo (government branding) in the settings page. Store in Supabase Storage and save URL in tenants table.

**Step 1: Add logo_rodape_url column to tenants**

The `logo_url` column already exists. Add `logo_rodape_url` for the footer.

```sql
-- supabase/migrations/20260220000017_tenant_footer_logo.sql
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_rodape_url TEXT;
```

**Step 2: Add logo upload section to configuracoes page**

Two upload areas:
- Logo principal (displayed in sidebar header)
- Logo de rodapé (government branding footer)

Upload to `{tenantId}/branding/{type}-{timestamp}.{ext}`. Save URL to tenants table.

**Step 3: Update AppSidebar to use tenant logo_url**

Replace the hardcoded `/icon-192.png` with the tenant's `logo_url` if available, falling back to the default.

**Step 4: Add footer with logo_rodape_url to the dashboard layout**

**Step 5: Commit**

---

### Task 8: Confirm Auto-Advance After Deadline

**Files:**
- Modify: `src/app/api/cron/bloqueio-fases/route.ts`

**Context:** The cron job currently only blocks expired phases (sets bloqueada=true). It should ALSO auto-advance the edital status when a phase deadline expires.

**Step 1: Enhance cron job to also advance edital status**

After blocking expired phases, check if the edital's current phase matches the blocked phase. If so, advance to the next phase in the workflow.

**Step 2: Commit**

---

## Execution Order

Priority order (dependencies):
1. Task 1 (Registration form) - unblocks user onboarding
2. Task 5 (Fix evaluator assignment) - unblocks evaluator workflow
3. Task 6 (Restrict gestor permissions) - security fix
4. Task 2 (Recurso deadlines) - edital creation enhancement
5. Task 3 (Edital file upload) - edital creation enhancement
6. Task 4 (Divulgação phase) - flow enhancement
7. Task 7 (Logo upload) - branding
8. Task 8 (Auto-advance) - automation
