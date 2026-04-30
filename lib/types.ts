export type Status = 'none' | 'progress' | 'review' | 'approved' | 'stale' | 'error';

export type LangCode = 'en' | 'de' | 'fr' | 'it';

export type DocType =
  | 'product'
  | 'uberProduct'
  | 'collection'
  | 'category'
  | 'feature'
  | 'frontpage'
  | 'hero'
  | 'block';

export interface Lang {
  code: LangCode;
  label: string;
  region: string;
  source?: boolean;
}

export interface DocLangState {
  status: Status;
  pct: number;
}

export interface DocRecord {
  id: string;
  title: string;
  type: DocType;
  // Actual Sanity `_type` (e.g. `feature.product`) — needed for intent URLs.
  sanityType: string;
  updated: string;
  author: string;
  langs: Record<LangCode, DocLangState>;
}

export interface FieldBlock {
  kind: 'fields';
  label: string;
  fields: FieldItem[];
}

export interface FieldItem {
  name: string;
  type: string;
  en: string | null;
  de: string | null;
  fr: string | null;
  it: string | null;
}

export interface ImageBlock {
  kind: 'image';
  label: string;
  items: ImageItem[];
}

export interface ImageItem {
  alt: Record<LangCode, string | null>;
  caption: Record<LangCode, string | null>;
}

export type Block = FieldBlock | ImageBlock;

export interface SampleDoc {
  id: string;
  sanityType: string;
  title: string;
  type: DocType;
  blocks: Block[];
}

export interface PromptEntry {
  specialRules: string[];
}

export type PromptKey = 'general' | Exclude<LangCode, 'en'>;
export type PromptsMap = Partial<Record<PromptKey, PromptEntry>>;

export interface JobRecord {
  id: string;
  docTitle: string;
  docId: string;
  targets: Exclude<LangCode, 'en'>[];
  fields: number;
  done: number;
  status: Status;
  startedBy: string;
  started: string;
  eta: string;
}

export interface GlossaryRow {
  src: string;
  de: string;
  fr: string;
  it: string;
  kind: 'dnt' | 'brand';
  scope: string;
  notes?: string;
}

export interface FreeTextHistoryItem {
  id: string;
  sourceLang: LangCode;
  targetLang: Exclude<LangCode, 'en'>;
  sourceText: string;
  outputText: string;
  tone: string;
  usedGlossary: string[];
  usedRules: string[];
  updated: string;
}

export interface FreeTextPreset {
  id: string;
  label: string;
  sourceText: string;
  outputs: Record<Exclude<LangCode, 'en'>, string>;
  tone: string;
  glossaryHits: string[];
  rules: string[];
}

export type Tweaks = {
  layout: 'matrix' | 'list' | 'kanban';
  diffMode: 'side' | 'diff';
  nav: 'sidebar' | 'topbar';
  density: 'compact' | 'comfortable';
};
