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
  buildPatchSets,
  collectItems,
  getConfig,
  isTarget,
  type Target,
} from '@/lib/translate-helpers';
import type { LangCode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  let body: { docId?: unknown; target?: unknown; retranslate?: unknown };
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
  const retranslate = body.retranslate === true;

  // Accept either bare or drafts-prefixed id from the client.
  const baseId = docId.startsWith('drafts.') ? docId.slice('drafts.'.length) : docId;

  try {
    // 1. Resolve _id (draft-aware) + _type. Fetch both rows and prefer the draft.
    const candidates = await sanityQuery<Array<{ _id: string; _type: string }>>(
      `*[_id in [$id, "drafts." + $id]]{ _id, _type }`,
      { id: baseId },
      { perspective: 'raw' }
    );
    const meta =
      candidates.find((c) => c._id.startsWith('drafts.')) ?? candidates[0] ?? null;
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
      { id: meta._id },
      { perspective: 'raw' }
    );
    if (!row) return NextResponse.json({ error: 'Projection returned null' }, { status: 500 });

    // 3. Collect items missing the target translation
    const { items, portableTextFields } = collectItems(row, config, target, retranslate);
    if (items.length === 0) {
      return NextResponse.json({ translated: 0, message: 'Nothing to translate.' });
    }

    // 4. Translate
    const result = await translate(
      items.map(({ key, kind, source }) => ({ key, kind, source })),
      target as Exclude<LangCode, 'en'>
    );

    // 5. Build patch sets (portable text reassembled per feedback rule #2)
    const { sets, missingFromResponse } = buildPatchSets(
      items,
      portableTextFields,
      result.translations,
      target
    );

    if (Object.keys(sets).length === 0) {
      return NextResponse.json(
        { error: 'Translator returned no usable translations', missingFromResponse },
        { status: 502 }
      );
    }

    // translationMeta — used by stale detection (lastTranslatedAt < _updatedAt → stale)
    // and to track which language was most recently translated.
    sets['translationMeta.lastTranslatedAt'] = new Date().toISOString();
    sets['translationMeta.targetLanguage'] = target;

    const mutations: SanityMutation[] = [{ patch: { id: meta._id, set: sets } }];
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
