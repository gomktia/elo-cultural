# Proponente Global + Multi-Tenant Login + Gov.br — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make proponentes domain-agnostic (global citizens), restrict staff login by tenant domain, filter public editais by tenant, add gov.br login button (visual + OAuth structure).

**Architecture:** Proponentes get `tenant_id = NULL` in profiles. RLS gains additional policies for global proponentes. Login validates staff role against domain tenant. Dashboard branding uses cookie tenant (not profile tenant) for proponentes. Gov.br OAuth scaffolded but disabled until credentials available.

**Tech Stack:** Next.js 16 (App Router), Supabase (Auth + RLS), PostgreSQL, Tailwind CSS

---

### Task 1: SQL Migration — Proponente Global Schema

**Files:**
- Create: `supabase/migrations/20260304000010_proponente_global.sql`

**Step 1: Write the migration**

```sql
-- ============================================================================
-- MIGRATION: Proponente Global — tenant_id nullable + RLS + trigger update
-- ============================================================================

-- 1. Allow NULL tenant_id for proponentes
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

-- 2. Constraint: staff roles MUST have tenant_id
ALTER TABLE public.profiles ADD CONSTRAINT check_tenant_required_for_staff
  CHECK (role = 'proponente' OR tenant_id IS NOT NULL);

-- 3. Helper function: check if current user is a global proponente
CREATE OR REPLACE FUNCTION public.is_global_proponente()
RETURNS BOOLEAN AS $$
  SELECT public.uid_role() = 'proponente'
     AND public.uid_tenant() IS NULL;
$$ LANGUAGE SQL STABLE;

-- 4. RLS: Proponente global can SELECT their own projects (any tenant)
CREATE POLICY "projetos_select_proponente_global"
ON public.projetos FOR SELECT
USING (public.is_global_proponente() AND proponente_id = auth.uid());

-- 5. RLS: Proponente global can INSERT projects (tenant comes from edital)
CREATE POLICY "projetos_insert_proponente_global"
ON public.projetos FOR INSERT
WITH CHECK (
  public.is_global_proponente()
  AND proponente_id = auth.uid()
);

-- 6. RLS: Proponente global can see active editais from any tenant
CREATE POLICY "editais_select_proponente_global"
ON public.editais FOR SELECT
USING (public.is_global_proponente() AND active = true);

-- 7. RLS: Proponente global can read/update own profile
CREATE POLICY "profiles_select_own_global"
ON public.profiles FOR SELECT
USING (public.is_global_proponente() AND id = auth.uid());

CREATE POLICY "profiles_update_own_global"
ON public.profiles FOR UPDATE
USING (public.is_global_proponente() AND id = auth.uid());

-- 8. RLS: Proponente global can see tenants (for unified dashboard)
CREATE POLICY "tenants_select_proponente_global"
ON public.tenants FOR SELECT
USING (public.is_global_proponente() AND status = 'ativo');

-- 9. RLS: Proponente global can read edital categories (for inscricao)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'edital_categorias') THEN
    EXECUTE 'CREATE POLICY "edital_categorias_select_proponente_global"
      ON public.edital_categorias FOR SELECT
      USING (public.is_global_proponente())';
  END IF;
END $$;

-- 10. Update handle_new_user trigger: proponente gets NULL tenant_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  _tenant_id UUID;
  _role TEXT;
BEGIN
  -- Determine role (default: proponente)
  _role := COALESCE(NEW.raw_app_meta_data->>'role', 'proponente');

  -- For proponentes: tenant_id is always NULL (global citizen)
  IF _role = 'proponente' THEN
    _tenant_id := NULL;
  ELSE
    -- Staff: resolve tenant_id (required)
    _tenant_id := (NEW.raw_app_meta_data->>'tenant_id')::UUID;
    IF _tenant_id IS NULL THEN
      _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
    END IF;
    IF _tenant_id IS NULL THEN
      RAISE EXCEPTION 'Staff signup requires a tenant_id';
    END IF;
  END IF;

  INSERT INTO public.profiles (id, tenant_id, nome, cpf_cnpj, telefone, consentimento_lgpd, data_consentimento, role)
  VALUES (
    NEW.id,
    _tenant_id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.raw_user_meta_data->>'cpf_cnpj',
    NEW.raw_user_meta_data->>'telefone',
    COALESCE((NEW.raw_user_meta_data->>'consentimento_lgpd')::BOOLEAN, false),
    CASE WHEN (NEW.raw_user_meta_data->>'consentimento_lgpd')::BOOLEAN = true THEN now() ELSE NULL END,
    _role::user_role
  );

  -- Propagate to JWT app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
    'tenant_id', _tenant_id::text,
    'role', _role
  )
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260304000010_proponente_global.sql
git commit -m "feat(db): proponente global — nullable tenant_id, RLS policies, trigger update"
```

