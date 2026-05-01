import { PROTECTED_GLOSSARY } from './protected-terms';
import type { GlossaryRow, Lang, PromptsMap } from './types';

export const LANGS: Lang[] = [
  { code: 'en', label: 'English', region: 'EN', source: true },
  { code: 'de', label: 'German', region: 'DE-DE' },
  { code: 'fr', label: 'French', region: 'FR-FR' },
  { code: 'it', label: 'Italian', region: 'IT-IT' },
];

// SSR fallback. Real content lives in data/prompts.json and is fetched on mount.
export const PROMPTS: PromptsMap = {
  general: { specialRules: [] },
  de: { specialRules: [] },
  fr: { specialRules: [] },
  it: { specialRules: [] },
};

// Initial glossary shown on first paint (SSR-safe). The client fetches
// /api/glossary on mount to merge any user-added entries.
export const GLOSSARY: GlossaryRow[] = PROTECTED_GLOSSARY;

export const TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  uberProduct: 'Uber Product',
  collection: 'Collection',
  category: 'Category',
  feature: 'Product Feature',
  frontpage: 'Front page',
  hero: 'Hero',
  block: 'Block',
};

export const STATUS_LABELS: Record<string, string> = {
  none: 'Not translated',
  progress: 'In progress',
  review: 'Needs review',
  approved: 'Approved',
  stale: 'Out of sync',
  error: 'Error',
};

export const TWEAK_DEFAULTS = {
  layout: 'matrix',
  diffMode: 'side',
  nav: 'sidebar',
  density: 'comfortable',
} as const;
