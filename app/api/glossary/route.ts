import { NextResponse } from 'next/server';
import { readGlossaryEntries, writeGlossaryEntries } from '@/lib/server-storage';
import type { GlossaryRow } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isGlossaryRow = (v: unknown): v is GlossaryRow => {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.src === 'string' &&
    typeof r.de === 'string' &&
    typeof r.fr === 'string' &&
    typeof r.it === 'string' &&
    (r.kind === 'dnt' || r.kind === 'brand') &&
    typeof r.scope === 'string'
  );
};

export async function GET() {
  const entries = await readGlossaryEntries();
  return NextResponse.json({ entries });
}

export async function PUT(req: Request) {
  const body = (await req.json()) as { entries?: unknown };
  if (!Array.isArray(body.entries) || !body.entries.every(isGlossaryRow)) {
    return NextResponse.json(
      { error: 'Invalid payload: entries must be GlossaryRow[]' },
      { status: 400 }
    );
  }
  await writeGlossaryEntries(body.entries);
  return NextResponse.json({ ok: true, count: body.entries.length });
}
