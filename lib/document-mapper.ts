import type { Block, FieldItem, LangCode, SampleDoc } from './types';
import {
  LANG_CODES,
  SANITY_TYPES,
  aliasFor,
  type FieldKind,
  type TranslatableField,
} from './translatable-fields';

const flattenPortableText = (value: unknown): string | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const text = value
    .map((block) => {
      if (!block || typeof block !== 'object') return '';
      const b = block as { _type?: unknown; children?: unknown };
      if (b._type !== 'block') return '';
      const children = Array.isArray(b.children) ? b.children : [];
      return children
        .map((span) => {
          if (!span || typeof span !== 'object') return '';
          const s = span as { text?: unknown };
          return typeof s.text === 'string' ? s.text : '';
        })
        .join('');
    })
    .filter((line) => line.length > 0)
    .join('\n\n');
  return text.length > 0 ? text : null;
};

const projectValue = (raw: unknown, kind: FieldKind): string | null => {
  if (raw == null) return null;
  if (kind === 'portableText') return flattenPortableText(raw);
  if (typeof raw === 'string') return raw.length > 0 ? raw : null;
  return null;
};

export const mapToSampleDoc = (
  sanityType: string,
  row: Record<string, unknown>
): SampleDoc => {
  const config = SANITY_TYPES[sanityType];
  if (!config) throw new Error(`Unsupported _type: ${sanityType}`);

  // Group in insertion order so block sequence matches the config.
  const groups = new Map<string, TranslatableField[]>();
  for (const f of config.fields) {
    const list = groups.get(f.group) ?? [];
    list.push(f);
    groups.set(f.group, list);
  }

  const blocks: Block[] = [];
  for (const [label, fields] of groups) {
    const items: FieldItem[] = fields.map((f) => {
      const values = {} as Record<LangCode, string | null>;
      for (const lang of LANG_CODES) {
        values[lang] = projectValue(row[aliasFor(f.path, lang)], f.kind);
      }
      return {
        name: f.path,
        type: f.kind,
        en: values.en,
        de: values.de,
        fr: values.fr,
        it: values.it,
      };
    });
    blocks.push({ kind: 'fields', label, fields: items });
  }

  const id = typeof row._id === 'string' ? row._id : 'unknown';
  const enTitle = row[aliasFor('title', 'en')];
  const title = typeof enTitle === 'string' && enTitle.length > 0 ? enTitle : id;

  return {
    id,
    sanityType,
    title,
    type: config.uiType,
    blocks,
  };
};
