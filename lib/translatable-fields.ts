import type { DocType, LangCode } from './types';

export type FieldKind = 'string' | 'text' | 'portableText';

export interface TranslatableField {
  path: string;
  kind: FieldKind;
  group: string;
}

export interface NestedArraySubField {
  path: string;
  kind: FieldKind;
}

export interface NestedArrayGroup {
  path: string;
  groupLabel: string;
  // i18n field path within each item to use as the row label (e.g. 'title.en').
  // If omitted, the mapper falls back to the item's `_type`, then `_key`.
  itemLabelPath?: string;
  subFields: NestedArraySubField[];
}

// Array where each item IS the i18n object directly (e.g. pnsCollection.tags[]).
// One Block with one row per array item — opposite shape to NestedArrayGroup.
export interface I18nArrayField {
  path: string;
  groupLabel: string;
  kind: FieldKind;
}

// Polymorphic array (e.g. frontPage.blocks[]) where each item's translatable
// shape depends on its `_type`. Only block types listed here surface in the viewer;
// items with other `_type`s are silently skipped.
export interface PolymorphicBlockTypeConfig {
  label: string;
  fields?: TranslatableField[];
  nestedArrays?: NestedArrayGroup[];
  i18nArrays?: I18nArrayField[];
}

export interface PolymorphicArrayField {
  path: string;
  blockTypes: Record<string, PolymorphicBlockTypeConfig>;
}

export interface SanityTypeConfig {
  uiType: DocType;
  fields: TranslatableField[];
  nestedArrays?: NestedArrayGroup[];
  i18nArrays?: I18nArrayField[];
  polymorphicArrays?: PolymorphicArrayField[];
  // Field used as the human-readable doc title (defaults to 'title'). Hero docs,
  // for example, have no `title` — use `headerText` instead.
  titleField?: string;
  // Filter expression appended to the list-query WHERE clause. Use a function
  // when the value depends on the current time (e.g. "created this year").
  filter: string | (() => string);
}

export const LANG_CODES: LangCode[] = ['en', 'de', 'fr', 'it'];

const startOfCurrentYearISO = (): string =>
  `${new Date().getUTCFullYear()}-01-01T00:00:00Z`;

export const SANITY_TYPES: Record<string, SanityTypeConfig> = {
  product: {
    uiType: 'product',
    fields: [
      { path: 'title', kind: 'string', group: 'Core' },
      { path: 'color', kind: 'string', group: 'Core' },
      { path: 'details', kind: 'text', group: 'Content' },
      { path: 'description', kind: 'portableText', group: 'Content' },
      { path: 'modelInfo.text', kind: 'string', group: 'Model Info' },
      { path: 'modelInfo.womenText', kind: 'string', group: 'Model Info' },
    ],
    filter: 'publishingSettings.public == true && store.status == "active" && store.isDeleted != true',
  },
  uberProduct: {
    uiType: 'uberProduct',
    fields: [
      { path: 'title', kind: 'string', group: 'Core' },
      { path: 'details', kind: 'text', group: 'Content' },
      { path: 'description', kind: 'portableText', group: 'Content' },
      { path: 'sharedProductIntendedUse', kind: 'string', group: 'Intended Use' },
      { path: 'modelInfo.text', kind: 'string', group: 'Model Info' },
      { path: 'modelInfo.womenText', kind: 'string', group: 'Model Info' },
      { path: 'testimonials.name', kind: 'string', group: 'Testimonials' },
      { path: 'testimonials.role', kind: 'string', group: 'Testimonials' },
      { path: 'testimonials.quote', kind: 'text', group: 'Testimonials' },
    ],
    nestedArrays: [
      {
        path: 'specifications',
        groupLabel: 'Specifications',
        subFields: [{ path: 'description', kind: 'text' }],
      },
    ],
    filter:
      'count(*[_id in ^.products[]._ref && publishingSettings.public == true && store.status == "active" && store.isDeleted != true]) > 0',
  },
  'feature.product': {
    uiType: 'feature',
    fields: [
      { path: 'title', kind: 'string', group: 'Content' },
      { path: 'text', kind: 'text', group: 'Content' },
    ],
    filter: '',
  },
  pnsCategory: {
    uiType: 'category',
    fields: [
      { path: 'title', kind: 'string', group: 'Core' },
      { path: 'description', kind: 'portableText', group: 'Content' },
    ],
    filter: '',
  },
  pnsCollection: {
    uiType: 'collection',
    fields: [
      { path: 'title', kind: 'string', group: 'Core' },
      { path: 'descriptionMens', kind: 'portableText', group: 'Description (Mens)' },
      { path: 'descriptionWomens', kind: 'portableText', group: 'Description (Womens)' },
      { path: 'descriptionUnisex', kind: 'portableText', group: 'Description (Unisex)' },
      { path: 'galleryMensSeasonal.title', kind: 'string', group: 'Gallery (Mens)' },
      { path: 'galleryWomensSeasonal.title', kind: 'string', group: 'Gallery (Womens)' },
      { path: 'galleryUnisexSeasonal.title', kind: 'string', group: 'Gallery (Unisex)' },
    ],
    nestedArrays: [
      {
        path: 'collectionFeaturesMens.features',
        groupLabel: 'Features (Mens)',
        itemLabelPath: 'title',
        subFields: [
          { path: 'title', kind: 'string' },
          { path: 'text', kind: 'text' },
        ],
      },
      {
        path: 'collectionFeaturesWomens.features',
        groupLabel: 'Features (Womens)',
        itemLabelPath: 'title',
        subFields: [
          { path: 'title', kind: 'string' },
          { path: 'text', kind: 'text' },
        ],
      },
      {
        path: 'collectionFeaturesUnisex.features',
        groupLabel: 'Features (Unisex)',
        itemLabelPath: 'title',
        subFields: [
          { path: 'title', kind: 'string' },
          { path: 'text', kind: 'text' },
        ],
      },
    ],
    i18nArrays: [
      { path: 'tags', groupLabel: 'Tags', kind: 'string' },
    ],
    filter: '',
  },
  hero: {
    uiType: 'hero',
    fields: [
      { path: 'label', kind: 'string', group: 'Core' },
      { path: 'headerText', kind: 'string', group: 'Core' },
      { path: 'byline', kind: 'text', group: 'Content' },
    ],
    nestedArrays: [
      {
        path: 'ctaButtons',
        groupLabel: 'CTA Buttons',
        itemLabelPath: 'btnText',
        subFields: [{ path: 'btnText', kind: 'string' }],
      },
    ],
    titleField: 'headerText',
    filter: () => `_createdAt >= "${startOfCurrentYearISO()}"`,
  },
  frontPage: {
    uiType: 'frontpage',
    fields: [{ path: 'title', kind: 'string', group: 'Core' }],
    polymorphicArrays: [
      {
        path: 'blocks',
        blockTypes: {
          shopEntrance: {
            label: 'Shop Entrance',
            fields: [
              { path: 'categoriesLabel', kind: 'string', group: 'Labels' },
              { path: 'collectionsLabel', kind: 'string', group: 'Labels' },
            ],
            nestedArrays: [
              {
                path: 'categories',
                groupLabel: 'Categories',
                itemLabelPath: 'name',
                subFields: [{ path: 'name', kind: 'string' }],
              },
            ],
          },
          newsletterBlock: {
            label: 'Newsletter',
            fields: [
              { path: 'title', kind: 'string', group: 'Newsletter' },
              { path: 'content', kind: 'string', group: 'Newsletter' },
              { path: 'buttonText', kind: 'string', group: 'Newsletter' },
              { path: 'activeCampaign.formTitle', kind: 'string', group: 'Newsletter' },
            ],
            nestedArrays: [
              {
                path: 'newsTickers',
                groupLabel: 'News Tickers',
                itemLabelPath: 'text',
                subFields: [{ path: 'text', kind: 'string' }],
              },
            ],
          },
        },
      },
    ],
    filter: '',
  },
};