---

### Task 2: Migrate Existing Proponentes to Global

**Files:**
- Create: `supabase/migrations/20260304000011_migrate_existing_proponentes.sql`

**Step 1: Write the migration**

```sql
-- ============================================================================
-- MIGRATION: Set existing proponentes to global (tenant_id = NULL)
-- ============================================================================

-- 1. Clear tenant_id from all proponente profiles
UPDATE public.profiles
SET tenant_id = NULL, updated_at = now()
WHERE role = 'proponente' AND tenant_id IS NOT NULL;

-- 2. Update JWT app_metadata for existing proponentes
-- This ensures uid_tenant() returns NULL for them
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"tenant_id": null}'::jsonb
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'proponente');
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260304000011_migrate_existing_proponentes.sql
git commit -m "feat(db): migrate existing proponentes to global (tenant_id = NULL)"
```

---

### Task 3: Login — Validate Staff Role vs Domain

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Add tenant validation after successful auth**

After `supabase.auth.signInWithPassword` succeeds (line 74), add domain validation before redirect. The full `handleLogin` function becomes:

```typescript
async function handleLogin(e: React.FormEvent) {
  e.preventDefault()
  setError('')
  setLoading(true)

  let emailToLogin = identifier.trim()

  // Se parece CPF/CNPJ, buscar o email correspondente
  if (isCpfOrCnpj(emailToLogin)) {
    try {
      const res = await fetch('/api/auth/cpf-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpf: emailToLogin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'CPF/CNPJ nao encontrado no sistema.')
        setLoading(false)
        return
      }
      emailToLogin = data.email
    } catch {
      setError('Erro ao buscar CPF. Tente novamente.')
      setLoading(false)
      return
    }
  }

  const supabase = createClient()
  const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
    email: emailToLogin,
    password,
  })

  if (loginError) {
    if (loginError.status === 429 || loginError.message?.includes('rate limit')) {
      setError('Muitas tentativas de login. Aguarde alguns minutos e tente novamente.')
    } else if (loginError.message?.includes('Email not confirmed')) {
      setError('E-mail ainda não confirmado. Verifique sua caixa de entrada.')
    } else {
      setError('Credenciais inválidas ou acesso não autorizado.')
    }
    setLoading(false)
    return
  }

  // Validate staff role vs domain tenant
  if (authData.user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tenant_id')
      .eq('id', authData.user.id)
      .single()

    const cookieTenantId = document.cookie
      .split('; ')
      .find(row => row.startsWith('tenant_id='))
      ?.split('=')[1] || null

    const role = profile?.role || 'proponente'
    const isStaff = ['admin', 'gestor', 'avaliador'].includes(role)
    const isRootDomain = !cookieTenantId

    if (isStaff) {
      if (isRootDomain) {
        // Staff cannot login at root domain
        await supabase.auth.signOut()
        setError('Acesse pelo domínio do seu município para fazer login.')
        setLoading(false)
        return
      }
      if (profile?.tenant_id && profile.tenant_id !== cookieTenantId) {
        // Staff logging into wrong tenant's domain
        // Fetch tenant name for helpful error message
        const { data: correctTenant } = await supabase
          .from('tenants')
          .select('nome, dominio')
          .eq('id', profile.tenant_id)
          .single()
        await supabase.auth.signOut()
        const tenantUrl = correctTenant?.dominio
          ? `${correctTenant.dominio}.eloculturas.com.br`
          : 'o domínio correto'
        setError(`Sua conta pertence a ${correctTenant?.nome || 'outro município'}. Acesse em ${tenantUrl}.`)
        setLoading(false)
        return
      }
    }
  }

  router.push(redirect)
  router.refresh()
}
```

**Step 2: Commit**

```bash
git add src/app/(auth)/login/page.tsx
git commit -m "feat(auth): validate staff role against domain tenant on login"
```

---

### Task 4: Cadastro — Proponente Global + Restrict Staff on Root Domain

**Files:**
- Modify: `src/app/(auth)/cadastro/page.tsx`

