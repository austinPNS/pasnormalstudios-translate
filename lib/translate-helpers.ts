import {
  SANITY_TYPES,
  aliasFor,
  type SanityTypeConfig,
} from './translatable-fields';
import type { TranslationItem } from './translator';

export const TARGETS = ['de', 'fr', 'it'] as const;
export type Target = (typeof TARGETS)[number];
export const isTarget = (v: unknown): v is Target =>
  typeof v === 'string' && (TARGETS as readonly string[]).includes(v);

// Items v1 supports: flat string/text fields (incl. portableText, reassembled
// span-by-span per feedback rule #2), nested-array string/text subfields,
// i18nArrays. Still skipped: polymorphic arrays (frontPage).
const COLLECTABLE = new Set(['string', 'text']);

export interface CollectedItem extends TranslationItem {
  // Sanity patch path (e.g. "title", "specifications[_key==\"abc\"].description")
  patchPath: string;
}

export interface PortableTextSpan {
  _type?: string;
  _key?: string;
  text?: unknown;
  marks?: unknown;
  [k: string]: unknown;
}

export interface PortableTextBlock {
  _type?: string;
  _key?: string;
  children?: unknown;
  [k: string]: unknown;
}

export interface PortableTextField {
  fieldPath: string;
  enBlocks: PortableTextBlock[];
}

const isMissing = (target: unknown): boolean =>
  target === null || target === undefined || (typeof target === 'string' && target.trim() === '');

const isPresent = (en: unknown): en is string =>
  typeof en === 'string' && en.trim().length > 0;

const isPortableTextMissing = (target: unknown): boolean =>
  !Array.isArray(target) || target.length === 0;

const isPortableTextPresent = (en: unknown): en is PortableTextBlock[] =>
  Array.isArray(en) && en.length > 0;

const ptItemKey = (fieldPath: string, blockKey: string, spanKey: string): string =>
  `${fieldPath}[${blockKey}].children[${spanKey}]`;

export const getConfig = (sanityType: string): SanityTypeConfig => {
  const cfg = SANITY_TYPES[sanityType];
  if (!cfg) throw new Error(`Unsupported _type: ${sanityType}`);
  return cfg;
};

// Walk a projected row and produce the list of translation items + the raw
// portable-text fields that need reassembly after translation.
export const collectItems = (
  row: Record<string, unknown>,
  config: SanityTypeConfig,
  target: Target
): { items: CollectedItem[]; portableTextFields: PortableTextField[] } => {
  const items: CollectedItem[] = [];
  const portableTextFields: PortableTextField[] = [];

  for (const f of config.fields) {
    if (f.kind === 'portableText') {
      const en = row[aliasFor(f.path, 'en')];
      const tg = row[aliasFor(f.path, target)];
      if (!isPortableTextPresent(en) || !isPortableTextMissing(tg)) continue;
      portableTextFields.push({ fieldPath: f.path, enBlocks: en });
      for (const block of en) {
        if (!block || typeof block !== 'object') continue;
        const b = block as PortableTextBlock;
        if (b._type !== 'block' || typeof b._key !== 'string') continue;
        if (!Array.isArray(b.children)) continue;
        for (const span of b.children) {
          if (!span || typeof span !== 'object') continue;
          const s = span as PortableTextSpan;
          if (s._type !== 'span' || typeof s._key !== 'string') continue;
          if (typeof s.text !== 'string' || s.text.length === 0) continue;
          items.push({
            key: ptItemKey(f.path, b._key, s._key),
            kind: 'text',
            source: s.text,
            patchPath: f.path,
          });
        }
      }
      continue;
    }
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
          items.push({
            key: `${group.path}[${key}].${sub.path}`,
            kind: sub.kind as 'string' | 'text',
            source: en,
            patchPath: `${group.path}[_key=="${key}"].${sub.path}`,
          });
        }
      }
    }
  }

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

  return { items, portableTextFields };
};

// Rebuild a portable text block array, replacing each span's `text` with its
// translation (looked up by ptItemKey). Spans missing a translation keep their
// EN text — caller surfaces them via missingKeys.
export const rebuildPortableText = (
  pt: PortableTextField,
  translations: Record<string, string>,
  missingKeys: string[]
): unknown[] => {
  return pt.enBlocks.map((block) => {
    if (!block || typeof block !== 'object') return block;
    if (block._type !== 'block' || typeof block._key !== 'string') return block;
    if (!Array.isArray(block.children)) return block;
    const newChildren = block.children.map((span) => {
      if (!span || typeof span !== 'object') return span;
      const s = span as PortableTextSpan;
      if (s._type !== 'span' || typeof s._key !== 'string') return span;
      if (typeof s.text !== 'string' || s.text.length === 0) return span;
      const key = ptItemKey(pt.fieldPath, block._key as string, s._key);
      const translated = translations[key];
      if (typeof translated !== 'string') {
        missingKeys.push(key);
        return span;
      }
      return { ...s, text: translated };
    });
    return { ...block, children: newChildren };
  });
};

const isI18nArrayItemPath = (path: string): boolean => /\[_key==".+"\]$/.test(path);

// Combine collected items + translator output into a Sanity-ready set object.
// Portable-text items are reassembled into a single field-level set value;
// flat/nested/i18n items are set per-path.
export const buildPatchSets = (
  items: CollectedItem[],
  portableTextFields: PortableTextField[],
  translations: Record<string, string>,
  target: Target
): { sets: Record<string, unknown>; missingFromResponse: string[] } => {
  const sets: Record<string, unknown> = {};
  const missingFromResponse: string[] = [];

  const portableTextItemKeys = new Set<string>();
  for (const pt of portableTextFields) {
    for (const item of items) {
      if (item.patchPath === pt.fieldPath) portableTextItemKeys.add(item.key);
    }
  }

  for (const item of items) {
    if (portableTextItemKeys.has(item.key)) continue;
    const value = translations[item.key];
    if (typeof value !== 'string') {
      missingFromResponse.push(item.key);
      continue;
    }
    const path = isI18nArrayItemPath(item.patchPath)
      ? `${item.patchPath}.${target}`
      : `${item.patchPath}.${target}`;
    sets[path] = value;
  }

  for (const pt of portableTextFields) {
    const blocks = rebuildPortableText(pt, translations, missingFromResponse);
    sets[`${pt.fieldPath}.${target}`] = blocks;
  }

  return { sets, missingFromResponse };
};