export const aliasFor = (path: string, lang: string): string =>
  `${path.replace(/->/g, '_').replace(/\./g, '_')}_${lang}`;

// List endpoint: only needs counts for portable text — keeps payload small across many docs.
export const buildListProjection = (fields: TranslatableField[]): string => {
  const lines: string[] = ['_id', '_updatedAt'];
  for (const f of fields) {
    for (const lang of LANG_CODES) {
      const alias = aliasFor(f.path, lang);
      const src = `${f.path}.${lang}`;
      lines.push(f.kind === 'portableText' ? `"${alias}": count(${src})` : `"${alias}": ${src}`);
    }
  }
  return `{ ${lines.join(', ')} }`;
};

// Build a `{ ... }` projection body for items inside a (nested) translatable group.
// Used both for top-level docs and for items inside polymorphic blocks.
const buildItemLines = (
  fields: TranslatableField[] | undefined,
  nestedArrays: NestedArrayGroup[] | undefined,
  i18nArrays: I18nArrayField[] | undefined
): string[] => {
  const lines: string[] = [];
  for (const f of fields ?? []) {
    for (const lang of LANG_CODES) {
      lines.push(`"${aliasFor(f.path, lang)}": ${f.path}.${lang}`);
    }
  }
  for (const group of nestedArrays ?? []) {
    const sub: string[] = ['_key', '_type'];
    for (const s of group.subFields) {
      for (const lang of LANG_CODES) {
        sub.push(`"${aliasFor(s.path, lang)}": ${s.path}.${lang}`);
      }
    }
    lines.push(`"${group.path}": ${group.path}[]{ ${sub.join(', ')} }`);
  }
  for (const arr of i18nArrays ?? []) {
    const sub: string[] = ['_key'];
    for (const lang of LANG_CODES) sub.push(`"value_${lang}": ${lang}`);
    lines.push(`"${arr.path}": ${arr.path}[]{ ${sub.join(', ')} }`);
  }
  return lines;
};

// Detail endpoint: project raw values including the portable-text block arrays so the mapper can flatten them.
export const buildDetailProjection = (
  fields: TranslatableField[],
  nestedArrays: NestedArrayGroup[] = [],
  i18nArrays: I18nArrayField[] = [],
  polymorphicArrays: PolymorphicArrayField[] = []
): string => {
  const lines = ['_id', '_type', '_updatedAt', ...buildItemLines(fields, nestedArrays, i18nArrays)];
  for (const poly of polymorphicArrays) {
    // Project blocks with `_key`, `_type`, and the union of every type-specific
    // translatable field/array. GROQ returns null for paths that don't apply to a
    // given block, so it's safe to project all paths uniformly.
    const itemLines: string[] = ['_key', '_type'];
    for (const cfg of Object.values(poly.blockTypes)) {
      itemLines.push(...buildItemLines(cfg.fields, cfg.nestedArrays, cfg.i18nArrays));
    }
    lines.push(`"${poly.path}": ${poly.path}[]{ ${itemLines.join(', ')} }`);
  }
  return `{ ${lines.join(', ')} }`;
};
