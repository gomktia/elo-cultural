# UI Premium Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refatorar a experiência do Gestor/Admin com design system premium: CSS vars dinâmicas de tenant, glassmorphism sidebar, mood cards, timeline animada, dark mode estrutural.

**Architecture:** O `layout.tsx` do dashboard injeta `--color-brand` server-side via `style` inline lido do Supabase. Todos os componentes usam `var(--color-brand)` em vez de cores hardcoded. framer-motion é instalado e usado exclusivamente no `EditalTimeline.tsx`.

**Tech Stack:** Next.js 16, Tailwind CSS 4, Shadcn/UI, framer-motion 11, next-themes (já instalado)

---

### Task 1: Instalar framer-motion e configurar globals.css

**Files:**
- Modify: `src/app/globals.css`
- Run: `npm install framer-motion`

**Step 1: Instalar dependência**

```bash
cd /c/Users/Yoda/Downloads/elo-cultural-main/elo-cultural-main
npm install framer-motion
```

Expected: `added 1 package` sem erros.

**Step 2: Substituir globals.css completo**

```css
@import "tailwindcss";

/* ── Brand tokens (overridden per-tenant via inline style) ── */
:root {
  --color-brand: #1A56DB;
  --color-brand-secondary: #7E3AF2;
  --color-brand-rgb: 26, 86, 219;
}

/* ── Base ── */
* {
  border-color: hsl(var(--border));
}

body {
  font-family: var(--font-geist-sans), 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ── Dark mode skeleton ── */
.dark body {
  background-color: #0f1117;
  color: #f1f5f9;
}

/* ── Glassmorphism utility ── */
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.dark .glass {
  background: rgba(15, 17, 23, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ── Brand glow utility ── */
.glow-brand {
  box-shadow: 0 0 20px rgba(var(--color-brand-rgb), 0.4);
}

/* ── Scrollbar slim ── */
::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 2px; }
```

**Step 3: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

**Step 4: Commit**

```bash
git add src/app/globals.css package.json package-lock.json
git commit -m "feat: install framer-motion, add CSS brand token system and glass utilities"
```

---

### Task 2: Injeção server-side de --color-brand no layout do dashboard

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

**Step 1: Atualizar layout.tsx para injetar cores do tenant**

Substituir o conteúdo do arquivo por:

```tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { TenantHeader } from '@/components/layout/TenantHeader'
import { Toaster } from '@/components/ui/sonner'
import type { UserRole } from '@/types/database.types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: tenant } = profile?.tenant_id
    ? await supabase
        .from('tenants')
        .select('nome, tema_cores')
        .eq('id', profile.tenant_id)
        .single()
    : { data: null }

  const role = (profile?.role as UserRole) || 'proponente'
  const userName = profile?.nome || user.email || 'Usuario'
  const userEmail = user.email || ''
  const tenantName = tenant?.nome
  const brandColor = (tenant?.tema_cores as any)?.primary || '#1A56DB'
  const brandSecondary = (tenant?.tema_cores as any)?.secondary || '#7E3AF2'

  // Convert hex to RGB components for glow effects
  function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `${r}, ${g}, ${b}`
  }

  const brandRgb = hexToRgb(brandColor)

  return (
    <div
      style={{
        ['--color-brand' as string]: brandColor,
        ['--color-brand-secondary' as string]: brandSecondary,
        ['--color-brand-rgb' as string]: brandRgb,
      }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-950 dark:to-slate-900"
    >
      <SidebarProvider>
        <AppSidebar
          role={role}
          userName={userName}
          userEmail={userEmail}
          tenantName={tenantName}
          brandColor={brandColor}
        />
        <SidebarInset>
          <TenantHeader tenantName={tenantName} brandColor={brandColor} />
          <main className="flex-1 p-6">
            {children}
          </main>
        </SidebarInset>
        <Toaster />
      </SidebarProvider>
    </div>
  )
}
```

**Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

Expected: `✓ Compiled successfully`

**Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: inject tenant brand colors server-side as CSS custom properties"
```

---

### Task 3: Redesenhar AppSidebar com glassmorphism

**Files:**
- Modify: `src/components/layout/AppSidebar.tsx`

**Step 1: Substituir AppSidebar.tsx**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar'
import { UserMenu } from './UserMenu'
import type { UserRole } from '@/types/database.types'
import {
  Home, FolderOpen, FileText, Users, BarChart3,
  ClipboardList, Shield, Settings, Trophy, Search,
} from 'lucide-react'

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
}

const navByRole: Record<UserRole, NavItem[]> = {
  proponente: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Meus Projetos', url: '/projetos', icon: FolderOpen },
    { title: 'Editais Abertos', url: '/editais', icon: Search },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  avaliador: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Projetos Atribuidos', url: '/avaliacao', icon: ClipboardList },
    { title: 'Meu Perfil', url: '/perfil', icon: Users },
  ],
  gestor: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Dashboard', url: '/gestor', icon: BarChart3 },
    { title: 'Relatorios', url: '/gestor/relatorios', icon: FileText },
    { title: 'Rankings', url: '/gestor/rankings', icon: Trophy },
  ],
  admin: [
    { title: 'Inicio', url: '/', icon: Home },
    { title: 'Editais', url: '/admin/editais', icon: FileText },
    { title: 'Usuarios', url: '/admin/usuarios', icon: Users },
    { title: 'Avaliadores', url: '/admin/avaliadores', icon: ClipboardList },
    { title: 'Relatorios', url: '/gestor/relatorios', icon: BarChart3 },
    { title: 'Auditoria', url: '/admin/auditoria', icon: Shield },
    { title: 'Configuracoes', url: '/admin/configuracoes', icon: Settings },
  ],
}

interface AppSidebarProps {
  role: UserRole
  userName: string
  userEmail: string
  tenantName?: string
  brandColor?: string
}

export function AppSidebar({ role, userName, userEmail, tenantName, brandColor }: AppSidebarProps) {
  const pathname = usePathname()
  const items = navByRole[role] || navByRole.proponente

  return (
    <Sidebar className="border-r-0">
      <div className="flex h-full flex-col glass shadow-xl">
        {/* Header */}
        <SidebarHeader className="border-b border-white/30 dark:border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: brandColor || 'var(--color-brand)' }}
            >
              {(tenantName || 'ELO').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                {tenantName || 'Elo Cultura'}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Gov Platform</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Nav */}
        <SidebarContent className="px-3 py-4">
          <SidebarGroup>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-slate-400 px-2 mb-1">
              Menu
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                {items.map(item => {
                  const isActive = pathname === item.url ||
                    (item.url !== '/' && pathname.startsWith(item.url))
                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild>
                        <Link
                          href={item.url}
                          className={`
                            flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                            transition-all duration-150
                            ${isActive
                              ? 'text-[var(--color-brand)] bg-[var(--color-brand)]/10 border-l-2 border-[var(--color-brand)]'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-900/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white border-l-2 border-transparent'
                            }
                          `}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t border-white/30 dark:border-white/10 p-3">
          <UserMenu userName={userName} userEmail={userEmail} role={role} />
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
```

**Step 2: Verificar build**

```bash
npm run build 2>&1 | tail -5
```

**Step 3: Commit**

```bash
git add src/components/layout/AppSidebar.tsx
git commit -m "feat: glassmorphism sidebar with brand-color active states"
```

---

### Task 4: Redesenhar TenantHeader com visual premium

**Files:**
- Modify: `src/components/layout/TenantHeader.tsx`

**Step 1: Ler arquivo atual**

```bash
cat src/components/layout/TenantHeader.tsx
```

**Step 2: Substituir TenantHeader.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Bell } from 'lucide-react'

interface TenantHeaderProps {
  tenantName?: string
  brandColor?: string
}

