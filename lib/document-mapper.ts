import type { Block, FieldItem, LangCode, SampleDoc } from './types';
import {
  LANG_CODES,
  SANITY_TYPES,
  aliasFor,
  type FieldKind,
  type I18nArrayField,
  type NestedArrayGroup,
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

const pushFlatFieldsBlocks = (
  blocks: Block[],
  fields: TranslatableField[] | undefined,
  source: Record<string, unknown>,
  labelPrefix?: string
) => {
  if (!fields?.length) return;
  const groups = new Map<string, TranslatableField[]>();
  for (const f of fields) {
    const list = groups.get(f.group) ?? [];
    list.push(f);
    groups.set(f.group, list);
  }
  for (const [groupLabel, groupFields] of groups) {
    const items: FieldItem[] = groupFields.map((f) => {
      const values = {} as Record<LangCode, string | null>;
      for (const lang of LANG_CODES) {
        values[lang] = projectValue(source[aliasFor(f.path, lang)], f.kind);
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
    blocks.push({
      kind: 'fields',
      label: labelPrefix ? `${labelPrefix} · ${groupLabel}` : groupLabel,
      fields: items,
    });
  }
};

const pushNestedArrayBlocks = (
  blocks: Block[],
  group: NestedArrayGroup,
  source: Record<string, unknown>,
  labelPrefix?: string
) => {
  const arr = source[group.path];
  if (!Array.isArray(arr)) return;
  arr.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const item = entry as Record<string, unknown>;
    const labelEn = group.itemLabelPath
      ? item[aliasFor(group.itemLabelPath, 'en')]
      : null;
    const itemLabel =
      (typeof labelEn === 'string' && labelEn.length > 0 && labelEn) ||
      (typeof item._type === 'string' && item._type.length > 0 && item._type) ||
      (typeof item._key === 'string' && `[${item._key}]`) ||
      `[${idx}]`;
    const items: FieldItem[] = group.subFields.map((sub) => {
      const values = {} as Record<LangCode, string | null>;
      for (const lang of LANG_CODES) {
        values[lang] = projectValue(item[aliasFor(sub.path, lang)], sub.kind);
      }
      return {
        name: sub.path,
        type: sub.kind,
        en: values.en,
        de: values.de,
        fr: values.fr,
        it: values.it,
      };
    });
    const base = `${group.groupLabel} · ${itemLabel}`;
    blocks.push({
      kind: 'fields',
      label: labelPrefix ? `${labelPrefix} · ${base}` : base,
      fields: items,
    });
  });
};

const pushI18nArrayBlock = (
  blocks: Block[],
  arr: I18nArrayField,
  source: Record<string, unknown>,
  labelPrefix?: string
) => {
  const list = source[arr.path];
  if (!Array.isArray(list) || list.length === 0) return;
  const items: FieldItem[] = [];
  list.forEach((entry, idx) => {
    if (!entry || typeof entry !== 'object') return;
    const item = entry as Record<string, unknown>;
    const values = {} as Record<LangCode, string | null>;
    for (const lang of LANG_CODES) {
      values[lang] = projectValue(item[`value_${lang}`], arr.kind);
    }
    const itemKey = (typeof item._key === 'string' && item._key) || `${idx}`;
    items.push({
      name: `${arr.path}[${itemKey}]`,
      type: arr.kind,
      en: values.en,
      de: values.de,
      fr: values.fr,
      it: values.it,
    });
  });
  if (items.length === 0) return;
  blocks.push({
    kind: 'fields',
    label: labelPrefix ? `${labelPrefix} · ${arr.groupLabel}` : arr.groupLabel,
    fields: items,
  });
};

export const mapToSampleDoc = (
  sanityType: string,
  row: Record<string, unknown>
): SampleDoc => {
  const config = SANITY_TYPES[sanityType];
  if (!config) throw new Error(`Unsupported _type: ${sanityType}`);

  const blocks: Block[] = [];
  pushFlatFieldsBlocks(blocks, config.fields, row);
  for (const group of config.nestedArrays ?? []) pushNestedArrayBlocks(blocks, group, row);
  for (const arr of config.i18nArrays ?? []) pushI18nArrayBlock(blocks, arr, row);

  for (const poly of config.polymorphicArrays ?? []) {
    const list = row[poly.path];
    if (!Array.isArray(list)) continue;

    // Pre-count items per known block type so we only suffix `#N` when there are
    // multiple instances of the same type.
    const typeTotal = new Map<string, number>();
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const t = (entry as Record<string, unknown>)._type;
      if (typeof t === 'string' && poly.blockTypes[t]) {
        typeTotal.set(t, (typeTotal.get(t) ?? 0) + 1);
      }
    }
    const typeIdx = new Map<string, number>();
    for (const entry of list) {
      if (!entry || typeof entry !== 'object') continue;
      const item = entry as Record<string, unknown>;
      const blockType = typeof item._type === 'string' ? item._type : null;
      if (!blockType) continue;
      const cfg = poly.blockTypes[blockType];
      if (!cfg) continue;
      const idx = (typeIdx.get(blockType) ?? 0) + 1;
      typeIdx.set(blockType, idx);
      const labelPrefix = (typeTotal.get(blockType) ?? 1) > 1 ? `${cfg.label} #${idx}` : cfg.label;
      pushFlatFieldsBlocks(blocks, cfg.fields, item, labelPrefix);
      for (const g of cfg.nestedArrays ?? []) pushNestedArrayBlocks(blocks, g, item, labelPrefix);
      for (const a of cfg.i18nArrays ?? []) pushI18nArrayBlock(blocks, a, item, labelPrefix);
    }
  }

  const id = typeof row._id === 'string' ? row._id : 'unknown';
  const enTitle = row[aliasFor(config.titleField ?? 'title', 'en')];
  const title = typeof enTitle === 'string' && enTitle.length > 0 ? enTitle : id;

  return {
    id,
    sanityType,
    title,
    type: config.uiType,
    blocks,
  };
};
