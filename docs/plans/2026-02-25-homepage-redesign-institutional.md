# Homepage Redesign — Portal Institucional

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign all public-facing pages from cinematic/event style to a clean institutional portal, inspired by PNAB DF and Sistema Baru references.

**Architecture:** Replace hero with edital slider, change header to institutional blue, unify auth pages to light theme, simplify EditalCard effects, clean up unused CSS animations. All changes are visual — no backend/data changes.

**Tech Stack:** Next.js App Router, Tailwind CSS, Lucide React icons, Supabase (data source, no changes), Framer Motion (keep for auth animations)

---

### Task 1: Clean up CSS — Remove cinematic homepage animations

**Files:**
- Modify: `src/app/globals.css:325-443`

**Step 1: Remove homepage cinema CSS**

Replace lines 325-443 (the entire "Homepage — Vibrante & Cultural" section) with a minimal slider CSS:

```css
/* ══════════════════════════════════════════
   Homepage — Institutional Slider
   ══════════════════════════════════════════ */

/* ── Edital Slider ── */
.slider-track {
  display: flex;
  transition: transform 0.5s ease-in-out;
}

.slider-slide {
  min-width: 100%;
  flex-shrink: 0;
}

/* ── Simple fade-in animation ── */
@keyframes fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

/* ── Gradient text (static, used in sidebar) ── */
.text-gradient-brand {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 50%, var(--brand-warning) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

This removes:
- `hero-ken-burns` animation
- `hero-vignette::after` overlay
- `blob-drift` / `blob-drift-reverse` animations
- `line-gradient-brand` animated line
- `noise-overlay::before` SVG texture
- `animate-fade-up-delay-1/2/3/4` (keeping only base `animate-fade-up`)
- `count-glow` animation
- `gradient-slide` animation

Keeps: `text-gradient-brand` (static version, used in sidebar wordmark)

**Step 2: Verify no build errors**

Run: `npm run build` (or `npx next build`)
Expected: Build succeeds. Some pages may show visual changes since CSS classes they reference are now removed, but no errors.

**Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "refactor: remove cinematic homepage CSS animations

Replace Ken Burns, vignette, noise, blobs, and gradient-slide
animations with minimal slider CSS. Keep text-gradient-brand
for sidebar usage."
```

---

### Task 2: Redesign Header — Institutional blue

**Files:**
- Modify: `src/app/(public)/layout.tsx:16-58`

**Step 1: Replace the header section**

Replace lines 16-58 (the entire `<header>...</header>`) with:

```tsx
      <header className="sticky top-0 z-50 bg-[#0047AB] shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/icon-192.png"
              alt="Elo Cultural"
              className="h-8 w-8 md:h-9 md:w-9 rounded-xl bg-white p-1 shadow-sm object-contain transition-all group-hover:scale-105"
            />
            <span className="font-[Sora,sans-serif] font-bold text-lg md:text-xl tracking-tight text-white leading-none">
              Elo<span className="text-white">Cultural</span>
            </span>
          </Link>

          <nav className="flex items-center gap-4 md:gap-6">
            <Link
              href="/"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Início
            </Link>
            <Link
              href="/editais"
              className="hidden sm:block text-sm font-medium text-white/80 hover:text-white transition-colors"
            >
              Editais
            </Link>

            {user ? (
              <Link href="/dashboard">
                <Button variant="outline" className="h-9 px-5 rounded-xl border-white/30 font-semibold text-white hover:bg-white hover:text-[#0047AB] transition-all text-sm">
                  Meu Painel
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="h-9 px-6 rounded-xl bg-white text-[#0047AB] font-semibold hover:bg-white/90 transition-all text-sm shadow-sm">
                  Entrar
                </Button>
              </Link>
            )}
          </nav>
        </div>
      </header>
```

Key changes:
- `bg-[#0B1929]` → `bg-[#0047AB]` (institutional blue)
- Removed `border-b border-white/[0.06]` → `shadow-sm`
- Removed `md:h-18` (non-standard) → just `h-16`
- "Cultural" no longer uses `text-gradient-brand` → plain white
- Nav links: `text-xs` → `text-sm`, `text-white/50` → `text-white/80`
- Added "Início" link, removed "Cadastro" link
- Button: `text-xs` → `text-sm`
- "Entrar" button: `text-[#020817]` → `text-[#0047AB]`
- "Meu Painel" border: `border-white/15` → `border-white/30`, hover inverts to white bg

**Step 2: Verify the build**

Run: `npm run build`
Expected: Succeeds.