**Step 1: Make proponente signup omit tenant_id**

In `handleFinalSubmit`, change the signup options (around line 82-95) to NOT pass tenant_id for proponentes:

Replace the existing signup block:
```typescript
// Read tenant_id from cookie (set by middleware from domain)
const tenantId = document.cookie
  .split('; ')
  .find(row => row.startsWith('tenant_id='))
  ?.split('=')[1] || undefined

// 1. Create account
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome,
      cpf_cnpj: cpfCnpj,
      telefone,
      consentimento_lgpd: true,
      ...(tenantId ? { tenant_id: tenantId } : {}),
    },
  },
})
```

With:
```typescript
// Read tenant_id from cookie (set by middleware from domain)
const tenantId = document.cookie
  .split('; ')
  .find(row => row.startsWith('tenant_id='))
  ?.split('=')[1] || undefined

// Proponentes are global (no tenant_id). Staff needs tenant_id.
const isProponente = perfilTipo === 'proponente'

// 1. Create account
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      nome,
      cpf_cnpj: cpfCnpj,
      telefone,
      consentimento_lgpd: true,
      // Proponente: no tenant_id (global). Staff: tenant from domain.
      ...(!isProponente && tenantId ? { tenant_id: tenantId } : {}),
    },
  },
})
```

**Step 2: Hide staff role options on root domain**

Find the role selection UI (around line 275-298) and add a check. At the top of the component, add a state variable to detect root domain:

```typescript
const [isRootDomain] = useState(() => {
  const tenantId = document.cookie
    .split('; ')
    .find(row => row.startsWith('tenant_id='))
    ?.split('=')[1]
  return !tenantId
})
```

Then in the role selection step, conditionally hide avaliador/gestor buttons when `isRootDomain` is true, and show a message:

```tsx
{isRootDomain && perfilTipo !== 'proponente' && (
  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl p-3 border border-amber-200">
    Para se cadastrar como avaliador ou gestor, acesse o domínio do seu município.
  </p>
)}
```

And disable the avaliador/gestor buttons when `isRootDomain`:
```tsx
disabled={isRootDomain}
```

**Step 3: Commit**

```bash
git add src/app/(auth)/cadastro/page.tsx
git commit -m "feat(auth): proponente global signup + restrict staff roles on root domain"
```

---

### Task 5: Dashboard Layout — Branding for Global Proponentes

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/lib/tenant.ts`

**Step 1: Update dashboard layout to use cookie tenant for proponentes**

The current code (lines 33-39) fetches branding from `profile.tenant_id`. For global proponentes (`tenant_id = NULL`), it falls back to defaults. Instead, it should use the cookie tenant (domain context).

Replace lines 33-39 in `src/app/(dashboard)/layout.tsx`:

```typescript
const { data: tenant } = profile?.tenant_id
  ? await supabase
    .from('tenants')
    .select('nome, tema_cores, logo_url, logo_rodape_url')
    .eq('id', profile.tenant_id)
    .single()
  : { data: null }
```

With:

```typescript
// Staff: use profile.tenant_id. Proponente: use cookie tenant (domain context).
let tenant: any = null
if (profile?.tenant_id) {
  // Staff user — branding from their assigned tenant
  const { data } = await supabase
    .from('tenants')
    .select('nome, tema_cores, logo_url, logo_rodape_url')
    .eq('id', profile.tenant_id)
    .single()
  tenant = data
} else if (role === 'proponente') {
  // Global proponente — branding from domain (cookie)
  const { getTenantFromCookie } = await import('@/lib/tenant')
  tenant = await getTenantFromCookie()
}
```

**Step 2: Update getTenantFromCookie to also return logo_rodape_url**

In `src/lib/tenant.ts`, line 21, add `logo_rodape_url` to the select:

Replace:
```typescript
.select('nome, tema_cores, logo_url')
```

With:
```typescript
.select('nome, tema_cores, logo_url, logo_rodape_url')
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.tsx src/lib/tenant.ts
git commit -m "feat(dashboard): global proponente branding from domain cookie"
```

---

### Task 6: Filter Public Editais by Tenant Domain

**Files:**
- Modify: `src/app/(public)/editais/page.tsx`

**Step 1: Add tenant filter to editais query**

Replace the query (lines 10-14):

```typescript
const { data: editais } = await supabase
  .from('editais')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false })
```

With:

```typescript
import { cookies } from 'next/headers'

