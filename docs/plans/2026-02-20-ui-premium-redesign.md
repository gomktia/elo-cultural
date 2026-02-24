# UI Premium Redesign — Elo Cultura

**Data:** 2026-02-20
**Foco:** Gestor/Admin experience
**Stack:** Next.js 16, Tailwind CSS 4, Shadcn/UI, framer-motion (timeline only)

## Decisões de Design

- **Cores dinâmicas:** Server-side via layout.tsx → CSS vars `--color-brand` / `--color-brand-secondary`
- **Animações:** framer-motion exclusivamente na EditalTimeline (15 fases)
- **Dark mode:** Estrutura CSS `dark:` implementada, toggle não exposto
- **Fundo dashboard:** `bg-gradient-to-br from-slate-50 to-blue-50/30`

## Componentes a Modificar

1. `src/app/globals.css` — CSS variables + dark skeleton
2. `src/app/(dashboard)/layout.tsx` — injeção server-side de --color-brand
3. `src/components/layout/AppSidebar.tsx` — glassmorphism
4. `src/components/layout/TenantHeader.tsx` — premium header
5. `src/components/edital/EditalCard.tsx` — mood cards (3 estados)
6. `src/components/edital/EditalTimeline.tsx` — fluid timeline com framer-motion
7. `src/components/edital/EditalStatusBadge.tsx` — badges refinados
8. `src/app/(dashboard)/gestor/page.tsx` — dashboard premium

## Mood Cards

| Status | Visual |
|--------|--------|
| `inscricao` | `ring-emerald-400/50` + badge verde pulsante |
| prazo < 7 dias | `ring-amber-400/50` + gradiente alerta no topo |
| `recurso_*` | `ring-blue-400/50` + botão protocolo destacado |
| outros | sombra suave padrão |

## Timeline (framer-motion)

- `layoutId` por fase para transição de estado suave
- Fase ativa: glow `drop-shadow` em `--color-brand` + pulse `opacity: [0.7, 1, 0.7]`
- Fases concluídas: checkmark com `scale: 0 → 1` animado