**Step 3: Commit**

```bash
git add src/app/(public)/layout.tsx
git commit -m "redesign: header to institutional blue (#0047AB)

Replace dark navy header with brand blue. Add Início nav link,
increase text size to text-sm, simplify button styles."
```

---

### Task 3: Redesign Footer — Remove decorative elements

**Files:**
- Modify: `src/app/(public)/layout.tsx:64-116`

**Step 1: Replace the footer section**

Replace lines 64-116 (the entire `<footer>...</footer>`) with:

```tsx
      <footer className="bg-[#0B1929]">
        <div className="container mx-auto px-6 md:px-8">
          <div className="py-12 md:py-16 flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-2.5">
                <img src="/icon-192.png" alt="Elo Cultural" className="h-8 w-8 rounded-xl bg-white/10 p-1 object-contain" />
                <span className="font-[Sora,sans-serif] font-bold text-lg tracking-tight text-white">
                  EloCultural
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-xs text-center md:text-left">
                Plataforma de gestão de editais culturais. Transparência e eficiência no fomento à cultura.
              </p>
            </div>

            <div className="flex gap-12 md:gap-16">
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Plataforma</h4>
                <div className="flex flex-col gap-2">
                  <Link href="/editais" className="text-sm text-slate-400 hover:text-white transition-colors">Editais</Link>
                  <Link href="/cadastro" className="text-sm text-slate-400 hover:text-white transition-colors">Cadastro</Link>
                  <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Entrar</Link>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Suporte</h4>
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-slate-500">FAQ</span>
                  <span className="text-sm text-slate-500">Contato</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/[0.06] py-6 flex items-center justify-center">
            <p className="text-xs text-slate-500 text-center">
              Elo Cultural &copy; {new Date().getFullYear()} &mdash; Plataforma de Editais Culturais
            </p>
          </div>
        </div>
      </footer>
```

Key changes:
- Removed `text-gradient-brand` from wordmark → plain white "EloCultural"
- Removed brand color dots row
- Removed `text-[10px]` → `text-xs` for headings
- Simplified copyright text: removed "Inteligência em Processos Seletivos Culturais"
- Changed `text-slate-300` → `text-slate-400` for consistent muted look
- Centered bottom bar (removed flex justify-between)
- Removed `border-t border-white/[0.06]` from footer top (not needed with color change)

**Step 2: Verify build**

Run: `npm run build`
Expected: Succeeds.

**Step 3: Commit**

```bash
git add src/app/(public)/layout.tsx
git commit -m "redesign: simplify footer, remove decorative dots

Remove brand color dots, gradient text from wordmark,
simplify copyright text, normalize text sizes."
```

---

### Task 4: Redesign Homepage — Edital slider + Como Funciona + clean editais section

**Files:**
- Modify: `src/app/(public)/page.tsx` (complete rewrite)

**Step 1: Rewrite the entire homepage**

Replace the entire content of `src/app/(public)/page.tsx` with:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { EditalCard } from '@/components/edital/EditalCard'
import { EditalSlider } from '@/components/home/EditalSlider'
import type { Edital } from '@/types/database.types'
import { ArrowRight, FileText, Upload, BarChart3 } from 'lucide-react'

