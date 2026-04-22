---
name: Translation rules and feedback
description: Consolidated feedback rules for translation workflow — source priority, portable text, field completeness, intendedUse, draft-aware patching, audit output
type: feedback
---

## 1. Source priority (glossary wins)

**Glossary files (`data/protected-terms.json` + `data/prompts.json`) ALWAYS override the learned style guide.**

**Why:** The glossary is the authoritative source. The style guide in memory is supplementary — it captures patterns learned over time, but official rules live in `data/`.

**How to apply:** When a style guide entry conflicts with a protected term or a `prompts.json` rule, follow the glossary.

## 2. Portable text — preserve block structure exactly

When translating portable text fields (e.g., `description.de`), patch as raw JSON block array. **Never convert from markdown** — it breaks the block structure.

**Why:** Markdown conversion interprets paragraph breaks and sizes as bullet lists, headings, horizontal rules. The EN description is typically a single block with one span — the DE must mirror that exact structure (same `_key` values, same number of blocks/spans, same marks).

**How to apply:** Inspect the EN structure first. Build the DE as a JSON array of blocks matching the same shape. Keep EN `_key` values on each block and span so the mapping is preserved.

## 3. Fetch ALL translatable fields

When fetching documents for translation, always fetch ALL translatable fields for that document type — not just the field used in the audit/missing filter.

**Why:** The audit filter might match on `title.de` missing, but the doc may also have `description.de`, `details.de`, `color.de` etc. missing. If you only fetch what the audit checked, you'll miss fields and need a second pass.

**How to apply:** During the Translate step, fetch the full document (or at minimum all translatable fields for that `_type`). Translate ALL missing target-language fields in a single pass.

## 4. uberProduct: always translate sharedProductIntendedUse

When translating `uberProduct` documents, always translate the `sharedProductIntendedUse` reference (via `sharedProductIntendedUse->title.de` / `description.de`) in addition to title, description, details, and specifications.

**Why:** The user flagged this field being missed during a previous translation batch.

**How to apply:** When fetching uberProduct docs, project `sharedProductIntendedUse->{_id, title, description}` and translate those on the referenced doc.

## 5. Draft-aware patching (Sanity)

Before patching Sanity docs, check if a `drafts.{id}` version exists.

**Why:** Patching the base ID (e.g., `shopifyProduct-xxx`) updates the published doc. But if `drafts.shopifyProduct-xxx` exists, Sanity Studio shows the draft — so the user won't see the update. This happened on `shopifyProduct-15580693135744` in the Mechanism Pro batch: patch went to published, Studio showed old draft data.

**How to apply:**
1. Before patching, run: `*[_id in ["drafts.doc-1", "drafts.doc-2", ...]]{ _id }`
2. If `drafts.{id}` exists → use `drafts.{id}` as the patch target
3. If no draft exists → use `{id}` directly

## 6. Audit output format

Audit results show only **ID + title**, grouped by collection/category/type. No per-field missing breakdown in the top-level report unless asked.

**Why:** The user wants a compact scannable list for confirming scope, not a verbose dump.

**How to apply:** Summary format:
```
product (12 docs):
  shopifyProduct-xxx — "Men's Mechanism Pro Bibs" — missing: title, color, details, description
  ...
```
Group by type, show `_id — "title"` with a single concatenated missing-fields line.

## 7. Use Sanity HTTP API, not MCP

All Sanity operations (query, patch, schema, publish) via the HTTP API directly. **Never use MCP tools** (`mcp__claude_ai_Sanity__*`).

**Why:** User preference — direct API control without an MCP abstraction layer.

**How to apply:** Use curl/fetch with `https://k15yl91v.api.sanity.io/v2025-02-19/data/{query|mutate}/{dataset}` and the `SECRET_SANITY_VIEW_TOKEN` / `SECRET_SANITY_ADMIN_TOKEN` env vars.
