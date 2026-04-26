import { NextResponse } from 'next/server';
import { sanityQuery, SanityConfigError, SanityQueryError } from '@/lib/sanity';
import {
  LANG_CODES,
  SANITY_TYPES,
  aliasFor,
  buildListProjection,
  type SanityTypeConfig,
  type TranslatableField,
} from '@/lib/translatable-fields';
import { LANGS } from '@/lib/data';
import type { DocLangState, DocRecord, LangCode, Status } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const hasContent = (value: unknown, kind: TranslatableField['kind']): boolean => {
  if (kind === 'portableText') return typeof value === 'number' && value > 0;
  return typeof value === 'string' && value.trim().length > 0;
};

const computeLangState = (
  row: Record<string, unknown>,
  fields: TranslatableField[],
  lang: LangCode
): DocLangState => {
  let total = 0;
  let filled = 0;
  for (const f of fields) {
    const enValue = row[aliasFor(f.path, 'en')];
    if (!hasContent(enValue, f.kind)) continue;
    total++;
    const langValue = row[aliasFor(f.path, lang)];
    if (hasContent(langValue, f.kind)) filled++;
  }
  if (total === 0) return { status: 'none', pct: 0 };
  if (lang === 'en') return { status: 'approved', pct: 100 };
  const pct = Math.round((filled / total) * 100);
  let status: Status = 'none';
  if (filled === total) status = 'approved';
  else if (filled > 0) status = 'progress';
  return { status, pct };
};

const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const diff = Math.max(0, Date.now() - then);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'yesterday';
  if (d < 14) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 8) return `${w}w ago`;
  return iso.slice(0, 10);
};

const toDocRecord = (
  row: Record<string, unknown>,
  config: SanityTypeConfig
): DocRecord | null => {
  const id = typeof row._id === 'string' ? row._id : null;
  const updated = typeof row._updatedAt === 'string' ? row._updatedAt : '';
  if (!id) return null;

  // Types without top-level translatable fields (e.g. frontPage with nested blocks)
  // are surfaced as stubs — non-en shown as 'none' so they appear under the
  // "missing language" filter.
  if (config.fields.length === 0) {
    return {
      id,
      title: id,
      type: config.uiType,
      updated: formatRelative(updated),
      author: '—',
      langs: {
        en: { status: 'approved', pct: 100 },
        de: { status: 'none', pct: 0 },
        fr: { status: 'none', pct: 0 },
        it: { status: 'none', pct: 0 },
      },
    };
  }

  const titleAlias = aliasFor(config.titleField ?? 'title', 'en');
  const title =
    (typeof row[titleAlias] === 'string' && (row[titleAlias] as string)) || id;

  const langs = {} as Record<LangCode, DocLangState>;
  for (const lang of LANG_CODES) {
    langs[lang] = computeLangState(row, config.fields, lang);
  }

  if (langs.en.status === 'none') return null;

  return {
    id,
    title,
    type: config.uiType,
    updated: formatRelative(updated),
    author: '—',
    langs,
  };
};

const buildQuery = (sanityType: string, config: SanityTypeConfig): string => {
  const extra = typeof config.filter === 'function' ? config.filter() : config.filter;
  const filters = [
    `_type == "${sanityType}"`,
    '!(_id in path("drafts.**"))',
    extra,
  ].filter((s) => s.length > 0);
  const projection = buildListProjection(config.fields);
  return `*[${filters.join(' && ')}] | order(_updatedAt desc) ${projection}`;
};

const fetchType = async (sanityType: string, config: SanityTypeConfig): Promise<DocRecord[]> => {
  const query = buildQuery(sanityType, config);
  const rows = await sanityQuery<Record<string, unknown>[]>(query);
  return rows
    .map((r) => toDocRecord(r, config))
    .filter((d): d is DocRecord => d !== null);
};

export async function GET() {
  try {
    const entries = Object.entries(SANITY_TYPES);
    const results = await Promise.all(entries.map(([t, cfg]) => fetchType(t, cfg)));
    const docs = results.flat();
    return NextResponse.json({ docs, langs: LANGS });
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
