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
  try {
    // Resolve _type first — draft-aware lookup (drafts.{id} wins in previewDrafts).
    const meta = await sanityQuery<{ _id: string; _type: string } | null>(
      `*[_id == $id || _id == "drafts." + $id][0]{ _id, _type }`,
      { id }
    );
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
      `*[_id == $id || _id == "drafts." + $id][0] ${projection}`,
      { id }
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