export async function TenantHeader({ tenantName, brandColor }: TenantHeaderProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-white/30 dark:border-white/10 glass px-4">
      <SidebarTrigger className="-ml-1 text-slate-500 hover:text-slate-900 dark:hover:text-white" />
      <Separator orientation="vertical" className="h-5 bg-slate-200/60" />

      <div className="flex-1 min-w-0">
        {tenantName && (
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest truncate">
            {tenantName}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Badge
          variant="outline"
          className="text-[10px] font-mono border-slate-200 text-slate-500"
        >
          v0.1.0
        </Badge>

        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
          style={{ backgroundColor: brandColor || 'var(--color-brand)' }}
        >
          {(user?.email || 'U').slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
```

**Step 3: Verificar build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/layout/TenantHeader.tsx
git commit -m "feat: premium sticky header with glass effect and brand avatar"
```

---

### Task 5: EditalCard com Mood (3 estados visuais)

**Files:**
- Modify: `src/components/edital/EditalCard.tsx`

**Step 1: Ler arquivo atual**

```bash
cat src/components/edital/EditalCard.tsx
```

**Step 2: Substituir EditalCard.tsx com mood logic**

```tsx
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { EditalStatusBadge } from './EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { Calendar, AlertTriangle, Scale } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditalCardProps {
  edital: Edital
  href: string
}

function getMood(edital: Edital): 'open' | 'closing' | 'recurso' | 'default' {
  const recursoStatuses = ['resultado_preliminar_habilitacao', 'recurso_habilitacao',
    'resultado_preliminar_avaliacao', 'recurso_avaliacao']
  if (recursoStatuses.includes(edital.status)) return 'recurso'
  if (edital.status === 'inscricao') {
    if (edital.fim_inscricao) {
      const daysLeft = differenceInDays(new Date(edital.fim_inscricao), new Date())
      if (daysLeft <= 7) return 'closing'
    }
    return 'open'
  }
  return 'default'
}

const moodStyles = {
  open: 'ring-1 ring-emerald-400/50 shadow-emerald-100/80 shadow-lg',
  closing: 'ring-1 ring-amber-400/60 shadow-amber-100/80 shadow-lg',
  recurso: 'ring-1 ring-blue-400/50 shadow-blue-100/80 shadow-lg',
  default: 'shadow-sm hover:shadow-md',
}

export function EditalCard({ edital, href }: EditalCardProps) {
  const mood = getMood(edital)
  const daysLeft = edital.fim_inscricao
    ? differenceInDays(new Date(edital.fim_inscricao), new Date())
    : null

  return (
    <Link href={href} className="block group">
      <Card className={`
        relative overflow-hidden rounded-xl border-0 bg-white dark:bg-slate-900
        transition-all duration-200 group-hover:-translate-y-0.5
        ${moodStyles[mood]}
      `}>
        {/* Mood accent bar */}
        {mood === 'open' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-300" />
        )}
        {mood === 'closing' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-400" />
        )}
        {mood === 'recurso' && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400" />
        )}

        <CardHeader className="pb-3 pt-5 px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-mono text-slate-400 mb-1">{edital.numero_edital}</p>
              <h3 className="font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-[var(--color-brand)] transition-colors">
                {edital.titulo}
              </h3>
            </div>
            <EditalStatusBadge status={edital.status} />
          </div>
        </CardHeader>

        <CardContent className="px-5 pb-5 space-y-3">
          {edital.descricao && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
              {edital.descricao}
            </p>
          )}

          <div className="flex items-center justify-between pt-1">
            {edital.fim_inscricao && (
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  Até {format(new Date(edital.fim_inscricao), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            )}

            {mood === 'closing' && daysLeft !== null && daysLeft >= 0 && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                <AlertTriangle className="h-3 w-3" />
                {daysLeft === 0 ? 'Encerra hoje' : `${daysLeft}d restantes`}
              </div>
            )}

            {mood === 'recurso' && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                <Scale className="h-3 w-3" />
                Fase de Recursos
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Step 3: Verificar build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/edital/EditalCard.tsx
git commit -m "feat: mood-based EditalCard with status-driven visual states"
```

---

### Task 6: EditalStatusBadge refinado

**Files:**
- Modify: `src/components/edital/EditalStatusBadge.tsx`

**Step 1: Ler arquivo atual**

```bash
cat src/components/edital/EditalStatusBadge.tsx
```

**Step 2: Substituir EditalStatusBadge.tsx**

```tsx
import type { FaseEdital } from '@/types/database.types'
import { cn } from '@/lib/utils'

const faseConfig: Record<FaseEdital, { label: string; className: string }> = {
  criacao:                          { label: 'Criação',               className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  publicacao:                       { label: 'Publicado',             className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  inscricao:                        { label: 'Inscrições Abertas',    className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  inscricao_encerrada:              { label: 'Inscrições Encerradas', className: 'bg-slate-100 text-slate-600' },
  habilitacao:                      { label: 'Habilitação',           className: 'bg-violet-50 text-violet-700' },
  resultado_preliminar_habilitacao: { label: 'Res. Prel. Hab.',       className: 'bg-indigo-50 text-indigo-700' },
  recurso_habilitacao:              { label: 'Recurso Hab.',          className: 'bg-amber-50 text-amber-700' },
  resultado_definitivo_habilitacao: { label: 'Res. Def. Hab.',        className: 'bg-indigo-50 text-indigo-700' },
  avaliacao_tecnica:                { label: 'Avaliação',             className: 'bg-violet-50 text-violet-700' },
  resultado_preliminar_avaliacao:   { label: 'Res. Prel. Aval.',      className: 'bg-indigo-50 text-indigo-700' },
  recurso_avaliacao:                { label: 'Recurso Aval.',         className: 'bg-amber-50 text-amber-700' },
  resultado_final:                  { label: 'Resultado Final',       className: 'bg-emerald-50 text-emerald-700' },
  homologacao:                      { label: 'Homologado',            className: 'bg-emerald-100 text-emerald-800 font-semibold' },
  arquivamento:                     { label: 'Arquivado',             className: 'bg-slate-100 text-slate-500' },
}

export function EditalStatusBadge({ status }: { status: FaseEdital }) {
  const config = faseConfig[status] || { label: status, className: 'bg-slate-100 text-slate-600' }
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap',
      config.className
    )}>
      {config.label}
    </span>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/edital/EditalStatusBadge.tsx
git commit -m "feat: refined EditalStatusBadge with semantic color per phase"
```

---

### Task 7: EditalTimeline fluida com framer-motion

**Files:**
- Modify: `src/components/edital/EditalTimeline.tsx`

**Step 1: Ler arquivo atual**

```bash
cat src/components/edital/EditalTimeline.tsx
```

**Step 2: Substituir EditalTimeline.tsx**

```tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { FaseEdital } from '@/types/database.types'
import { Check, Clock, Lock, Circle } from 'lucide-react'

export type { FaseEdital }

const faseOrder: FaseEdital[] = [
  'criacao', 'publicacao', 'inscricao', 'inscricao_encerrada',
  'habilitacao', 'resultado_preliminar_habilitacao', 'recurso_habilitacao',
  'resultado_definitivo_habilitacao', 'avaliacao_tecnica',
  'resultado_preliminar_avaliacao', 'recurso_avaliacao',
  'resultado_final', 'homologacao', 'arquivamento',
]

const faseLabels: Record<FaseEdital, string> = {
  criacao: 'Criação',
  publicacao: 'Publicação',
  inscricao: 'Inscrição',
  inscricao_encerrada: 'Insc. Encerrada',
  habilitacao: 'Habilitação',
  resultado_preliminar_habilitacao: 'Res. Prel. Hab.',
  recurso_habilitacao: 'Recurso Hab.',
  resultado_definitivo_habilitacao: 'Res. Def. Hab.',
  avaliacao_tecnica: 'Avaliação',
  resultado_preliminar_avaliacao: 'Res. Prel. Aval.',
  recurso_avaliacao: 'Recurso Aval.',
  resultado_final: 'Resultado Final',
  homologacao: 'Homologação',
  arquivamento: 'Arquivamento',
}

interface EditalTimelineProps {
  faseAtual: FaseEdital
  prazos?: {
    inicio_inscricao?: string
    fim_inscricao?: string
    inicio_recurso?: string
    fim_recurso?: string
  }
  corTenant?: string
}

export function EditalTimeline({ faseAtual, prazos, corTenant = '#1A56DB' }: EditalTimelineProps) {
  const currentIndex = faseOrder.indexOf(faseAtual)

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
        Cronograma e Fases do Edital
      </h3>

      <div className="flex items-center gap-0 overflow-x-auto pb-2">
        {faseOrder.map((fase, idx) => {
          const isPast = idx < currentIndex
          const isCurrent = idx === currentIndex
          const isFuture = idx > currentIndex

          return (
            <div key={fase} className="flex items-center flex-shrink-0">
              {/* Node */}
              <div className="flex flex-col items-center gap-1.5">
                <motion.div
                  layoutId={`fase-node-${fase}`}
                  className="relative flex items-center justify-center"
                  initial={false}
                  animate={isCurrent ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                  } : { scale: 1 }}
                >
                  {/* Glow ring for active fase */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: corTenant }}
                      initial={{ opacity: 0, scale: 1 }}
                      animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  {/* Icon circle */}
                  <div
                    className={`
                      relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm
                      transition-all duration-300
                      ${isPast
                        ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-200'
                        : isCurrent
                        ? 'text-white shadow-md'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }
                    `}
                    style={isCurrent ? { backgroundColor: corTenant } : {}}
                  >
                    <AnimatePresence mode="wait">
                      {isPast ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        >
                          <Check className="h-4 w-4" strokeWidth={2.5} />
                        </motion.div>
                      ) : isCurrent ? (
                        <motion.div
                          key="clock"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <Clock className="h-4 w-4" strokeWidth={2} />
                        </motion.div>
                      ) : (
                        <Circle className="h-3 w-3" strokeWidth={1.5} />
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>

                {/* Label */}
                <span className={`
                  text-[10px] text-center leading-tight max-w-[72px] whitespace-normal
                  ${isCurrent ? 'font-semibold' : isPast ? 'text-slate-500' : 'text-slate-400'}
                `}
                  style={isCurrent ? { color: corTenant } : {}}
                >
                  {faseLabels[fase]}
                  {isCurrent && prazos?.fim_inscricao && fase === 'inscricao' && (
                    <span className="block text-slate-400 font-normal">
                      Até {new Date(prazos.fim_inscricao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </span>
              </div>

              {/* Connector line */}
              {idx < faseOrder.length - 1 && (
                <motion.div
                  className="h-0.5 w-6 flex-shrink-0 mx-0.5 rounded-full"
                  initial={false}
                  animate={{
                    backgroundColor: idx < currentIndex ? '#10b981' : '#e2e8f0',
                  }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 3: Verificar build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/components/edital/EditalTimeline.tsx
git commit -m "feat: fluid animated EditalTimeline with framer-motion glow and phase transitions"
```

---

### Task 8: Gestor Dashboard premium

**Files:**
- Modify: `src/app/(dashboard)/gestor/page.tsx`

**Step 1: Substituir gestor/page.tsx**

```tsx
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import { FileText, FolderOpen, Users, BarChart3, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { Edital } from '@/types/database.types'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function GestorDashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id, nome')
    .eq('id', user!.id)
    .single()

  const tenantId = profile?.tenant_id

  const [
    { count: totalEditais },
    { count: totalProjetos },
    { count: totalUsuarios },
    { count: totalAvaliacoes },
    { data: editaisRecentes },
  ] = await Promise.all([
    supabase.from('editais').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('projetos').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('active', true),
    supabase.from('avaliacoes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('status', 'finalizada'),
    supabase.from('editais').select('*').eq('tenant_id', tenantId).eq('active', true).order('created_at', { ascending: false }).limit(5),
  ])

  const stats = [
    { label: 'Editais Ativos', value: totalEditais ?? 0, icon: FileText, change: null },
    { label: 'Inscricoes', value: totalProjetos ?? 0, icon: FolderOpen, change: null },
    { label: 'Usuarios', value: totalUsuarios ?? 0, icon: Users, change: null },
    { label: 'Avaliacoes Concluidas', value: totalAvaliacoes ?? 0, icon: BarChart3, change: null },
  ]

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const firstName = profile?.nome?.split(' ')[0] || 'Gestor'

  return (
    <div className="space-y-8">
      {/* Header greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">
            {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-0.5">
            {greeting}, {firstName}
          </h1>
        </div>
        <Link href="/admin/editais/novo">
          <Button
            size="sm"
            className="text-white shadow-sm"
            style={{ backgroundColor: 'var(--color-brand)' }}
          >
            <FileText className="mr-2 h-4 w-4" />
            Novo Edital
          </Button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.label}
            className="rounded-xl border-0 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardContent className="pt-5 pb-5 px-5">
              <div className="flex items-center justify-between mb-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 12%, transparent)' }}
                >
                  <stat.icon
                    className="h-4.5 w-4.5"
                    style={{ color: 'var(--color-brand)' }}
                  />
                </div>
                <TrendingUp className="h-4 w-4 text-slate-300" />
              </div>
              <div className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                {stat.value.toLocaleString('pt-BR')}
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Editais recentes — wider */}
        <Card className="lg:col-span-3 rounded-xl border-0 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-5 pt-5">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Editais Recentes
            </CardTitle>
            <Link href="/admin/editais">
              <Button variant="ghost" size="sm" className="text-xs h-7 gap-1 text-slate-500 hover:text-slate-900">
                Ver todos
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {(editaisRecentes as Edital[] | null)?.map(edital => (
                <div key={edital.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {edital.titulo}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{edital.numero_edital}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <EditalStatusBadge status={edital.status} />
                    <Link href={`/admin/editais/${edital.id}`}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-slate-900">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {(!editaisRecentes || editaisRecentes.length === 0) && (
                <p className="text-sm text-slate-400 py-6 text-center">
                  Nenhum edital cadastrado.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="lg:col-span-2 rounded-xl border-0 bg-white dark:bg-slate-900 shadow-sm">
          <CardHeader className="pb-3 px-5 pt-5">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Acesso Rapido
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {[
              { href: '/gestor/rankings', icon: BarChart3, label: 'Rankings', desc: 'Classificação por edital' },
              { href: '/gestor/relatorios', icon: FileText, label: 'Relatorios', desc: 'Estatísticas gerais' },
              { href: '/admin/usuarios', icon: Users, label: 'Usuarios', desc: 'Gerenciar perfis' },
              { href: '/admin/auditoria', icon: FileText, label: 'Auditoria', desc: 'Log de ações' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                  <div
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--color-brand) 10%, transparent)' }}
                  >
                    <item.icon className="h-4 w-4" style={{ color: 'var(--color-brand)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-300 ml-auto flex-shrink-0 group-hover:text-slate-500 transition-colors" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

**Step 2: Verificar build + commit**

```bash
npm run build 2>&1 | tail -5
git add src/app/(dashboard)/gestor/page.tsx
git commit -m "feat: premium gestor dashboard with greeting, stats and quick actions"
```

---

### Task 9: Verificação final e teste visual

**Step 1: Build completo limpo**

```bash
npm run build 2>&1 | grep -E "(error|warning|✓|✗)"
```

Expected: apenas `✓ Compiled successfully`, zero erros TypeScript.

**Step 2: Iniciar servidor dev**

```bash
npm run dev
```

**Step 3: Testar páginas no browser**

Verificar visualmente:
- `http://localhost:3000/preview` — EditalTimeline com framer-motion
- `http://localhost:3000/` — EditalCard com mood
- `http://localhost:3000/gestor` — Dashboard premium (requer login)
- `http://localhost:3000/admin/editais` — Sidebar glassmorphism (requer login)

**Step 4: Commit final**

```bash
git add docs/plans/
git commit -m "docs: add UI premium redesign plan"
```
