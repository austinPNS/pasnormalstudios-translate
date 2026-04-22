# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**pns-translate** is a standalone Next.js 14 translation management UI for Pas Normal Studios. It's a separate tool from the main `pas-normal-studios-web` headless e-commerce project but shares its translation rules, glossary, and DE style guide.

The app provides screens for managing multilingual content workflows: document overview, per-document viewer/editor, prompts, jobs, glossary, and settings.

**Languages supported:** EN (source), DE, FR, IT

## Tech Stack

- **Framework:** Next.js 14 App Router (`app/` directory)
- **React:** 18.3
- **TypeScript:** 5.5
- **State:** localStorage (client) + JSON files (server, via `lib/server-storage.ts`)
- **Styling:** Single `app/globals.css` — no CSS framework
- **No Sanity integration yet** — mock data lives in `lib/data.ts`

## Common Commands

```bash
npm run dev          # Start dev server on localhost:3000
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript check (no emit)
```

## Architecture

### Directory Structure

- **`app/`** — Next.js App Router
  - `page.tsx` — Main shell with route state, renders the selected screen
  - `layout.tsx` — Root layout
  - `globals.css` — All styling
  - `api/glossary/route.ts` — GET/PUT glossary entries
  - `api/prompts/route.ts` — GET/PUT per-language prompts
- **`components/`**
  - `screens/` — Route screens: `documents`, `viewer`, `prompts`, `jobs`, `glossary`, `settings`
  - `sidebar.tsx` / `tweaks-panel.tsx` / `bulk-modal.tsx` / `primitives.tsx` / `icons.tsx`
- **`lib/`**
  - `types.ts` — All shared types (`LangCode`, `DocRecord`, `SampleDoc`, `GlossaryRow`, `PromptEntry`, `JobRecord`, `Tweaks`)
  - `data.ts` — Mock data (DOCS, JOBS, SAMPLE_DOC, LANGS, label maps, tweak defaults)
  - `protected-terms.ts` — Exports `PROTECTED_GLOSSARY` from `data/protected-terms.json`
  - `server-storage.ts` — File-system read/write of `data/glossary.json` + `data/prompts.json`
  - `client-storage.ts` — Fetch wrappers for the API routes
- **`data/`** — JSON seed/state files
  - `glossary.json` — User-editable glossary entries
  - `prompts.json` — Per-language translation rules (matches main project)
  - `protected-terms.json` — 437 protected terms (brands, colors, product names) — DO NOT translate

### Routing

The app uses a single-page shell (`app/page.tsx`) with client-side route state (`'documents' | 'viewer' | 'prompts' | 'jobs' | 'glossary' | 'settings'`). The selected route is persisted in `localStorage`.

### State persistence

- **Client state** (route, tweaks): `localStorage` keys `pns.route` and `pns.tweaks`
- **Server state** (glossary, prompts): JSON files in `data/`, written atomically via `.tmp` rename
- No database

### Iframe integration

The shell listens for `window.postMessage` events `__activate_edit_mode` / `__deactivate_edit_mode` and posts `__edit_mode_available` + `__edit_mode_set_keys` — designed to be embedded in a parent editor.

## Claude memory (shared via git)

Translation knowledge — style guide, process, feedback rules — lives in `.claude/memory/`:

- `.claude/memory/MEMORY.md` — index
- `.claude/memory/translation-style-de.md` — DE style guide (gender prefixes, tone, locked terms, spec patterns)
- `.claude/memory/translation-process.md` — full flow (audit → confirm → translate → batch patch → publish), Sanity HTTP API patterns
- `.claude/memory/feedback-translation-rules.md` — 7 consolidated feedback rules

These are committed to git so the knowledge is shared across collaborators and future Claude sessions.

## Translation Rules (shared with main project)

**Source of truth for translation rules:**
1. `data/protected-terms.json` (absolute blocklist — never translate)
2. `data/prompts.json` → `de.specialRules` (official DE rules, 36 items)
3. Memory file: DE style guide (see `memory/translation-style-de.md`)

**Priority order when translating:** protected terms > prompts.json > style guide.

### DE Rules (summary — see memory for full details)

- Informal `Du` form
- Gender prefixes: `Men's` → `Männer`, `Women's` → `Frauen` (products/uberProducts)
- Gender prefixes for categories: `Herren` / `Damen`
- Product names stay English after prefix: `Frauen Essential Jersey`
- Never translate: brand names, collection names (Mechanism, Essential, Off-Race, PAS, T.K.O., etc.), colors, product type words (Bibs, Jersey, Speedsuit, Baselayer)
- Use `Material` (not `Stoff`/`Gewebe`)
- `Schutz vor Wind` / `Schutz vor Regen` (not `Windschutz`/`Wasserschutz`)
- Reframe "limited protection" positively → `gezielten Schutz`
- Portable text: preserve EN block structure exactly (same `_key`, same number of blocks/spans)

### Sanity integration (future — not yet implemented here)

When wiring this tool to Sanity, the main project uses the **Sanity HTTP API directly** (not MCP tools). Config:
- Project ID: `k15yl91v`
- Dataset: `production`
- API version: `2025-02-19`
- Always query with `perspective=previewDrafts`
- **Draft-aware patching:** check if `drafts.{id}` exists before patching; patch the draft ID if it does

See `memory/translation-phase2-process.md` for the full HTTP API flow (merged audit+fetch, batch mutations, batch publish).

## Code Conventions

- **TypeScript everywhere** — no `.js` files
- **Path alias:** `@/*` → project root (see `tsconfig.json`)
- **`'use client'`** directive needed for any component using hooks/localStorage/window
- **Types in `lib/types.ts`** — add new types there, not inline
- **Mock data in `lib/data.ts`** — keep seed/fake data isolated until real data layer exists
- **Atomic file writes** — use the pattern in `lib/server-storage.ts` (tmp file + rename)

## What to avoid

- Don't add Sanity SDK (`@sanity/client`, `next-sanity`) — this tool currently has no Sanity connection. Use the HTTP API pattern from the main project if/when you wire it up.
- Don't add a database — state lives in JSON files + localStorage by design.
- Don't translate protected terms, even if they look translatable.
