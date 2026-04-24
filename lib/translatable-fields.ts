import type { DocType, LangCode } from './types';

export type FieldKind = 'string' | 'text' | 'portableText';

export interface TranslatableField {
  path: string;
  kind: FieldKind;
  group: string;
}

export interface SanityTypeConfig {
  uiType: DocType;
  fields: TranslatableField[];
  filter: string;
}

export const LANG_CODES: LangCode[] = ['en', 'de', 'fr', 'it'];

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
      { path: 'seo.title', kind: 'string', group: 'SEO' },
      { path: 'seo.description', kind: 'text', group: 'SEO' },
    ],
    filter: 'publishingSettings.public == true && store.status == "active" && store.isDeleted != true',
  },
  uberProduct: {
    uiType: 'uberProduct',
    fields: [
      { path: 'title', kind: 'string', group: 'Core' },
      { path: 'details', kind: 'text', group: 'Content' },
      { path: 'description', kind: 'portableText', group: 'Content' },
      { path: 'sharedProductIntendedUse->title', kind: 'string', group: 'Intended Use' },
      { path: 'sharedProductIntendedUse->description', kind: 'portableText', group: 'Intended Use' },
      { path: 'modelInfo.text', kind: 'string', group: 'Model Info' },
      { path: 'modelInfo.womenText', kind: 'string', group: 'Model Info' },
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
      { path: 'featuredTag', kind: 'string', group: 'Core' },
      { path: 'seo.title', kind: 'string', group: 'SEO' },
      { path: 'seo.description', kind: 'text', group: 'SEO' },
    ],
    filter: '',
  },
  frontPage: {
    uiType: 'frontpage',
    fields: [],
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

// Detail endpoint: project raw values including the portable-text block arrays so the mapper can flatten them.
export const buildDetailProjection = (fields: TranslatableField[]): string => {
  const lines: string[] = ['_id', '_type', '_updatedAt'];
  for (const f of fields) {
    for (const lang of LANG_CODES) {
      const alias = aliasFor(f.path, lang);
      const src = `${f.path}.${lang}`;
      lines.push(`"${alias}": ${src}`);
    }
  }
  return `{ ${lines.join(', ')} }`;
};