export default async function HomePage() {
  const supabase = await createClient()

  const { data: editais } = await supabase
    .from('editais')
    .select('*')
    .eq('active', true)
    .in('status', ['publicacao', 'inscricao'])
    .order('created_at', { ascending: false })
    .limit(6)

  return (
    <div>

      {/* ═══════════════════════════════════════
          HERO — Edital Slider
          ═══════════════════════════════════════ */}
      <section className="bg-gradient-to-b from-[#F0F4F8] to-white">
        <div className="container mx-auto px-4 py-12 md:py-20">
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight font-[Sora,sans-serif]">
              Plataforma de Editais Culturais
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-500 max-w-xl mx-auto">
              Descubra oportunidades, envie seus projetos e acompanhe resultados de forma transparente.
            </p>
          </div>

          <EditalSlider editais={(editais as Edital[]) || []} />
        </div>
      </section>

      {/* ═══════════════════════════════════════
          COMO FUNCIONA — 3 Steps
          ═══════════════════════════════════════ */}
      <section className="bg-white border-y border-slate-100">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <h2 className="text-lg md:text-xl font-semibold text-slate-900 text-center mb-10 tracking-tight">
            Como Funciona
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-3xl mx-auto">
            {[
              {
                icon: FileText,
                title: 'Consulte Editais',
                description: 'Navegue pelos editais abertos e encontre oportunidades para seu projeto cultural.',
                color: '#0047AB',
              },
              {
                icon: Upload,
                title: 'Envie seu Projeto',
                description: 'Cadastre-se na plataforma e submeta seu projeto cultural de forma simples.',
                color: '#77a80b',
              },
              {
                icon: BarChart3,
                title: 'Acompanhe Resultados',
                description: 'Confira notas, ranking e o resultado final do processo seletivo.',
                color: '#eeb513',
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div key={step.title} className="text-center">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${step.color}12` }}
                  >
                    <Icon className="h-6 w-6" style={{ color: step.color }} />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          EDITAIS EM DESTAQUE
          ═══════════════════════════════════════ */}
      <section className="bg-[#F8FAFC]">
        <div className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-10 gap-4">
            <h2 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">
              Editais em Destaque
            </h2>
            <Button asChild variant="ghost" className="font-medium text-slate-500 hover:text-[var(--brand-primary)] group text-sm">
              <Link href="/editais">
                Ver todos os editais
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {editais && editais.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(editais as Edital[]).map(edital => (
                <EditalCard key={edital.id} edital={edital} href={`/editais/${edital.id}`} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
              <div className="h-14 w-14 rounded-xl bg-[#0047AB]/[0.06] flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-[var(--brand-primary)]" />
              </div>
              <p className="text-base font-semibold text-slate-700 mb-1">Nenhum edital aberto no momento</p>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                Novos editais são publicados periodicamente. Cadastre-se para receber notificações.
              </p>
              <Button asChild className="mt-5 rounded-xl" size="lg">
                <Link href="/cadastro">
                  Cadastrar-se
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
```

Key changes:
- Removed: entire cinematic hero (85vh, Ken Burns, overlays, noise, gradients)
- Removed: stats bar (placeholder numbers)
- Removed: decorative elements (dots, animated underline, gradient line)
- Added: `EditalSlider` component (to be created in Task 5)
- Added: "Como Funciona" section with 3 steps
- Simplified: editais section (removed blurred background shapes, eyebrow badge, animated gradient underline)
- Removed imports: `Image`, `Sparkles`, `Users`, `TrendingUp`

**Step 2: Verify build** (will fail because EditalSlider doesn't exist yet — that's OK, proceed to Task 5)

**Step 3: Commit**

```bash
git add src/app/(public)/page.tsx
git commit -m "redesign: institutional homepage with slider + 'Como Funciona'

Replace cinematic hero with clean edital slider, add 3-step
'Como Funciona' section, simplify editais grid, remove stats
bar and decorative elements."
```

---

### Task 5: Create EditalSlider component

**Files:**
- Create: `src/components/home/EditalSlider.tsx`

**Step 1: Create the slider component**

Create directory and file `src/components/home/EditalSlider.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EditalStatusBadge } from '@/components/edital/EditalStatusBadge'
import type { Edital } from '@/types/database.types'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface EditalSliderProps {
  editais: Edital[]
}

export function EditalSlider({ editais }: EditalSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = editais.length

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % Math.max(total, 1))
  }, [total])

  const prev = useCallback(() => {
    setCurrent((prev) => (prev - 1 + Math.max(total, 1)) % Math.max(total, 1))
  }, [total])

  // Autoplay
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, total])

  if (total === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 text-center max-w-2xl mx-auto">
        <div className="h-1 w-full rounded-full bg-gradient-to-r from-[#0047AB] via-[#e32a74] via-[#eeb513] to-[#77a80b] mb-8" />
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
          Bem-vindo ao Elo Cultural
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Em breve novos editais serão publicados. Cadastre-se para ser notificado.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild className="rounded-xl bg-[#0047AB] hover:bg-[#003d91]">
            <Link href="/editais">Ver Editais</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/cadastro">Cadastrar-se</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative max-w-2xl mx-auto">
      {/* Slides */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Brand color bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#0047AB] via-[#e32a74] via-[#eeb513] to-[#77a80b]" />

        <div className="slider-track" style={{ transform: `translateX(-${current * 100}%)` }}>
          {editais.map((edital) => (
            <div key={edital.id} className="slider-slide p-6 md:p-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-[#0047AB] bg-[#0047AB]/[0.06] px-2.5 py-1 rounded-lg uppercase tracking-wide">
                  {edital.numero_edital}
                </span>
                <EditalStatusBadge status={edital.status} />
              </div>

              <h3 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight mb-3 leading-snug">
                {edital.titulo}
              </h3>

              {edital.descricao && (
                <p className="text-sm text-slate-500 line-clamp-2 mb-5 leading-relaxed">
                  {edital.descricao}
                </p>
              )}

              {edital.fim_inscricao && (
                <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                  <Calendar className="h-4 w-4" />
                  <span>Inscrições até {format(new Date(edital.fim_inscricao), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button asChild className="rounded-xl bg-[#0047AB] hover:bg-[#003d91] text-sm">
                  <Link href={`/editais/${edital.id}`}>Ver Edital</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-xl text-sm">
                  <Link href={`/editais/${edital.id}`}>Saiba Mais</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      {total > 1 && (
        <>
          {/* Arrows */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md transition-all"
            aria-label="Edital anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 h-9 w-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 hover:shadow-md transition-all"
            aria-label="Próximo edital"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {editais.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${
                  i === current ? 'w-6 bg-[#0047AB]' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Ir para edital ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Verify the build**

Run: `npm run build`
Expected: Build succeeds. Homepage now renders with slider.

**Step 3: Commit**

```bash
git add src/components/home/EditalSlider.tsx
git commit -m "feat: add EditalSlider component for homepage

Client-side slider with autoplay (5s), prev/next arrows,
dot navigation. Shows edital title, number, status, deadline.
Empty state shows welcome message with CTAs."
```

---

### Task 6: Simplify EditalCard — Remove exaggerated effects

**Files:**
- Modify: `src/components/edital/EditalCard.tsx`

**Step 1: Simplify the card**

Replace the entire `return` block (lines 43-123) of the `EditalCard` function with:

```tsx
  return (
    <Link href={href} className="block group">
      <div className="relative h-full bg-white rounded-2xl overflow-hidden transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md border border-slate-200 group-hover:border-slate-300 flex flex-col min-h-[260px]">
        {/* Colored accent bar — left side */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ backgroundColor: colors.accent }}
        />

        {/* Card content */}
        <div className="p-5 md:p-6 pl-5 md:pl-7 flex flex-col flex-1">
          {/* Top row: number + status */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <span
              className="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-lg"
              style={{ color: colors.accent, backgroundColor: colors.bg }}
            >
              {edital.numero_edital}
            </span>
            <EditalStatusBadge status={edital.status} />
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-slate-900 leading-snug tracking-tight group-hover:text-[var(--brand-primary)] transition-colors mb-3">
            {edital.titulo}
          </h3>

          {/* Description */}
          {edital.descricao && (
            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed mb-auto">
              {edital.descricao}
            </p>
          )}

          {/* Bottom row: deadline + badges */}
          <div className="pt-4 mt-auto flex items-center justify-between gap-3 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-300" />
              <span className="text-xs font-medium text-slate-500">
                {edital.fim_inscricao ? format(new Date(edital.fim_inscricao), 'dd MMM yyyy', { locale: ptBR }) : 'A definir'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {mood === 'closing' && daysLeft !== null && daysLeft >= 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/60">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {daysLeft === 0 ? 'Hoje' : `${daysLeft}d`}
                </span>
              )}

              {mood === 'recurso' && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-[var(--brand-primary)] bg-[var(--brand-primary)]/[0.06] px-2 py-1 rounded-lg">
                  <Scale className="h-2.5 w-2.5" />
                  Recurso
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
```

Key changes:
- Removed: `group-hover:-translate-y-1.5` → `-translate-y-0.5` (subtle)
- Removed: `group-hover:shadow-[0_20px_60px_-12px_rgba(0,0,0,0.12)]` → `group-hover:shadow-md`
- Removed: hover glow radial gradient div
- Removed: accent bar `group-hover:w-2` expansion → fixed `w-1`
- Removed: arrow button icon in bottom-right
- Removed: custom inline `boxShadow` style
- Removed: `md:rounded-3xl` → just `rounded-2xl`
- Removed: `min-h-[280px] md:min-h-[310px]` → `min-h-[260px]`
- Removed: `animate-pulse` from closing badge
- Simplified: bottom row (removed nested flex/column for prazo label)
- Border: `border-slate-100` → `border-slate-200` (slightly more visible)

**Step 2: Remove unused import**

Remove `ArrowUpRight` from the imports (line 4). The new import line should be:

```tsx
import { Calendar, AlertTriangle, Scale } from 'lucide-react'
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Succeeds.

**Step 4: Commit**

```bash
git add src/components/edital/EditalCard.tsx
git commit -m "redesign: simplify EditalCard hover effects

Remove radial glow, exaggerated translate, expanding accent
bar, arrow icon. Use subtle shadow-md and translate-y-0.5."
```

---

### Task 7: Fix Editais listing page typography

**Files:**
- Modify: `src/app/(public)/editais/page.tsx:19-24`

**Step 1: Fix the H1 and subtitle**

Replace lines 19-24:

```tsx
          <h1 className="text-4xl md:text-6xl font-[900] tracking-tighter text-slate-900 leading-[0.9]">
            Editais <span className="text-[var(--brand-primary)]">Abertos</span>
          </h1>
          <p className="text-base md:text-xl text-slate-500 font-medium italic">
            Descubra novas oportunidades para o seu projeto cultural.
          </p>
```

With:

```tsx
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Editais Abertos
          </h1>
          <p className="text-sm md:text-base text-slate-500">
            Descubra novas oportunidades para o seu projeto cultural.
          </p>
```

Key changes:
- `font-[900]` → `font-bold` (follows typography scale)
- `text-4xl md:text-6xl` → `text-2xl md:text-3xl` (reduced)
- Removed `tracking-tighter leading-[0.9]` → `tracking-tight`
- Removed colored `<span>` on "Abertos"
- Removed `italic` and `font-medium` from subtitle

**Step 2: Verify build**

Run: `npm run build`
Expected: Succeeds.

**Step 3: Commit**

```bash
git add src/app/(public)/editais/page.tsx
git commit -m "fix: correct editais page typography per design scale

Replace font-[900] with font-bold, remove italic subtitle,
reduce heading size to match institutional style."
```

---

### Task 8: Convert Cadastro page to light theme

**Files:**
- Modify: `src/app/(auth)/cadastro/page.tsx`

**Step 1: Replace dark theme wrapper and card**

Replace line 148 (the outer div):

```tsx
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#1a1c20] overflow-hidden selection:bg-[#0047AB]/30">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF1493] rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] opacity-[0.06] pointer-events-none" />
```

With:

```tsx
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
```

Replace line 158 (the card container):

```tsx
        <div className="bg-white/[0.03] backdrop-blur-[32px] rounded-[40px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
```

With:

```tsx
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
```

**Step 2: Convert all dark theme text colors to light theme equivalents**

Apply these replacements throughout the file (use replace-all):

| Dark (old) | Light (new) |
|------------|-------------|
| `text-white` (heading text) | `text-slate-900` |
| `text-white/30` | `text-slate-400` |
| `text-white/40` | `text-slate-500` |
| `text-white/20` | `text-slate-300` |
| `text-white/15` | `text-slate-400` |
| `text-white/10` (placeholder) | `text-slate-300` (placeholder) |
| `bg-white/[0.02]` | `bg-slate-50/50` |
| `bg-white/[0.03]` | `bg-slate-50` |
| `border-white/5` | `border-slate-200` |
| `border-white/10` | `border-slate-200` |
| `bg-white/5` (checkbox) | `bg-slate-50` |
| `text-white` (input text) | `text-slate-900` |
| `placeholder:text-white/10` | `placeholder:text-slate-300` |
| `focus:ring-[#0047AB]/40` | `focus:ring-[var(--brand-primary)]/20` |
| `border-white/10` (profile type button inactive) | `border-slate-200` |
| `text-white/40` (profile type inactive text) | `text-slate-400` |
| `hover:border-white/20` | `hover:border-slate-300` |
| `bg-rose-500/10` (error) | `bg-rose-50` |
| `border-rose-500/20` (error border) | `border-rose-200/60` |
| `text-rose-400` (error text) | `text-rose-600` |
| `text-white` (button text) | `text-white` (keep, buttons stay white on blue) |
| `text-white/60` (voltar button text) | `text-slate-500` |
| `hover:text-white hover:bg-white/5` (voltar hover) | `hover:text-slate-700 hover:bg-slate-100` |
| `bg-white/10` (step indicator inactive) | `bg-slate-200` |
| `hover:text-[#0047AB]` (link) | `hover:text-[var(--brand-primary)]` |
| `text-white underline` (LGPD terms links) | `text-[var(--brand-primary)] underline` |

**Step 3: Fix the step indicator**

Replace:
```tsx
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-[#0047AB]' : 'bg-white/10'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-[#0047AB]' : 'bg-white/10'}`} />
```

With:
```tsx
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 1 ? 'bg-[#0047AB]' : 'bg-slate-200'}`} />
                <div className={`h-1.5 w-8 rounded-full transition-all ${step === 2 ? 'bg-[#0047AB]' : 'bg-slate-200'}`} />
```

**Step 4: Fix heading color**

Replace:
```tsx
              <h1 className="text-3xl font-bold tracking-tight text-white leading-none mb-2">
                Criar <span className="text-[#0047AB]">Conta</span>
```

With:
```tsx
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-2">
                Criar <span className="text-[var(--brand-primary)]">Conta</span>
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Succeeds.

**Step 6: Commit**

```bash
git add src/app/(auth)/cadastro/page.tsx
git commit -m "redesign: convert cadastro page from dark to light theme

Replace dark glassmorphism (#1a1c20) with light institutional
theme (bg-[#F8FAFC]), white card, slate text colors. Remove
background glow effects. Consistent with login page style."
```

---

### Task 9: Convert Esqueci Senha page to light theme

**Files:**
- Modify: `src/app/(auth)/esqueci-senha/page.tsx`

**Step 1: Replace dark theme wrapper**

Replace line 39:
```tsx
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#1a1c20] overflow-hidden selection:bg-[#0047AB]/30">
      {/* Background Depth Effects (Glows) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF1493] rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[150px] opacity-[0.08] pointer-events-none" />
```

With:
```tsx
    <div className="relative min-h-[100dvh] flex items-center justify-center p-4 bg-[#F8FAFC] overflow-hidden selection:bg-[#0047AB]/20">
```

**Step 2: Replace dark card**

Replace line 50:
```tsx
        <div className="bg-white/[0.03] backdrop-blur-[32px] rounded-[40px] border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.6)] overflow-hidden">
```

With:
```tsx
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_40px_rgba(0,0,0,0.06)] overflow-hidden">
```

**Step 3: Convert all dark text colors**

Apply these replacements throughout the file:

- `text-white` (headings) → `text-slate-900`
- `text-white/40` → `text-slate-500`
- `text-white/30` → `text-slate-400`
- `text-white/20` → `text-slate-300`
- `text-white font-bold` (email highlight) → `text-slate-900 font-bold`
- `text-white` (input text) → `text-slate-900`
- `placeholder:text-white/10` → `placeholder:text-slate-300`
- `border-white/5` → `border-slate-200`
- `border-white/10` → `border-slate-200`
- `bg-white/[0.02]` → `bg-slate-50/50`
- `bg-white/[0.03]` → `bg-slate-50`
- `bg-white/5` → `bg-slate-50`
- `focus:ring-[#0047AB]/40` → `focus:ring-[var(--brand-primary)]/20`
- `bg-rose-500/10` → `bg-rose-50`
- `border-rose-500/20` → `border-rose-200/60`
- `text-rose-400` → `text-rose-600`
- `bg-emerald-500/10` (success icon bg) → `bg-emerald-50`
- `border-emerald-500/20` → `border-emerald-200`
- `hover:bg-white/10` → `hover:bg-slate-100`
- `hover:text-white` → `hover:text-slate-700`

**Step 4: Fix the heading**

Replace:
```tsx
                  <h1 className="text-3xl font-bold tracking-tight text-white leading-none mb-2">
                    Recuperar <span className="text-[#0047AB]">Senha</span>
```

With:
```tsx
                  <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-none mb-2">
                    Recuperar <span className="text-[var(--brand-primary)]">Senha</span>
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Succeeds.

**Step 6: Commit**

```bash
git add src/app/(auth)/esqueci-senha/page.tsx
git commit -m "redesign: convert esqueci-senha from dark to light theme

Replace dark glassmorphism with light institutional theme.
White card, slate text colors, no background glow effects.
Consistent with login and cadastro pages."
```

---

### Task 10: Visual verification and final adjustments

**Step 1: Run the dev server**

Run: `npm run dev`
Navigate to: `http://localhost:3000`

**Step 2: Verify each page visually**

Check these pages:
- `/` — Homepage: blue header, edital slider (or welcome card), "Como Funciona", editais grid
- `/editais` — Clean title (font-bold, no italic subtitle)
- `/login` — White theme (should be unchanged)
- `/cadastro` — White theme (no dark glassmorphism)
- `/esqueci-senha` — White theme (no dark glassmorphism)

**Step 3: Fix any visual issues discovered**

Common things to check:
- Header text is readable on blue background
- Slider transitions work
- EditalCards render cleanly
- Footer has no gradient text or dots
- Auth pages have consistent white backgrounds

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final visual adjustments for institutional redesign"
```
