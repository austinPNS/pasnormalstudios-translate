---
name: Sanity integration plan
description: 4-phase plan to replace mock data with real Sanity reads, then writes. Pending — not started.
type: project
---

# Sanity Integration Plan

**Status:** Not started (2026-04-22). Currently the app uses mock `DOCS` in `lib/data.ts` and static `SAMPLE_DOC` in the viewer. Goal: connect to `k15yl91v/production` and drive the UI from real content.

**Why:** The UI is finished but has zero connection to real content. Sanity reads first gives the highest-value signal and validates the HTTP flow + `perspective=previewDrafts` before layering in the translation engine and writes.

**How to apply:** Start with Phase 1 + scoped Phase 2 (product type only). Each phase is independently shippable.

---

## Phase 1: Foundation (lib + env)

**Create:**
- `lib/sanity.ts` — HTTP client helper: `sanityQuery<T>(groq, params?)` using `SANITY_VIEW_TOKEN` + `perspective=previewDrafts`. Use `fetch` directly, no `@sanity/client` dep (matches main project's HTTP-only approach).
- `.env.example` — document `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION`, `SANITY_VIEW_TOKEN` (no token committed)

**Decisions:**
- Server-side only — route handlers call Sanity; client never gets the token
- API version `2025-02-19`, project `k15yl91v`, dataset `production`

## Phase 2: Documents audit API + read path

**Create:**
- `app/api/documents/route.ts` — GET endpoint that runs the 5 audit queries (product, uberProduct, feature.product, pnsCategory, pnsCollection) and returns a unified `DocRecord[]`
- `lib/translatable-fields.ts` — hard-coded map of translatable fields per `_type` (single source of truth; see `.claude/memory/translation-process.md` for the authoritative list)

**Core mapping — Sanity `_type` → UI `DocType`:**

| Sanity `_type` | UI `DocType` | Status calc |
|---|---|---|
| `product` | `product` | count DE fields present / total translatable fields |
| `uberProduct` | `product` (or new type) | same |
| `pnsCategory` | `category` | same |
| `pnsCollection` | `collection` | same |
| `feature.product` | `feature` | same |

**`langs.de.status` mapping (Phase 1 — simple):**
- EN absent → skip doc entirely
- All translatable DE fields present → `approved` (100%)
- Some DE fields present → `progress` (pct = filled/total)
- No DE fields present → `none` (0%)
- `stale` / `review` / `error` deferred to Phase 4 (job system)

**Change:**
- `lib/data.ts` — **remove** `DOCS` export. Keep `LANGS`, `TYPE_LABELS`, `STATUS_LABELS`, `TWEAK_DEFAULTS`, `SAMPLE_DOC` (still mock).
- `components/screens/documents.tsx` — fetch from `/api/documents` on mount, add `useState`/`useEffect`, loading state. No shape change.

**Recommended start:** ship Phase 1 + scoped Phase 2 (just `product` type) first to validate HTTP flow, `previewDrafts`, and status mapping end-to-end. Then extend to other 4 types.

## Phase 3: Single-document viewer

**Create:**
- `app/api/documents/[id]/route.ts` — GET one doc with all translatable fields projected (portable text, i18n.string, i18n.text, nested arrays) → returns `SampleDoc` shape

**Change:**
- `components/screens/viewer.tsx` — fetch from `/api/documents/[id]` instead of using static `SAMPLE_DOC`
- `lib/data.ts` — drop `SAMPLE_DOC` export

**Open decision:** the existing `SampleDoc.blocks` uses `FieldBlock` / `ImageBlock`. Sanity schemas have `specifications`, `features`, `impactFeatures`, `testimonials` — decide whether to use one block per Sanity field group, or flatten everything.

## Phase 4 (deferred): Stale detection, jobs, writes

Once reads work end-to-end, layer in:
- `stale` status: `translationMeta.lastTranslatedAt < _updatedAt`
- Real jobs system (the `/jobs` screen is still mock)
- Write path: `/api/translate` endpoint that does audit+translate+batch patch (using the **draft-aware pattern** — see `feedback-translation-rules.md` rule #5)
- Publish endpoint (batch publish via HTTP API)

---

## Key gotchas to remember (from main-project experience)

1. **Always** pass `perspective=previewDrafts` — matches what Sanity Studio shows (draft wins). Without it, queries return published docs and caused a false-positive `wmechprojer26` result in the Mechanism Pro session.
2. **Fetch ALL translatable fields** in the audit query, not just the one used for filtering. Avoids needing a second pass.
3. **Draft-aware patching** (Phase 4): check `*[_id in ["drafts.doc-1", ...]]{_id}` before mutating — if a draft exists, patch `drafts.{id}`, otherwise patch `{id}`. Mixing these caused a missed translation on `shopifyProduct-15580693135744`.
4. Never commit the `SECRET_SANITY_ADMIN_TOKEN` — the `.env.example` should list the name only.
