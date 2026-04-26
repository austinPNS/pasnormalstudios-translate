import { NextResponse } from 'next/server';
import {
  sanityQuery,
  sanityMutate,
  SanityConfigError,
  SanityQueryError,
  type SanityMutation,
} from '@/lib/sanity';
import {
  SANITY_TYPES,
  aliasFor,
  buildDetailProjection,
} from '@/lib/translatable-fields';
import { translate, TranslatorError, type TranslationItem } from '@/lib/translator';
import type { LangCode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const TARGETS = ['de', 'fr', 'it'] as const;
type Target = (typeof TARGETS)[number];
const isTarget = (v: unknown): v is Target =>
  typeof v === 'string' && (TARGETS as readonly string[]).includes(v);

// Items v1 supports: flat string/text fields, nested-array string/text subfields,
// i18nArrays. Skipped for now: portable text (block-structure preservation per
// feedback rule #2), polymorphic arrays (frontPage).
const COLLECTABLE = new Set(['string', 'text']);

interface CollectedItem extends TranslationItem {
  // Sanity patch path (e.g. "title", "specifications[_key==\"abc\"].description")
  patchPath: string;
}

const isMissing = (target: unknown): boolean =>
  target === null || target === undefined || (typeof target === 'string' && target.trim() === '');

const isPresent = (en: unknown): en is string =>
  typeof en === 'string' && en.trim().length > 0;

const collectItems = (
  row: Record<string, unknown>,
  config: ReturnType<typeof getConfig>,
  target: Target
): CollectedItem[] => {
  const items: CollectedItem[] = [];

  // Flat fields
  for (const f of config.fields) {
    if (!COLLECTABLE.has(f.kind)) continue;
    const en = row[aliasFor(f.path, 'en')];
    const tg = row[aliasFor(f.path, target)];
    if (isPresent(en) && isMissing(tg)) {
      items.push({
        key: f.path,
        kind: f.kind as 'string' | 'text',
        source: en,
        patchPath: f.path,
      });
    }
  }

  // Nested arrays
  for (const group of config.nestedArrays ?? []) {
    const arr = row[group.path];
    if (!Array.isArray(arr)) continue;
    for (const entry of arr) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const key = typeof item._key === 'string' ? item._key : null;
      if (!key) continue;
      for (const sub of group.subFields) {
        if (!COLLECTABLE.has(sub.kind)) continue;
        const en = item[aliasFor(sub.path, 'en')];
        const tg = item[aliasFor(sub.path, target)];
        if (isPresent(en) && isMissing(tg)) {
          const itemKey = `${group.path}[${key}].${sub.path}`;
          items.push({
            key: itemKey,
            kind: sub.kind as 'string' | 'text',
            source: en,
            patchPath: `${group.path}[_key=="${key}"].${sub.path}`,
          });
        }
      }
    }
  }

  // i18n arrays (item itself is the i18n object)
  for (const arr of config.i18nArrays ?? []) {
    if (!COLLECTABLE.has(arr.kind)) continue;
    const list = row[arr.path];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const key = typeof item._key === 'string' ? item._key : null;
      if (!key) continue;
      const en = item['value_en'];
      const tg = item[`value_${target}`];
      if (isPresent(en) && isMissing(tg)) {
        items.push({
          key: `${arr.path}[${key}]`,
          kind: arr.kind as 'string' | 'text',
          source: en,
          patchPath: `${arr.path}[_key=="${key}"]`,
        });
      }
    }
  }

  return items;
};

const getConfig = (sanityType: string) => {
  const cfg = SANITY_TYPES[sanityType];
  if (!cfg) throw new Error(`Unsupported _type: ${sanityType}`);
  return cfg;
};

// For "tags[_key==X]" the i18n value lives directly on the item — set lang key.
// For everything else, append .lang to the path.
const buildSetEntry = (item: CollectedItem, target: Target, value: string): [string, string] => {
  // i18nArray items: patchPath ends with the array selector and we set the lang key directly.
  // Detect by checking if the path is just "<array>[_key==...]" (no trailing dotted subfield).
  const isI18nArrayItem = /\[_key==".+"\]$/.test(item.patchPath);
  const path = isI18nArrayItem
    ? `${item.patchPath}.${target}`
    : `${item.patchPath}.${target}`;
  return [path, value];
};

export async function POST(req: Request) {
  let body: { docId?: unknown; target?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const docId = typeof body.docId === 'string' ? body.docId : null;
  if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });
  if (!isTarget(body.target)) {
    return NextResponse.json({ error: 'target must be de|fr|it' }, { status: 400 });
  }
  const target = body.target as Target;

  try {
    // 1. Resolve _id (draft-aware) + _type
    const meta = await sanityQuery<{ _id: string; _type: string } | null>(
      `*[_id == $id || _id == "drafts." + $id][0]{ _id, _type }`,
      { id: docId }
    );
    if (!meta) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    const config = getConfig(meta._type);

    // 2. Fetch translatable fields (EN + target) using existing projection helper
    const projection = buildDetailProjection(
      config.fields,
      config.nestedArrays,
      config.i18nArrays,
      config.polymorphicArrays
    );
    const row = await sanityQuery<Record<string, unknown> | null>(
      `*[_id == $id][0] ${projection}`,
      { id: meta._id }
    );
    if (!row) return NextResponse.json({ error: 'Projection returned null' }, { status: 500 });

    // 3. Collect items missing the target translation
    const items = collectItems(row, config, target as LangCode as Target);
    if (items.length === 0) {
      return NextResponse.json({ translated: 0, message: 'Nothing to translate.' });
    }

    // 4. Translate
    const result = await translate(
      items.map(({ key, kind, source }) => ({ key, kind, source })),
      target as Exclude<LangCode, 'en'>
    );

    // 5. Build a single patch with all sets
    const sets: Record<string, unknown> = {};
    const missingFromResponse: string[] = [];
    for (const item of items) {
      const value = result.translations[item.key];
      if (typeof value !== 'string') {
        missingFromResponse.push(item.key);
        continue;
      }
      const [path, val] = buildSetEntry(item, target, value);
      sets[path] = val;
    }

    if (Object.keys(sets).length === 0) {
      return NextResponse.json(
        { error: 'Translator returned no usable translations', missingFromResponse },
        { status: 502 }
      );
    }

    const mutations: SanityMutation[] = [
      { patch: { id: meta._id, set: sets } },
    ];
    await sanityMutate(mutations);

    return NextResponse.json({
      translated: Object.keys(sets).length,
      requested: items.length,
      missingFromResponse,
      patchedId: meta._id,
      usage: result.usage,
    });
  } catch (err) {
    if (err instanceof SanityConfigError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    if (err instanceof SanityQueryError) {
      return NextResponse.json(
        { error: err.message, status: err.status, body: err.body },
        { status: 502 }
      );
    }
    if (err instanceof TranslatorError) {
      return NextResponse.json({ error: `Translator: ${err.message}` }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
