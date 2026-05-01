# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

**pns-translate** is a standalone Next.js 14 translation management UI for Pas Normal Studios. It's a separate tool from the main `pas-normal-studios-web` headless e-commerce project but shares its translation rules, glossary, and DE style guide.

The app provides screens for managing multilingual content workflows: document overview, per-document viewer/editor, free-text translation, prompts, glossary, and settings.

**Languages supported:** EN (source), DE, FR, IT

## Tech Stack

- **Framework:** Next.js 14 App Router (`app/` directory)
- **React:** 18.3
- **TypeScript:** 5.5
- **State:** URL hash (route) + localStorage (UI tweaks) + JSON files (glossary, prompts via `lib/server-storage.ts`) + Sanity (documents)
- **Styling:** Single `app/globals.css` — no CSS framework
- **Sanity:** wired via HTTP API in `lib/sanity.ts` (no SDK). `/api/documents` and `/api/documents/[id]` fetch live content; the translator writes back via mutations.

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
  - `page.tsx` — Main shell with hash-based routing, renders the selected screen
  - `layout.tsx` — Root layout
  - `globals.css` — All styling
  - `api/documents/route.ts` + `api/documents/[id]/route.ts` — Sanity-backed document list/detail
  - `api/translate/route.ts` + `api/bulk-translate/route.ts` — Anthropic-backed translation
  - `api/free-text/route.ts` + `api/prompt-preview/route.ts` — ad-hoc translation endpoints
  - `api/glossary/route.ts` — GET/PUT protected-terms (categorized → flattened to `GlossaryRow[]` for the client)
  - `api/prompts/route.ts` — GET/PUT per-language prompts
- **`components/`**
  - `screens/` — Route screens: `documents`, `viewer`, `free-text`, `prompts`, `glossary`, `settings`
  - `sidebar.tsx` / `tweaks-panel.tsx` / `bulk-modal.tsx` / `primitives.tsx` / `icons.tsx`
- **`lib/`**
  - `types.ts` — All shared types (`LangCode`, `DocRecord`, `SampleDoc`, `GlossaryRow`, `PromptEntry`, `Tweaks`)
  - `data.ts` — `LANGS`, label maps, tweak defaults, SSR fallbacks for prompts/glossary
  - `protected-terms.ts` — Reads `data/protected-terms.json`, flattens to `PROTECTED_GLOSSARY: GlossaryRow[]`, exports `groupRowsByCategory` for the API route
  - `server-storage.ts` — File-system read/write of `data/protected-terms.json` (glossary surface) + `data/prompts.json`
  - `sanity.ts` — HTTP API client (no SDK)
  - `translator.ts` — Anthropic SDK wrapper used by the translate endpoints
  - `client-storage.ts` — Fetch wrappers for the API routes
- **`data/`** — JSON seed/state files
  - `prompts.json` — Per-language translation rules (matches main project)
  - `protected-terms.json` — Protected terms grouped by category (`companyNames`, `collectionNames`, `wordsAndPhrases`, `colors`, `productNames`) — DO NOT translate. Read AND written by the Glossary screen.

### Routing

The app uses a single-page shell (`app/page.tsx`) with hash-based routing. `window.location.hash` is the source of truth: `#settings`, `#prompts`, `#glossary`, `#free-text`, `#viewer/<docId>`, or empty for documents. Reload, browser back/forward, and shareable deep-links all work.

### State persistence

- **Route**: URL hash (`window.location.hash`)
- **UI tweaks**: `localStorage` key `pns.tweaks`
- **Glossary / prompts**: JSON files in `data/`, written atomically via `.tmp` rename
- **Documents**: live from Sanity — no local cache
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

### Sanity integration

Wired via `lib/sanity.ts` using the **Sanity HTTP API directly** (not the SDK). Config lives in env vars consumed by that module. Conventions:
- Always query with `perspective=raw` to surface both drafts and published rows; the API routes pick the live one (draft if it exists).
- **Draft-aware patching:** check if `drafts.{id}` exists before patching; patch the draft ID if it does.
- Translatable-field metadata (per `_type`) lives in `lib/translatable-fields.ts`.

See `memory/translation-phase2-process.md` for the full HTTP API flow (merged audit+fetch, batch mutations, batch publish).

## Code Conventions

- **TypeScript everywhere** — no `.js` files
- **Path alias:** `@/*` → project root (see `tsconfig.json`)
- **`'use client'`** directive needed for any component using hooks/localStorage/window
- **Types in `lib/types.ts`** — add new types there, not inline
- **Atomic file writes** — use the pattern in `lib/server-storage.ts` (tmp file + rename)

## What to avoid

- Don't add the Sanity SDK (`@sanity/client`, `next-sanity`) — keep using the HTTP API pattern in `lib/sanity.ts`.
- Don't add a database — glossary/prompts live in JSON files; route lives in URL hash; documents live in Sanity.
- Don't translate protected terms, even if they look translatable.
