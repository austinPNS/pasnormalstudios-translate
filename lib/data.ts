import { PROTECTED_GLOSSARY } from './protected-terms';
import type {
  FreeTextHistoryItem,
  FreeTextPreset,
  GlossaryRow,
  JobRecord,
  Lang,
  PromptsMap,
} from './types';

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

export const JOBS: JobRecord[] = [
  {
    id: 'job_0412_ss26_hero',
    docTitle: 'Hero Block — SS26 Launch',
    docId: 'block-hero-ss26',
    targets: ['fr'],
    fields: 14,
    done: 9,
    status: 'progress',
    startedBy: 'Mika L.',
    started: '2 min ago',
    eta: '~40s',
  },
  {
    id: 'job_0412_front',
    docTitle: 'Frontpage — Global',
    docId: 'front-homepage',
    targets: ['de'],
    fields: 38,
    done: 30,
    status: 'progress',
    startedBy: 'Theo B.',
    started: '4 min ago',
    eta: '~2m',
  },
  {
    id: 'job_0412_spring',
    docTitle: 'Spring Racing Collection SS26',
    docId: 'col-spring-racing',
    targets: ['fr', 'it'],
    fields: 22,
    done: 22,
    status: 'review',
    startedBy: 'Ida W.',
    started: '12 min ago',
    eta: 'awaiting review',
  },
  {
    id: 'job_0412_edit_grid',
    docTitle: 'Editorial Grid — Off Season',
    docId: 'block-editorial-grid',
    targets: ['de'],
    fields: 18,
    done: 11,
    status: 'error',
    startedBy: 'Ida W.',
    started: '18 min ago',
    eta: 'failed — glossary term missing',
  },
  {
    id: 'job_0411_materials',
    docTitle: 'Materials & Sustainability',
    docId: 'feat-sustainability',
    targets: ['de'],
    fields: 27,
    done: 27,
    status: 'stale',
    startedBy: 'Ida W.',
    started: 'yesterday',
    eta: 'source updated since',
  },
  {
    id: 'job_0411_fit_guide',
    docTitle: 'Fit Guide: Race vs. Mechanism',
    docId: 'feat-fit-guide',
    targets: ['fr', 'it'],
    fields: 16,
    done: 16,
    status: 'approved',
    startedBy: 'Theo B.',
    started: 'yesterday',
    eta: 'synced to Sanity',
  },
  {
    id: 'job_0410_mech_pro',
    docTitle: 'Mechanism Pro Jersey — Men',
    docId: 'prod-mechanism-pro-jersey',
    targets: ['fr', 'it'],
    fields: 19,
    done: 19,
    status: 'approved',
    startedBy: 'Ida W.',
    started: '2 days ago',
    eta: 'synced to Sanity',
  },
];

// Initial glossary shown on first paint (SSR-safe). The client fetches
// /api/glossary on mount to merge any user-added entries.
export const GLOSSARY: GlossaryRow[] = PROTECTED_GLOSSARY;

export const FREE_TEXT_PRESETS: FreeTextPreset[] = [
  {
    id: 'launch-cta',
    label: 'Launch CTA',
    sourceText:
      'Mechanism Pro Jersey is back in Dark Olive. Lightweight race fit, breathable mesh back panel, and made in Italy.',
    outputs: {
      de: 'Das Mechanism Pro Jersey ist zurück in Dark Olive. Leichte Race-Passform, atmungsaktives Mesh-Rückenteil und hergestellt in Italien.',
      fr: 'Le Mechanism Pro Jersey est de retour en Dark Olive. Coupe course légère, panneau dos respirant en mesh, fabriqué en Italie.',
      it: 'La Mechanism Pro Jersey torna in Dark Olive. Vestibilità race leggera, pannello posteriore in mesh traspirante e realizzata in Italia.',
    },
    tone: 'Product marketing',
    glossaryHits: ['Mechanism Pro Jersey', 'Dark Olive'],
    rules: [
      'Keep product names in English.',
      'Keep colorway names unchanged.',
      'Preserve concise premium tone.',
    ],
  },
  {
    id: 'support-reply',
    label: 'Support reply',
    sourceText:
      'Thanks for reaching out. Your order is packed and will leave our warehouse within 1 business day.',
    outputs: {
      de: 'Vielen Dank fur Ihre Nachricht. Ihre Bestellung ist verpackt und verlasst unser Lager innerhalb eines Werktags.',
      fr: 'Merci pour votre message. Votre commande est preparee et quittera notre entrepot sous 1 jour ouvrable.',
      it: 'Grazie per averci contattato. Il tuo ordine e pronto e lascera il nostro magazzino entro 1 giorno lavorativo.',
    },
    tone: 'Customer support',
    glossaryHits: [],
    rules: [
      'Keep tone calm and helpful.',
      'Do not over-localize logistics wording.',
    ],
  },
  {
    id: 'campaign-copy',
    label: 'Campaign copy',
    sourceText:
      'For long training days and hard efforts, the Escapism collection balances durability, comfort, and a relaxed silhouette.',
    outputs: {
      de: 'Fur lange Trainingstage und harte Belastungen balanciert die Escapism Kollektion Haltbarkeit, Komfort und eine entspannte Silhouette.',
      fr: 'Pour les longues journees d entrainement et les efforts soutenus, la collection Escapism equilibre durabilite, confort et silhouette decontractee.',
      it: 'Per le lunghe giornate di allenamento e gli sforzi intensi, la collezione Escapism bilancia resistenza, comfort e una silhouette rilassata.',
    },
    tone: 'Campaign',
    glossaryHits: ['Escapism'],
    rules: [
      'Keep collection names in English.',
      'Use natural retail language, not literal phrasing.',
    ],
  },
];

export const FREE_TEXT_HISTORY: FreeTextHistoryItem[] = [
  {
    id: 'ft_001',
    sourceLang: 'en',
    targetLang: 'de',
    sourceText:
      'Mechanism Pro Jersey is back in Dark Olive for early spring training blocks.',
    outputText:
      'Das Mechanism Pro Jersey ist fur die ersten Trainingsblocke im Fruhjahr wieder in Dark Olive verfugbar.',
    tone: 'Product marketing',
    usedGlossary: ['Mechanism Pro Jersey', 'Dark Olive'],
    usedRules: ['Keep product names in English.', 'Keep colorway names unchanged.'],
    updated: '4 min ago',
  },
  {
    id: 'ft_002',
    sourceLang: 'en',
    targetLang: 'fr',
    sourceText:
      'Thanks for reaching out. Your order will leave our warehouse within 1 business day.',
    outputText:
      'Merci pour votre message. Votre commande quittera notre entrepot sous 1 jour ouvrable.',
    tone: 'Customer support',
    usedGlossary: [],
    usedRules: ['Keep tone calm and helpful.'],
    updated: '18 min ago',
  },
  {
    id: 'ft_003',
    sourceLang: 'en',
    targetLang: 'it',
    sourceText:
      'Escapism blends everyday utility with a softer silhouette for long mixed-surface rides.',
    outputText:
      'Escapism unisce praticita quotidiana e una silhouette piu morbida per lunghe uscite su superfici miste.',
    tone: 'Campaign',
    usedGlossary: ['Escapism'],
    usedRules: ['Keep collection names in English.'],
    updated: 'yesterday',
  },
];

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
