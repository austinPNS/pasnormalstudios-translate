import { NextResponse } from 'next/server';
import {
  sanityQuery,
  sanityMutate,
  SanityConfigError,
  SanityQueryError,
  type SanityMutation,
} from '@/lib/sanity';
import { buildDetailProjection } from '@/lib/translatable-fields';
import { translate, TranslatorError } from '@/lib/translator';
import {
  buildMutations,
  buildPatchSets,
  collectItems,
  getConfig,
  isTarget,
  type Target,
} from '@/lib/translate-helpers';
import type { LangCode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

interface DocResult {
  docId: string;        // resolved id (drafts.* if a draft exists)
  baseId: string;       // input id without drafts. prefix
  target: Target;
  status: 'translated' | 'nothing' | 'error';
  fieldsSet: number;
  itemsRequested: number;
  missingFromResponse: string[];
  error?: string;
}

interface BulkResponse {
  ok: boolean;
  results: DocResult[];
  totalFieldsSet: number;
  mutationsApplied: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

const stripDrafts = (id: string): string =>
  id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;

// Concurrency-limited mapper. Per-doc Claude calls share the same cached
// system prompt (target-scoped), so running a few in parallel keeps wall time
// reasonable without thrashing the API.
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

export async function POST(req: Request) {
  let body: { docIds?: unknown; targets?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawIds = Array.isArray(body.docIds) ? body.docIds : null;
  if (!rawIds || rawIds.length === 0) {
    return NextResponse.json({ error: 'docIds (non-empty array) required' }, { status: 400 });
  }
  const docIds: string[] = [];
  for (const v of rawIds) {
    if (typeof v !== 'string' || v.length === 0) {
      return NextResponse.json({ error: 'docIds must be non-empty strings' }, { status: 400 });
    }
    docIds.push(v);
  }

  const rawTargets = Array.isArray(body.targets) ? body.targets : null;
  if (!rawTargets || rawTargets.length === 0) {
    return NextResponse.json({ error: 'targets (non-empty array) required' }, { status: 400 });
  }
  const targets: Target[] = [];
  for (const v of rawTargets) {
    if (!isTarget(v)) {
      return NextResponse.json(
        { error: `Invalid target: ${String(v)}. Must be de|fr|it` },
        { status: 400 }
      );
    }
    if (!targets.includes(v)) targets.push(v);
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };
      const sendError = (status: number, message: string, extra?: Record<string, unknown>) => {
        send('error', { status, message, ...(extra ?? {}) });
        controller.close();
      };

      try {
        // 1. Resolve _id (draft-aware) + _type for every requested doc, in ONE query.
        const baseIds = Array.from(new Set(docIds.map(stripDrafts)));
        const draftIds = baseIds.map((id) => `drafts.${id}`);
        send('phase', { phase: 'resolve', message: 'Resolving documents…' });
        const candidates = await sanityQuery<Array<{ _id: string; _type: string }>>(
          `*[_id in $ids]{ _id, _type }`,
          { ids: [...baseIds, ...draftIds] },
          { perspective: 'raw' }
        );

        interface Resolved {
          baseId: string;
          _id: string;
          _type: string;
        }
        const resolvedByBase = new Map<string, Resolved>();
        const missingDocs: string[] = [];
        for (const baseId of baseIds) {
          const draft = candidates.find((c) => c._id === `drafts.${baseId}`);
          const published = candidates.find((c) => c._id === baseId);
          const pick = draft ?? published;
          if (!pick) {
            missingDocs.push(baseId);
            continue;
          }
          resolvedByBase.set(baseId, { baseId, _id: pick._id, _type: pick._type });
        }

        // 2. Group + 3. Fetch (one query per type)
        const byType = new Map<string, Resolved[]>();
        for (const r of resolvedByBase.values()) {
          const list = byType.get(r._type) ?? [];
          list.push(r);
          byType.set(r._type, list);
        }
        send('phase', {
          phase: 'fetch',
          message: `Fetching ${resolvedByBase.size} document${resolvedByBase.size === 1 ? '' : 's'} (${byType.size} type${byType.size === 1 ? '' : 's'})…`,
        });
        const rowsById = new Map<string, Record<string, unknown>>();
        for (const [type, group] of byType) {
          const config = getConfig(type);
          const projection = buildDetailProjection(
            config.fields,
            config.nestedArrays,
            config.i18nArrays,
            config.polymorphicArrays
          );
          const ids = group.map((g) => g._id);
          const rows = await sanityQuery<Array<Record<string, unknown>>>(
            `*[_id in $ids] ${projection}`,
            { ids },
            { perspective: 'raw' }
          );
          for (const row of rows) {
            const id = typeof row._id === 'string' ? row._id : null;
            if (id) rowsById.set(id, row);
          }
        }

        // 4. Pending list
        interface Pending {
          resolved: Resolved;
          target: Target;
          row: Record<string, unknown>;
        }
        const pending: Pending[] = [];
        const results: DocResult[] = [];
        for (const r of resolvedByBase.values()) {
          const row = rowsById.get(r._id);
          if (!row) {
            for (const target of targets) {
              results.push({
                docId: r._id,
                baseId: r.baseId,
                target,
                status: 'error',
                fieldsSet: 0,
                itemsRequested: 0,
                missingFromResponse: [],
                error: 'Projection returned no row',
              });
            }
            continue;
          }
          for (const target of targets) {
            pending.push({ resolved: r, target, row });
          }
        }
        for (const baseId of missingDocs) {
          for (const target of targets) {
            results.push({
              docId: baseId,
              baseId,
              target,
              status: 'error',
              fieldsSet: 0,
              itemsRequested: 0,
              missingFromResponse: [],
              error: 'Document not found',
            });
          }
        }

        const total = pending.length + results.length;
        send('start', {
          total,
          totalDocs: resolvedByBase.size + missingDocs.length,
          targets,
        });

        // Pre-emit progress for any docs we already errored on (missing / no row)
        let done = 0;
        for (const r of results) {
          done += 1;
          send('progress', { done, total, result: r });
        }

        // 5. Translate per (doc, target) with bounded concurrency. Emit progress
        // as each completes.
        const usage = {
          inputTokens: 0,
          outputTokens: 0,
          cacheReadTokens: 0,
          cacheCreationTokens: 0,
        };
        const mutations: SanityMutation[] = [];

        type Usage = BulkResponse['usage'];
        type PerPendingResult = {
          result: DocResult;
          mutations: SanityMutation[];
          usage: Usage | null;
        };

        const processOne = async (p: Pending): Promise<PerPendingResult> => {
          const config = getConfig(p.resolved._type);
          const { items, portableTextFields } = collectItems(p.row, config, p.target);
          if (items.length === 0) {
            return {
              result: {
                docId: p.resolved._id,
                baseId: p.resolved.baseId,
                target: p.target,
                status: 'nothing',
                fieldsSet: 0,
                itemsRequested: 0,
                missingFromResponse: [],
              },
              mutations: [],
              usage: null,
            };
          }
          try {
            const tr = await translate(
              items.map(({ key, kind, source }) => ({ key, kind, source })),
              p.target as Exclude<LangCode, 'en'>
            );
            const { sets, inserts, missingFromResponse } = buildPatchSets(
              items,
              portableTextFields,
              tr.translations,
              p.target
            );
            const callUsage: Usage = {
              inputTokens: tr.usage.inputTokens,
              outputTokens: tr.usage.outputTokens,
              cacheReadTokens: tr.usage.cacheReadTokens,
              cacheCreationTokens: tr.usage.cacheCreationTokens,
            };
            if (Object.keys(sets).length === 0 && inserts.length === 0) {
              return {
                result: {
                  docId: p.resolved._id,
                  baseId: p.resolved.baseId,
                  target: p.target,
                  status: 'error',
                  fieldsSet: 0,
                  itemsRequested: items.length,
                  missingFromResponse,
                  error: 'Translator returned no usable translations',
                },
                mutations: [],
                usage: callUsage,
              };
            }
            const fieldsWritten = Object.keys(sets).length + inserts.length;
            sets['translationMeta.lastTranslatedAt'] = new Date().toISOString();
            sets['translationMeta.targetLanguage'] = p.target;
            return {
              result: {
                docId: p.resolved._id,
                baseId: p.resolved.baseId,
                target: p.target,
                status: 'translated',
                fieldsSet: fieldsWritten,
                itemsRequested: items.length,
                missingFromResponse,
              },
              mutations: buildMutations(p.resolved._id, sets, inserts),
              usage: callUsage,
            };
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            return {
              result: {
                docId: p.resolved._id,
                baseId: p.resolved.baseId,
                target: p.target,
                status: 'error',
                fieldsSet: 0,
                itemsRequested: items.length,
                missingFromResponse: [],
                error: message,
              },
              mutations: [],
              usage: null,
            };
          }
        };

        // Group by target so we can warm the prompt cache once per target.
        // Anthropic's prompt cache is "first writer wins" — concurrent calls
        // all miss and each pays a full cache-write. Running the first call
        // for each target alone lets the rest hit the cache (~10x cheaper).
        const byTarget = new Map<Target, Pending[]>();
        for (const p of pending) {
          const list = byTarget.get(p.target) ?? [];
          list.push(p);
          byTarget.set(p.target, list);
        }

        const runItem = async (p: Pending): Promise<PerPendingResult> => {
          const pr = await processOne(p);
          done += 1;
          send('progress', { done, total, result: pr.result });
          return pr;
        };

        // Process each target group: first call alone (warms cache),
        // then the rest with concurrency. Across targets: parallel — each
        // target has its own cache key, so they don't conflict.
        const perTargetResults = await Promise.all(
          [...byTarget.entries()].map(async ([, group]) => {
            if (group.length === 0) return [] as PerPendingResult[];
            const head = await runItem(group[0]);
            const rest = await mapWithConcurrency<Pending, PerPendingResult>(
              group.slice(1),
              4,
              runItem
            );
            return [head, ...rest];
          })
        );
        const perResults: PerPendingResult[] = perTargetResults.flat();

        for (const pr of perResults) {
          results.push(pr.result);
          if (pr.mutations.length > 0) mutations.push(...pr.mutations);
          if (pr.usage) {
            usage.inputTokens += pr.usage.inputTokens;
            usage.outputTokens += pr.usage.outputTokens;
            usage.cacheReadTokens += pr.usage.cacheReadTokens;
            usage.cacheCreationTokens += pr.usage.cacheCreationTokens;
          }
        }

        // 6. Single Sanity mutate call.
        if (mutations.length > 0) {
          send('phase', {
            phase: 'mutate',
            message: `Applying ${mutations.length} patch${mutations.length === 1 ? '' : 'es'}…`,
          });
          await sanityMutate(mutations);
        }

        const totalFieldsSet = results.reduce((acc, r) => acc + r.fieldsSet, 0);
        const ok = results.every((r) => r.status !== 'error');

        const response: BulkResponse = {
          ok,
          results,
          totalFieldsSet,
          mutationsApplied: mutations.length,
          usage,
        };
        send('done', response);
        controller.close();
      } catch (err) {
        if (err instanceof SanityConfigError) {
          sendError(500, err.message);
          return;
        }
        if (err instanceof SanityQueryError) {
          sendError(502, err.message, { sanityStatus: err.status, body: err.body });
          return;
        }
        if (err instanceof TranslatorError) {
          sendError(502, `Translator: ${err.message}`);
          return;
        }
        const message = err instanceof Error ? err.message : 'Unknown error';
        sendError(500, message);
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      // Hint to disable proxy buffering (e.g. nginx) so events flush promptly.
      'X-Accel-Buffering': 'no',
    },
  });
}
