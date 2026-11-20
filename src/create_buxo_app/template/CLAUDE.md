# CLAUDE.md

Guidance for Claude Code when working in this repository. README.md has the full conventions; this
is the short version.

## Commands

Package manager is **pnpm** (never npm or yarn).

- `pnpm dev` — Next dev server with Turbopack
- `pnpm build` — production build
- `pnpm check` — format check, lint, typecheck, tests. Run before calling work done
- `pnpm format:write` — prettier
- `pnpm test` / `pnpm test:watch` — Vitest (single run / watch)
- `pnpm theme` — regenerate the color theme from `theme.config.json`

## Rules

- Colors come from the generated Material 3 roles (`bg-primary`, `text-on-surface-variant`, ...). Never
  use raw hex or Tailwind's default palette, and never edit `src/app/theme.css` or
  `src/lib/theme-colors.ts` by hand: change `theme.config.json` and run `pnpm theme`.
- Reuse the building blocks in `src/components/` (listed in README.md) before writing new ones. Add a
  new shared component to `/styleguide` too.
- Build class names with `cn()` from `@/lib/utils`.
- Every page exports `metadata = pageMetadata(PAGE)` and renders `<JsonLd data={webPageLd(PAGE)} />`.
  Never hand-write a page's `openGraph`/`twitter`. New public pages go in `src/app/sitemap.ts`.
- Don't `setState` inside `useEffect` to read browser-only values; use `useSyncExternalStore`
  (see `src/components/theme-toggle.tsx`).
- Pages are server components; interactive parts go in a sibling `'use client'` file.
- Tests live in `src/tests/` and import from `vitest` explicitly (globals are off).
