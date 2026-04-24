---
name: TODO — Sanity integration outstanding work
description: Remaining work to finish connecting pns-translate to Sanity — Phase 3B (nested arrays in viewer) and Phase 4 (writes, jobs, stale detection, editing).
type: project
---

# TODO — Outstanding Work

As of 2026-04-24. Phases 1, 2, and 3A are complete — see [sanity-integration-plan.md](sanity-integration-plan.md) for what shipped. What's below is what's still mock or stubbed.

## Phase 3B — Nested arrays in the viewer

**Why:** Phase 3A only handles flat fields (i18n.string, i18n.text, portable text). uberProduct and pnsCollection have repeating groups that the viewer doesn't render yet.

**How to apply:** Add a `kind: 'nestedArray'` or similar to [lib/translatable-fields.ts](lib/translatable-fields.ts), teach `buildDetailProjection` to project array elements with their `_key`, and extend [lib/document-mapper.ts](lib/document-mapper.ts) to emit one `FieldBlock` per array item using the EN title/name as the item label. No viewer UI changes needed — each array item becomes a `FieldItem` row.

- **uberProduct:**
  - `specifications[].description` (portable text per item; use `specifications[].title.en` as the row label)
  - `features[].title` + `features[].text`
  - `impactFeatures[].title` + `impactFeatures[].text`
  - `testimonials[].name` + `testimonials[].role` + `testimonials[].quote`
- **pnsCollection:**
  - `collectionFeatures*.features[].title` + `.text`
  - Gallery titles
  - CTA button titles

## Phase 4 — Write path + status

**Why:** Viewer is read-only, all write/approve UI is stubbed, jobs screen is mock. Closing this is the full translation loop.

**How to apply:**
- `/api/translate` endpoint — audit + translate + batch patch. Must use draft-aware pattern (feedback rule #5): check `*[_id in ["drafts.doc-1", …]]{_id}` before mutating, patch `drafts.{id}` if it exists, else `{id}`.
- `/api/publish` endpoint — batch publish via Sanity HTTP API mutate.
- Stale detection on list/detail endpoints: `translationMeta.lastTranslatedAt < _updatedAt` → status `'stale'`.
- Wire viewer header buttons: "Sync to Sanity", "Re-run", "Approve", "History", "Open in Sanity".
- Real jobs: replace mock `JOBS` in [lib/data.ts](lib/data.ts) with a jobs store (could be another JSON file via [lib/server-storage.ts](lib/server-storage.ts) pattern) + endpoint.

## Portable text editing (part of Phase 4)

**Why:** Read-only works for review, but translators need to edit inline. The patch must preserve EN block structure exactly — same `_key` per block and per span, same block/span count, never markdown (feedback rule #2).

**How to apply:** Carry the raw block array alongside the flattened string in the `SampleDoc` shape (e.g., a `raw?: unknown` on `FieldItem`). Use it as the edit target. On patch, build the DE block array by copying the EN structure and replacing span `text` values only.

## Other uncommitted work (not Sanity-related)

- `components/screens/free-text.tsx` is wired into [app/page.tsx](app/page.tsx) but the file itself is untracked in git. Either commit it separately or drop it. Not in scope for the Sanity track.