// ... inside component:
const cookieStore = await cookies()
const tenantId = cookieStore.get('tenant_id')?.value

let query = supabase
  .from('editais')
  .select('*')
  .eq('active', true)
  .order('created_at', { ascending: false })

// On subdomain: filter by tenant. On root domain: show all.
if (tenantId) {
  query = query.eq('tenant_id', tenantId)
}

const { data: editais } = await query
```

**Step 2: Commit**

```bash
git add src/app/(public)/editais/page.tsx
git commit -m "feat(public): filter editais by tenant domain"
```

---

### Task 7: Middleware — Block Staff Routes on Root Domain

**Files:**
- Modify: `src/middleware.ts`

**Step 1: Add staff route protection in applyAuthProtection**

In `src/middleware.ts`, the `applyAuthProtection` function (line 114) needs to block staff-only routes on root domain. We can't read the profile in middleware (expensive), but we can block known staff routes when there's no tenant cookie.

Replace the `applyAuthProtection` function (lines 114-147):

```typescript
function applyAuthProtection(
  request: NextRequest,
  user: any,
  supabaseResponse: NextResponse,
  pathname: string
) {
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/cadastro') ||
    pathname.startsWith('/esqueci-senha')
  const isDashboardRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/projetos') ||
    pathname.startsWith('/avaliacao') ||
    pathname.startsWith('/gestor') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/perfil') ||
    pathname.startsWith('/super')

  // Staff-only routes (not accessible on root domain without tenant)
  const isStaffRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/gestor') ||
    pathname.startsWith('/avaliacao')

  const hasTenant = !!request.cookies.get('tenant_id')?.value

  // Block staff routes on root domain (no tenant context)
  if (isStaffRoute && !hasTenant && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  if (isDashboardRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat(middleware): block staff routes on root domain"
```

---

### Task 8: Gov.br — Button + OAuth Structure

**Files:**
- Create: `src/components/auth/GovBrButton.tsx`
- Create: `src/app/api/auth/govbr/authorize/route.ts`
- Create: `src/app/api/auth/govbr/callback/route.ts`
- Modify: `src/app/(auth)/login/page.tsx`

**Step 1: Create GovBrButton component**

```tsx
// src/components/auth/GovBrButton.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function GovBrButton() {
  const [loading, setLoading] = useState(false)

  async function handleGovBr() {
    setLoading(true)

    // Check if gov.br integration is enabled
    const res = await fetch('/api/auth/govbr/authorize')
    const data = await res.json()

    if (data.enabled && data.url) {
      window.location.href = data.url
    } else {
      toast.info('Integração gov.br em breve', {
        description: 'Estamos finalizando a integração com o login gov.br. Por enquanto, use e-mail e senha.',
        duration: 5000,
      })
      setLoading(false)
    }
  }

  return (
    <>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
          <span className="bg-white px-3 text-slate-300 font-semibold">ou</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={handleGovBr}
        disabled={loading}
        className="w-full h-12 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs tracking-wide transition-all gap-3"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="48" height="48" rx="8" fill="#1351B4"/>
          <path d="M24 10L38 24L24 38L10 24L24 10Z" fill="#FFCD07"/>
          <circle cx="24" cy="24" r="6" fill="#1351B4"/>
        </svg>
        Entrar com <strong>gov.br</strong>
      </Button>
    </>
  )
}
```

**Step 2: Create authorize route (checks if enabled)**

```typescript
// src/app/api/auth/govbr/authorize/route.ts
import { NextResponse } from 'next/server'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''
const GOVBR_AUTH_URL = 'https://sso.acesso.gov.br/authorize'

export async function GET() {
  if (!GOVBR_CLIENT_ID) {
    return NextResponse.json({ enabled: false })
  }

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: GOVBR_CLIENT_ID,
    scope: 'openid email phone profile govbr_confiabilidades',
    redirect_uri: GOVBR_REDIRECT_URI,
    state: crypto.randomUUID(),
  })

  return NextResponse.json({
    enabled: true,
    url: `${GOVBR_AUTH_URL}?${params.toString()}`,
  })
}
```

**Step 3: Create callback route (skeleton)**

```typescript
// src/app/api/auth/govbr/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'

