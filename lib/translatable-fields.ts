import type { DocType } from './types';

export type FieldKind = 'string' | 'text' | 'portableText';

export interface TranslatableField {
  path: string;
  kind: FieldKind;
}

export interface SanityTypeConfig {
  uiType: DocType;
  fields: TranslatableField[];
  filter: string;
}

export const SANITY_TYPES: Record<string, SanityTypeConfig> = {
  product: {
    uiType: 'product',
    fields: [
      { path: 'title', kind: 'string' },
      { path: 'color', kind: 'string' },
      { path: 'details', kind: 'text' },
      { path: 'seo.title', kind: 'string' },
      { path: 'seo.description', kind: 'text' },
      { path: 'modelInfo.text', kind: 'string' },
      { path: 'modelInfo.womenText', kind: 'string' },
      { path: 'description', kind: 'portableText' },
    ],
    filter: 'publishingSettings.public == true && store.status == "active" && store.isDeleted != true',
  },
  uberProduct: {
    uiType: 'uberProduct',
    fields: [
      { path: 'title', kind: 'string' },
      { path: 'details', kind: 'text' },
      { path: 'modelInfo.text', kind: 'string' },
      { path: 'modelInfo.womenText', kind: 'string' },
      { path: 'description', kind: 'portableText' },
    ],
    filter:
      'count(*[_id in ^.products[]._ref && publishingSettings.public == true && store.status == "active" && store.isDeleted != true]) > 0',
  },
  'feature.product': {
    uiType: 'feature',
    fields: [
      { path: 'title', kind: 'string' },
      { path: 'text', kind: 'text' },
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
  `${path.replace(/\./g, '_')}_${lang}`;
