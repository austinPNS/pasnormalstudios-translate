# Memory

Project-specific knowledge for the `pns-translate` translation management UI. Translation rules originate from the main `pas-normal-studios-web` project and are mirrored here so this tool produces consistent output.

## Pending Tasks
- [TODO — outstanding Sanity work](todo.md) — Phase 3B (nested arrays on uberProduct + pnsCollection), Phase 4 (writes, stale detection, jobs, portable text editing)
- [Sanity integration plan](sanity-integration-plan.md) — reference plan. Phases 1, 2, 3A shipped

## Shortcuts
- **"translate"** → [Translation process](translation-process.md): audit → confirm scope → translate → batch patch → review → publish
- **"show missing translations"** → Run audit only; no patching until user confirms scope

## Translation Style Guides
- [German (DE) style guide](translation-style-de.md) — gender prefixes (Männer/Frauen for products, Herren/Damen for categories), tone, 30+ locked terms, spec patterns, portable text rules

## Translation Rules
- [Consolidated translation feedback](feedback-translation-rules.md) — 7 rules:
  1. Source priority: glossary > style guide
  2. Portable text: preserve block structure exactly, never markdown
  3. Fetch ALL translatable fields (not just the one that triggered audit)
  4. uberProduct: always translate sharedProductIntendedUse
  5. Draft-aware patching: check drafts.{id} before patching Sanity
  6. Audit output format: compact ID + title, grouped by type
  7. Use Sanity HTTP API directly, never MCP tools

## Key sources (in this repo)
- `data/protected-terms.json` — absolute blocklist (brands, colors, product names) — PRIORITY 1
- `data/prompts.json` → `de.specialRules` — official DE rules (36 items) — PRIORITY 2
- `.claude/memory/translation-style-de.md` — learned patterns — PRIORITY 3

## Sanity config (for future integration)
- Project ID: `k15yl91v`
- Dataset: `production`
- API version: `2025-02-19`
- Always use `perspective=previewDrafts` when querying
