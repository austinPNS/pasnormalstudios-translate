import { NextResponse } from 'next/server';
import { readPrompts, writePrompts } from '@/lib/server-storage';
import type { PromptEntry, PromptsMap } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TARGETS = ['de', 'fr', 'it'] as const;

const isPromptEntry = (v: unknown): v is PromptEntry => {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return (
    Array.isArray(r.specialRules) &&
    r.specialRules.every((x) => typeof x === 'string')
  );
};

const isPromptsMap = (v: unknown): v is PromptsMap => {
  if (!v || typeof v !== 'object') return false;
  const r = v as Record<string, unknown>;
  return TARGETS.every((t) => r[t] === undefined || isPromptEntry(r[t]));
};

export async function GET() {
  const prompts = await readPrompts();
  return NextResponse.json(prompts);
}

export async function PUT(req: Request) {
  const body = (await req.json()) as unknown;
  if (!isPromptsMap(body)) {
    return NextResponse.json(
      { error: 'Invalid payload: expected PromptsMap' },
      { status: 400 }
    );
  }
  await writePrompts(body);
  return NextResponse.json({ ok: true });
}
