import { NextResponse } from 'next/server';
import { sanityQuery, SanityConfigError, SanityQueryError } from '@/lib/sanity';
import { SANITY_TYPES, buildDetailProjection } from '@/lib/translatable-fields';
import { mapToSampleDoc } from '@/lib/document-mapper';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  // Accept either bare ("abc-123") or drafts-prefixed ("drafts.abc-123") ids.
  const baseId = id.startsWith('drafts.') ? id.slice('drafts.'.length) : id;
  try {
    // Fetch both versions and prefer the draft. Lexical ordering doesn't help here —
    // "drafts.<id>" sorts before "<id>" only when the base id's first char is > 'd'.
    const candidates = await sanityQuery<Array<{ _id: string; _type: string }>>(
      `*[_id in [$id, "drafts." + $id]]{ _id, _type }`,
      { id: baseId },
      { perspective: 'raw' }
    );
    const meta =
      candidates.find((c) => c._id.startsWith('drafts.')) ?? candidates[0] ?? null;
    if (!meta) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const config = SANITY_TYPES[meta._type];
    if (!config) {
      return NextResponse.json(
        { error: `Unsupported _type: ${meta._type}` },
        { status: 400 }
      );
    }

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
    if (!row) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = mapToSampleDoc(meta._type, row);
    return NextResponse.json({ doc });
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
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
