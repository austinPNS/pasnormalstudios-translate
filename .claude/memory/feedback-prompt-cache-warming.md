---
name: Prompt cache warming for bulk translation
description: When firing many Claude calls that share a system prompt, run the first call alone before kicking off the rest in parallel — concurrent first-fires all miss the prompt cache.
type: feedback
---

When fanning out many Claude API calls that share an identical (cache-eligible) system prompt, do **not** launch them all concurrently. Run the first call alone, wait for it to complete, then run the remaining calls in parallel.

**Why:** Anthropic's prompt cache is "first writer wins". If N concurrent requests all hit the API before any cache write completes, they each independently write the cache and pay the full cache-write cost (~25% premium over normal input tokens × the prompt size). The user observed this on a 3-doc bulk run: `cacheReadTokens=0`, `cacheCreationTokens=32112` (~10.7k tokens written 3×). With cache warming the first call writes once, the rest read at ~1.5/M tokens.

**How to apply:**
- Group pending calls by *cache key* (the cache key is the cache-controlled prefix — for our translator that's the target language, since each target has its own system prompt).
- Within each group: `await processOne(group[0])` first, then `mapWithConcurrency(group.slice(1), N, processOne)`.
- Across groups (different cache keys): parallel is fine — they don't share cache.
- Costs ~1 doc of latency upfront in exchange for ~10× cheaper subsequent calls.

Lives in [app/api/bulk-translate/route.ts](app/api/bulk-translate/route.ts) as the `byTarget` grouping + head-then-rest pattern.
