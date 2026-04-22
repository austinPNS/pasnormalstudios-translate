---
name: Translation Process
description: Full translation flow for Pas Normal Studios content — audit, translate, batch patch, review, publish. Designed around Sanity HTTP API when this tool is connected. Works standalone with in-repo JSON too.
type: reference
---

# Translation Process

## Batch Flow (merged — single query, single patch)

```
Audit+Fetch (single query per type, returns ALL EN fields)
  → User confirms scope
  → Load glossary + style guide (once)
  → Translate (data already in context)
  → Single batch patch (all docs in one API call)
  → Report summary → User reviews
  → Single batch publish (on request)
```

### Step 1: Audit+Fetch — Show Missing
**Trigger:** `"show missing translations"` / `"translate to de"` / `"translate missing [_type] to de"`

1. Run a query that **both filters for missing AND returns all EN fields** — one query per type
2. Data is now in context for translation (no re-fetch needed)
3. Display summary report — **no translation, no patching yet**:
   ```
   Missing DE translations:

   uberProduct (3 docs):
     - uberProduct-xxx — "Product Name" — missing: title, details, specifications[2]
     ...

   product (12 docs):
     - shopifyProduct-xxx — "Product Name" — missing: title, details, color
     ...

   Total: 15 documents with missing DE translations
   ```
4. User confirms scope (all, specific type, or specific docs)

### Step 2: Translate + Batch Patch (no approval)
**Trigger:** User confirms scope from Step 1

1. Load glossary + style guide **ONCE** (deferred until user confirms — not loaded during audit)
2. Translate all fields for confirmed docs (data already in context from Step 1 — no re-fetch)
3. Build a **single mutations array** with all patches + translationMeta updates
4. **One API call** to commit all changes
5. Report completion summary

### Step 3: Batch Publish (on request)
**Trigger:** `"publish"` / `"publish all"`

1. User reviews drafts first
2. When satisfied, user asks to publish
3. **One API call** with all publish mutations

### Mode A: Specific Document
**Trigger:** `"translate [doc-id] to de"`

1. Fetch document by ID (with all translatable fields)
2. Load glossary + style guide
3. Translate all fields → patch directly via single API call (no diff preview)
4. Report completion, user reviews, publishes on request

---

## Sanity HTTP API (when this tool is wired to Sanity)

The main project uses Sanity HTTP API directly. **Never use MCP tools.**

**Config:**
- Project ID: `k15yl91v`
- Dataset: `production`
- API version: `2025-02-19`
- Read token: `SECRET_SANITY_VIEW_TOKEN` (env var, never committed)
- Write token: `SECRET_SANITY_ADMIN_TOKEN` (env var, never committed)

**Query (read):**
```bash
curl -s -G "https://k15yl91v.api.sanity.io/v2025-02-19/data/query/production" \
  -H "Authorization: Bearer $TOKEN" \
  --data-urlencode "query=$QUERY" \
  --data-urlencode "perspective=previewDrafts"
```
**CRITICAL:** Always include `perspective=previewDrafts` — matches Sanity Studio's view (draft wins over published).

**Batch Mutate (draft-aware patching):**

Before building mutations, check which docs have a `drafts.` version:
```groq
*[_id in ["drafts.doc-1", "drafts.doc-2", ...]]{ _id }
```
- If `drafts.{id}` exists → patch `drafts.{id}` (Studio shows the draft)
- If no draft exists → patch `{id}` directly (goes to published, which is what Studio shows)
- Patching the base ID when a draft exists means Studio won't show the update!

```bash
curl -s -X POST "https://k15yl91v.api.sanity.io/v2025-02-19/data/mutate/production" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mutations": [
      {"patch": {"id": "drafts.doc-1", "set": {"title.de": "...", "translationMeta": {...}}}},
      {"patch": {"id": "doc-2", "set": {"title.de": "...", "translationMeta": {...}}}}
    ]
  }'
```

---

## Publishing Filters (when querying Sanity)

| _type | Filter |
|---|---|
| **All types** | `!(_id in path("drafts.**"))` — exclude draft IDs from result |
| **All types** | `!defined(translationMeta.lastTranslatedAt)` — exclude already-translated docs |
| **uberProduct** | `products[]` not empty AND at least 1 referenced product has `publishingSettings.public == true` |
| **product** | `publishingSettings.public == true` AND `store.status == "active"` AND `store.isDeleted != true` |

## "Missing" Definition

A field is considered **missing translation** if:
- The EN field has content AND the target language key doesn't exist or is empty
- For portable text: the EN blocks exist but DE blocks don't exist or `count() == 0`
- For specifications: `specifications[].description.en` exists but `.de` is empty

**Don't rely only on `translationMeta`** — always check actual field content. But DO use `translationMeta.lastTranslatedAt` as a pre-filter to skip already-translated docs.

---

## Translatable Fields Per Type (Sanity main project)

### i18n.string (direct string translation)
| _type | Fields |
|---|---|
| uberProduct | `title`, `sharedProductIntendedUse` (via ref), `testimonials[].name`, `testimonials[].role`, `modelInfo.text`, `modelInfo.womenText` |
| product | `title`, `color`, `seo.title`, `modelInfo.text`, `modelInfo.womenText` |
| feature.product | `title` |
| pnsCategory | `title` |
| pnsCollection | `title`, `featuredTag`, `seo.title`, gallery titles, CTA button titles |

### i18n.text (direct text translation)
| _type | Fields |
|---|---|
| uberProduct | `details`, `testimonials[].quote` |
| product | `details`, `seo.description` |
| feature.product | `text` |
| pnsCollection | `seo.description` |

### Nested i18n in arrays (iterate + translate each)
| _type | Fields |
|---|---|
| uberProduct | `specifications[].description`, `features[].title/text`, `impactFeatures[].title/text` |
| pnsCollection | `collectionFeatures*.features[].title/text` |

### Portable text with locale keys (translate text, preserve block structure exactly)
| _type | Fields |
|---|---|
| uberProduct | `description.de` |
| product | `description.de` |
| pnsCategory | `description.de` |

---

## Translation Execution Steps

### Setup (once per session, after user confirms scope)
1. **Load glossary** — `data/protected-terms.json` + `data/prompts.json` (PRIORITY 1)
2. **Load style guide** — `.claude/memory/translation-style-de.md` (PRIORITY 2)

> Deferred until Step 2 — NOT loaded during audit. Loaded ONCE, not per document.

### Translate
3. Translate each field following priority hierarchy (glossary > prompts.json > style guide)
4. Title gender prefixes: Männer/Frauen for products, Herren/Damen for categories
5. Portable text: must match EN block structure exactly — same `_key`, same number of blocks, spans, marks
6. Overwrite — always overwrite existing translations (no skip)

### Batch Patch (single API call)
7. Build mutations array — one patch per doc, each including:
   - All translated fields
   - `translationMeta` update:
     ```json
     "translationMeta": {
       "lastTranslatedAt": "<current ISO timestamp>",
       "targetLanguage": "de"
     }
     ```
8. One POST with all mutations

### After patch
9. Report completion summary (list of patched docs + field counts)
10. User reviews drafts
11. Publish on request — single batch publish via HTTP API mutate endpoint
