# System-Wide Visual Standardization — Design Document

**Date:** 2026-02-25
**Approach:** Evolução Cirúrgica (A) — manter estrutura, evoluir visual

## Goal

Padronizar o visual de TODAS as páginas internas do dashboard para ter o mesmo look clean e institucional das páginas de login, cadastro e homepage redesenhadas.

## What Changes

### 1. Sidebar: Dark Navy → Light

- **Before:** `sidebar-navy` gradient `#0B1929` → `#0F2240`
- **After:** `bg-white` com `border-r border-slate-200`
- Logo: manter `rounded-xl`, usar `ring-1 ring-slate-200` (sem shadow-black)
- Items inativos: `text-slate-500 hover:text-slate-900 hover:bg-slate-50`
- Item ativo: `bg-slate-100 text-slate-900` com indicator bar `--brand-primary`
- User menu: avatar brand, texto `text-slate-900` / `text-slate-500`
- Separadores: `border-slate-100`

### 2. Header: Simplificado

- **Before:** `bg-white/80 backdrop-blur-xl`, 80px
- **After:** `bg-white border-b border-slate-200`, 64px
- Remover backdrop-blur
- Manter breadcrumb e bell

### 3. Main Content Area

- Remover `bg-dot-grid` pattern
- Background: `bg-[#F8FAFC]` (mesmo do login)
- Padding responsivo mantido

### 4. Padrão de Página

**Title block:** `h1 text-2xl font-bold` + `text-sm text-slate-500` + `border-b border-slate-200 pb-6`

**Cards:** `bg-white rounded-2xl border border-slate-200 shadow-sm` → hover `shadow-md -translate-y-0.5`

**Botões primários:** `h-10 rounded-2xl bg-[var(--brand-primary)] font-semibold text-xs uppercase tracking-wider shadow-xl shadow-[#0047AB]/20`

**Botões outline:** `h-10 rounded-2xl border-slate-200 font-semibold text-xs text-slate-600`

**Labels:** `text-[11px] font-medium text-slate-500 uppercase tracking-wide`

**Badges:** `text-[11px] font-medium uppercase tracking-wide rounded-lg`

**Empty states:** `border-2 border-dashed border-slate-200 rounded-3xl`

### 5. Stats Cards (Gestor)

- `bg-white border border-slate-200 rounded-2xl shadow-sm`
- Remover backdrop-blur, scale hover, "+12%" hardcoded

### 6. Perfil Page

- Card style do cadastro: `bg-white rounded-3xl border border-slate-200/80`
- Labels `text-[11px] uppercase`, inputs `rounded-2xl bg-slate-50/50`

### 7. globals.css

- Atualizar sidebar CSS variables para light
- Manter: slider, fade-up, scrollbar, shadows

## What Does NOT Change

- Route structure, SidebarProvider, collapsible logic
- Data fetching, server components
- Framer motion nav indicator
- Role-based navigation
- Supabase queries
