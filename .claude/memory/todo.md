---
name: TODO — Sanity integration outstanding work
description: Remaining work to finish connecting pns-translate to Sanity. Phase 4 = write path. Today's status — only the publish endpoint left.
type: project
---

# TODO — Outstanding Work

As of 2026-04-28 (updated). Phases 1, 2, 3A, 3B all shipped — see [sanity-integration-plan.md](sanity-integration-plan.md).

## Shipped today

- **Bulk translate** end-to-end: [/api/bulk-translate](app/api/bulk-translate/route.ts) does single-query-per-type fetch, draft-aware patching, single-mutate write, with SSE progress streaming and prompt-cache warming (first call alone, then parallel — see [feedback-prompt-cache-warming.md](feedback-prompt-cache-warming.md)).
- **Portable text auto-translate**: [/api/translate](app/api/translate/route.ts) + bulk both rebuild block arrays with translated span text (preserves every `_key` per feedback rule #2).
- **Open in Sanity** wired in row menu and viewer header — uses intent URLs (`<base>/intent/edit/id=<id>;type=<type>`). Configure base via `NEXT_PUBLIC_SANITY_STUDIO_URL`.
- **Viewer cleanup**: removed "Sync to Sanity" stub.
- **Documents toolbar cleanup**: removed `Type: any`, `Updated: any`, `Columns` ghost buttons.
- **Sidebar cleanup**: removed Jobs nav (mock screen wasn't useful).

## Next up

### `/api/publish` endpoint

**Why:** Translations currently land as drafts and sit there. Editors have to publish manually in Sanity Studio. An app-side publish closes the loop.

**How to apply:**
- Endpoint accepts `{ docIds: string[] }` (and maybe `targets` if we want per-language publish, but Sanity publishes whole docs).
- Use the **draft-aware** pattern (feedback rule #5): pre-check `*[_id in ["drafts.<id>", ...]]{ _id }`. For each draft, mutate with `createOrReplace` to copy `drafts.<id>` → `<id>`, then `delete` the draft. (This is how Sanity Studio's "Publish" button works under the hood.)
- One Sanity mutate call with all create/replace + delete operations.
- UI entry point: a "Publish" button somewhere — likely on the documents list selection bar (next to "Bulk Translate") or a row action.

## Decided not needed

- Re-run / Approve / History buttons in viewer header — user confirmed not needed (2026-04-28).
- Inline portable text editing in the viewer — user confirmed not needed (2026-04-28).
- Stale detection on the list endpoint — scaffolding exists in UI but compute layer skipped (user confirmed not needed for now, 2026-04-28).
- Real jobs store + Jobs screen — Jobs nav removed; bulk modal shows progress directly.

## Unrelated loose end

- `components/screens/free-text.tsx` is wired into [app/page.tsx](app/page.tsx) but the file itself is untracked in git. Either commit or drop. Not in scope of the Sanity track.
- `components/screens/jobs.tsx` and the `JOBS` mock in [lib/data.ts](lib/data.ts) are now unreachable (Jobs nav removed). Safe to delete on next cleanup pass.
