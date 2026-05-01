import protectedJson from '@/data/protected-terms.json';
import type { GlossaryRow } from './types';

export type ProtectedCategory =
  | 'Company'
  | 'Collection'
  | 'Phrase'
  | 'Color'
  | 'Product';

export interface ProtectedTerms {
  companyNames: string[];
  collectionNames: string[];
  wordsAndPhrases: string[];
  colors: string[];
  productNames: string[];
}

export const PROTECTED_TERMS: ProtectedTerms = protectedJson;

export const PROTECTED_CATEGORIES: ProtectedCategory[] = [
  'Company',
  'Collection',
  'Phrase',
  'Color',
  'Product',
];

// Maps the persisted JSON key ↔ the in-memory `scope` label used by GlossaryRow.
export const CATEGORY_TO_KEY: Record<ProtectedCategory, keyof ProtectedTerms> = {
  Company: 'companyNames',
  Collection: 'collectionNames',
  Phrase: 'wordsAndPhrases',
  Color: 'colors',
  Product: 'productNames',
};

export const KEY_TO_CATEGORY: Record<keyof ProtectedTerms, ProtectedCategory> = {
  companyNames: 'Company',
  collectionNames: 'Collection',
  wordsAndPhrases: 'Phrase',
  colors: 'Color',
  productNames: 'Product',
};

export const CATEGORY_NOTE: Record<ProtectedCategory, string> = {
  Company: 'Company name — never translate',
  Collection: 'Collection / brand name — never translate',
  Phrase: 'Campaign or category phrase — never translate',
  Color: 'Colorway name — never translate',
  Product: 'Product name — never translate',
};

const dedupe = (items: string[]): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const key = s.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
};

const toRows = (items: string[], scope: ProtectedCategory, notes?: string): GlossaryRow[] =>
  dedupe(items).map((s) => ({
    src: s,
    de: s,
    fr: s,
    it: s,
    kind: 'dnt',
    scope,
    notes,
  }));

export const PROTECTED_COMPANIES: GlossaryRow[] = toRows(
  PROTECTED_TERMS.companyNames,
  'Company',
  CATEGORY_NOTE.Company
);

export const PROTECTED_COLLECTIONS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.collectionNames,
  'Collection',
  CATEGORY_NOTE.Collection
);

export const PROTECTED_PHRASES: GlossaryRow[] = toRows(
  PROTECTED_TERMS.wordsAndPhrases,
  'Phrase',
  CATEGORY_NOTE.Phrase
);

export const PROTECTED_COLORS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.colors,
  'Color',
  CATEGORY_NOTE.Color
);

export const PROTECTED_PRODUCTS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.productNames,
  'Product',
  CATEGORY_NOTE.Product
);

export const PROTECTED_GLOSSARY: GlossaryRow[] = [
  ...PROTECTED_COMPANIES,
  ...PROTECTED_COLLECTIONS,
  ...PROTECTED_PHRASES,
  ...PROTECTED_COLORS,
  ...PROTECTED_PRODUCTS,
];

// Convert a flat GlossaryRow[] back into the categorized JSON shape that
// `data/protected-terms.json` expects on disk. Rows whose `scope` isn't a
// known category are dropped (the API validates against this).
export const groupRowsByCategory = (rows: GlossaryRow[]): ProtectedTerms => {
  const out: ProtectedTerms = {
    companyNames: [],
    collectionNames: [],
    wordsAndPhrases: [],
    colors: [],
    productNames: [],
  };
  const seen: Record<keyof ProtectedTerms, Set<string>> = {
    companyNames: new Set(),
    collectionNames: new Set(),
    wordsAndPhrases: new Set(),
    colors: new Set(),
    productNames: new Set(),
  };
  for (const row of rows) {
    const category = row.scope as ProtectedCategory;
    const key = CATEGORY_TO_KEY[category];
    if (!key) continue;
    const value = row.src.trim();
    if (!value) continue;
    const dedupeKey = value.toLowerCase();
    if (seen[key].has(dedupeKey)) continue;
    seen[key].add(dedupeKey);
    out[key].push(value);
  }
  return out;
};
