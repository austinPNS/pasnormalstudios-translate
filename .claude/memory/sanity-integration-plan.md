---
name: Sanity integration plan
description: 4-phase plan to replace mock data with real Sanity reads, then writes. Pending — not started.
type: project
---

# Sanity Integration Plan

**Status:** Phase 1 + Phase 2 + Phase 3A complete (2026-04-24). Documents screen and viewer both driven by real Sanity content. `SAMPLE_DOC` deleted. Next: Phase 3B (uberProduct nested arrays: `specifications[]`, `features[]`, `impactFeatures[]`, `testimonials[]`; pnsCollection nested `collectionFeatures*.features[]`, gallery, CTAs).

**Why:** The UI is finished but has zero connection to real content. Sanity reads first gives the highest-value signal and validates the HTTP flow + `perspective=previewDrafts` before layering in the translation engine and writes.

**How to apply:** Start with Phase 1 + scoped Phase 2 (product type only). Each phase is independently shippable.

---

## Phase 1: Foundation (lib + env) — DONE

- `lib/sanity.ts` ships a `sanityQuery<T>()` helper using `perspective=previewDrafts` and `SECRET_SANITY_VIEW_TOKEN`. No `@sanity/client` dep.
- Env reads use `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SANITY_API_VERSION`, plus the server-only `SECRET_SANITY_VIEW_TOKEN`.

## Phase 2: Documents audit API + read path — DONE

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

**Shipped coverage:** `product`, `uberProduct` (incl. `sharedProductIntendedUse->title/description` ref), `feature.product`, `pnsCategory`, `pnsCollection`, `frontPage` stub. `aliasFor()` handles both `.` and `->` in paths. Matching filter tabs exist in [documents.tsx](components/screens/documents.tsx). Nested-array fields (`specifications[]`, `features[]`, `impactFeatures[]`, `testimonials[]`, collection features/gallery) are deferred — they need richer projection and a different status-count model.

## Phase 3A: Single-document viewer — DONE

- `app/api/documents/[id]/route.ts` resolves `_type` via draft-aware lookup (`_id == $id || _id == "drafts." + $id`), then projects translatable fields per-type via shared `buildDetailProjection`.
- `lib/document-mapper.ts` groups fields into semantic blocks (Core / Content / Model Info / SEO / Intended Use) using the new `group` field on `TranslatableField`. Flattens portable text to plain strings joined with `\n\n`.
- `SampleDoc.sanityType: string` added so the viewer header displays the real Sanity `_type`.
- Viewer has loading / error / empty states and fetches on `docId` change.

**Nested arrays and repeating groups (`specifications[]`, `features[]`, `impactFeatures[]`, `testimonials[]`, collection features/gallery/CTAs) are deferred to Phase 3B.** The current mapper only handles flat i18n.string / i18n.text / portable text.

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