const GOVBR_CLIENT_ID = process.env.GOVBR_CLIENT_ID
const GOVBR_CLIENT_SECRET = process.env.GOVBR_CLIENT_SECRET
const GOVBR_REDIRECT_URI = process.env.GOVBR_REDIRECT_URI || ''
const GOVBR_TOKEN_URL = 'https://sso.acesso.gov.br/token'
const GOVBR_USERINFO_URL = 'https://sso.acesso.gov.br/userinfo'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  if (!code || !GOVBR_CLIENT_ID || !GOVBR_CLIENT_SECRET) {
    return NextResponse.redirect(new URL('/login?error=govbr_unavailable', request.url))
  }

  try {
    // 1. Exchange code for token
    const tokenRes = await fetch(GOVBR_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: GOVBR_REDIRECT_URI,
        client_id: GOVBR_CLIENT_ID,
        client_secret: GOVBR_CLIENT_SECRET,
      }),
    })

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL('/login?error=govbr_token_failed', request.url))
    }

    const { access_token } = await tokenRes.json()

    // 2. Fetch user info
    const userRes = await fetch(GOVBR_USERINFO_URL, {
      headers: { Authorization: `Bearer ${access_token}` },
    })

    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login?error=govbr_userinfo_failed', request.url))
    }

    const govUser = await userRes.json()
    // govUser contains: sub (CPF), name, email, phone_number, picture

    // 3. TODO: Find or create user in Supabase by CPF
    // - Search profiles by cpf_cnpj = govUser.sub
    // - If found: sign in as that user
    // - If not found: create new proponente (global, tenant_id = NULL)
    // - Redirect to /dashboard

    // For now, redirect with info message
    return NextResponse.redirect(new URL('/login?msg=govbr_em_breve', request.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=govbr_error', request.url))
  }
}
```

**Step 4: Add GovBrButton to login page**

In `src/app/(auth)/login/page.tsx`, add the import and place the button after the "Criar conta" paragraph (after line 178):

Add import at top:
```typescript
import { GovBrButton } from '@/components/auth/GovBrButton'
```

Add after the closing `</form>` tag (line 179), inside the same container div:
```tsx
</form>
<GovBrButton />
```

**Step 5: Commit**

```bash
git add src/components/auth/GovBrButton.tsx src/app/api/auth/govbr/authorize/route.ts src/app/api/auth/govbr/callback/route.ts src/app/(auth)/login/page.tsx
git commit -m "feat(auth): gov.br login button + OAuth scaffold (disabled until credentials)"
```

---

### Task 9: Unified Proponente Dashboard (Root Domain)

**Files:**
- Create: `src/app/(dashboard)/projetos/UnifiedProjects.tsx`
- Modify: `src/app/(dashboard)/projetos/page.tsx`

**Step 1: Create unified projects component**

```tsx
// src/app/(dashboard)/projetos/UnifiedProjects.tsx
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface UnifiedProject {
  id: string
  titulo: string
  status_atual: string | null
  data_envio: string | null
  numero_protocolo: string
  edital_titulo: string
  edital_numero: string
  municipio: string
  dominio: string
  tema_cores: { primary: string } | null
}

interface Props {
  projects: UnifiedProject[]
}

