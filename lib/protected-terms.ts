import protectedJson from '@/data/protected-terms.json';
import type { GlossaryRow } from './types';

export type ProtectedCategory = 'Collection' | 'Phrase' | 'Color' | 'Product';

export interface ProtectedTerms {
  collectionNames: string[];
  wordsAndPhrases: string[];
  colors: string[];
  productNames: string[];
}

export const PROTECTED_TERMS: ProtectedTerms = protectedJson;

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

export const PROTECTED_COLLECTIONS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.collectionNames,
  'Collection',
  'Collection / brand name — never translate'
);

export const PROTECTED_PHRASES: GlossaryRow[] = toRows(
  PROTECTED_TERMS.wordsAndPhrases,
  'Phrase',
  'Campaign or category phrase — never translate'
);

export const PROTECTED_COLORS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.colors,
  'Color',
  'Colorway name — never translate'
);

export const PROTECTED_PRODUCTS: GlossaryRow[] = toRows(
  PROTECTED_TERMS.productNames,
  'Product',
  'Product name — never translate'
);

export const PROTECTED_GLOSSARY: GlossaryRow[] = [
  ...PROTECTED_COLLECTIONS,
  ...PROTECTED_PHRASES,
  ...PROTECTED_COLORS,
  ...PROTECTED_PRODUCTS,
];
