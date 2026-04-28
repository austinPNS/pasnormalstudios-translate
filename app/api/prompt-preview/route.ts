import { NextResponse } from 'next/server';
import { translate, TranslatorError } from '@/lib/translator';
import { isTarget } from '@/lib/translate-helpers';
import type { LangCode } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const PREVIEW_KEY = 'preview';

export async function POST(req: Request) {
  let body: { text?: unknown; target?: unknown; specialRules?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text : '';
  if (!text.trim()) {
    return NextResponse.json({ error: 'text required' }, { status: 400 });
  }
  if (!isTarget(body.target)) {
    return NextResponse.json({ error: 'target must be de|fr|it' }, { status: 400 });
  }
  if (
    !Array.isArray(body.specialRules) ||
    !body.specialRules.every((r): r is string => typeof r === 'string')
  ) {
    return NextResponse.json(
      { error: 'specialRules must be string[]' },
      { status: 400 }
    );
  }
  const target = body.target as Exclude<LangCode, 'en'>;
  const specialRules = body.specialRules;

  try {
    const result = await translate(
      [{ key: PREVIEW_KEY, kind: 'text', source: text }],
      target,
      { withNotes: true, specialRulesOverride: specialRules }
    );
    const translation = result.translations[PREVIEW_KEY];
    if (typeof translation !== 'string') {
      return NextResponse.json(
        { error: 'Translator returned no translation for preview' },
        { status: 502 }
      );
    }
    const notes = result.notes?.[PREVIEW_KEY] ?? [];
    return NextResponse.json({ translation, notes, usage: result.usage });
  } catch (err) {
    if (err instanceof TranslatorError) {
      return NextResponse.json({ error: `Translator: ${err.message}` }, { status: 502 });
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