export function UnifiedProjects({ projects }: Props) {
  // Group by municipality
  const grouped = projects.reduce((acc, p) => {
    if (!acc[p.municipio]) acc[p.municipio] = { dominio: p.dominio, tema_cores: p.tema_cores, projects: [] }
    acc[p.municipio].projects.push(p)
    return acc
  }, {} as Record<string, { dominio: string; tema_cores: { primary: string } | null; projects: UnifiedProject[] }>)

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([municipio, { dominio, tema_cores, projects: municipioProjects }]) => (
        <div key={municipio}>
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-800">{municipio}</h2>
            <span className="text-xs text-slate-400">({municipioProjects.length} projeto{municipioProjects.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="space-y-3">
            {municipioProjects.map(project => {
              const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'eloculturas.com.br'
              const projectUrl = `https://${dominio}.${rootDomain}/projetos/${project.id}`
              return (
                <Card key={project.id} className="border border-slate-200 rounded-xl hover:border-slate-300 transition-colors">
                  <div className="h-1 w-full rounded-t-xl" style={{ backgroundColor: tema_cores?.primary || '#0047AB' }} />
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{project.titulo}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{project.edital_titulo} — {project.numero_protocolo}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4 shrink-0">
                      <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                        {project.status_atual || 'Enviado'}
                      </span>
                      <Link href={projectUrl} target="_blank" className="text-slate-300 hover:text-slate-500 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
```

**Step 2: Update projetos page to support unified view**

In `src/app/(dashboard)/projetos/page.tsx`, detect if we're on root domain (no tenant cookie) and show unified view. Add the unified query alongside the existing one:

At the top of the server component, after fetching user/profile, add:

```typescript
import { cookies } from 'next/headers'
import { UnifiedProjects } from './UnifiedProjects'

// ... inside the component, after profile fetch:
const cookieStore = await cookies()
const cookieTenantId = cookieStore.get('tenant_id')?.value
const isRootDomain = !cookieTenantId
const isGlobalProponente = profile?.role === 'proponente' && !profile?.tenant_id

if (isRootDomain && isGlobalProponente) {
  // Unified view: all projects across all tenants
  const { data: allProjects } = await supabase
    .from('projetos')
    .select(`
      id, titulo, status_atual, data_envio, numero_protocolo,
      editais!inner(titulo, numero_edital, tenant_id,
        tenants!inner(nome, dominio, tema_cores)
      )
    `)
    .eq('proponente_id', user.id)
    .order('data_envio', { ascending: false })

  const unified = (allProjects || []).map((p: any) => ({
    id: p.id,
    titulo: p.titulo,
    status_atual: p.status_atual,
    data_envio: p.data_envio,
    numero_protocolo: p.numero_protocolo,
    edital_titulo: p.editais.titulo,
    edital_numero: p.editais.numero_edital,
    municipio: p.editais.tenants.nome,
    dominio: p.editais.tenants.dominio,
    tema_cores: p.editais.tenants.tema_cores,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Meus Projetos</h1>
          <p className="text-sm text-slate-500 mt-1">Visão unificada de todas as suas inscrições culturais.</p>
        </div>
      </div>
      {unified.length > 0 ? (
        <UnifiedProjects projects={unified} />
      ) : (
        <Card className="border border-slate-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-slate-500">Você ainda não tem projetos inscritos.</p>
          <p className="text-xs text-slate-400 mt-2">Acesse o domínio de uma prefeitura para explorar editais abertos.</p>
        </Card>
      )}
    </div>
  )
}

// ... existing code for subdomain view continues below
```

**Step 3: Commit**

```bash
git add src/app/(dashboard)/projetos/UnifiedProjects.tsx src/app/(dashboard)/projetos/page.tsx
git commit -m "feat(dashboard): unified proponente dashboard — projects grouped by municipality"
```

---

### Task 10: Test All Flows Locally

**Step 1: Apply migration to Supabase**

Run the migrations against the Supabase project (or apply via dashboard SQL editor):
- `20260304000010_proponente_global.sql`
- `20260304000011_migrate_existing_proponentes.sql`

**Step 2: Test login flows**

1. `localhost:3000?tenant=pinhais` → login as admin@elocultura.teste → should work (staff, correct tenant)
2. `localhost:3000?tenant=clear` → login as admin@elocultura.teste → should show "Acesse pelo domínio do seu município"
3. `localhost:3000?tenant=clear` → login as proponente@elocultura.teste → should work (global proponente, root domain allowed)
4. `localhost:3000?tenant=pinhais` → login as proponente@elocultura.teste → should work (proponente, any domain)

**Step 3: Test public editais**

1. `localhost:3000?tenant=pinhais` → /editais → should show only Pinhais editais
2. `localhost:3000?tenant=clear` → /editais → should show all editais

**Step 4: Test unified dashboard**

1. `localhost:3000?tenant=clear` → login as proponente → /projetos → should show unified view grouped by municipality

**Step 5: Test gov.br button**

1. Login page should show "Entrar com gov.br" button
2. Click → should show toast "Integração gov.br em breve"

**Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify multi-tenant global proponente flows"
```

---

## Summary of Changes

| Task | Files | Description |
|------|-------|-------------|
| 1 | 1 migration | Schema: nullable tenant_id, RLS, trigger |
| 2 | 1 migration | Migrate existing proponentes |
| 3 | login/page.tsx | Staff role vs domain validation |
| 4 | cadastro/page.tsx | Global proponente signup |
| 5 | layout.tsx, tenant.ts | Branding from cookie for proponentes |
| 6 | editais/page.tsx | Filter public editais by tenant |
| 7 | middleware.ts | Block staff routes on root domain |
| 8 | 4 new files + login | Gov.br button + OAuth scaffold |
| 9 | 2 files | Unified proponente dashboard |
| 10 | — | Test all flows |
