import { PROTECTED_GLOSSARY } from './protected-terms';
import type {
  GlossaryRow,
  JobRecord,
  Lang,
  PromptsMap,
  SampleDoc,
} from './types';

export const LANGS: Lang[] = [
  { code: 'en', label: 'English', region: 'EN', source: true },
  { code: 'de', label: 'German', region: 'DE-DE' },
  { code: 'fr', label: 'French', region: 'FR-FR' },
  { code: 'it', label: 'Italian', region: 'IT-IT' },
];

export const SAMPLE_DOC: SampleDoc = {
  id: 'prod-mechanism-pro-jersey',
  title: 'Mechanism Pro Jersey — Men',
  type: 'product',
  blocks: [
    {
      kind: 'fields',
      label: 'Core',
      fields: [
        {
          name: 'title',
          type: 'string',
          en: 'Mechanism Pro Jersey — Men',
          de: 'Mechanism Pro Trikot — Herren',
          fr: 'Maillot Mechanism Pro — Homme',
          it: 'Maglia Mechanism Pro — Uomo',
        },
        {
          name: 'slug',
          type: 'slug',
          en: 'mechanism-pro-jersey-men',
          de: 'mechanism-pro-jersey-men',
          fr: 'mechanism-pro-jersey-men',
          it: 'mechanism-pro-jersey-men',
        },
        {
          name: 'subtitle',
          type: 'string',
          en: 'Race-cut jersey engineered for long days in the saddle.',
          de: 'Race-Cut Trikot für lange Tage im Sattel.',
          fr: 'Maillot coupe course, conçu pour les longues journées en selle.',
          it: null,
        },
      ],
    },
    {
      kind: 'fields',
      label: 'Marketing copy',
      fields: [
        {
          name: 'shortDescription',
          type: 'text',
          en: 'A stripped-back, race-oriented jersey built around a single idea: get out of the way. Lightweight, breathable and fast.',
          de: 'Ein reduziertes, rennorientiertes Trikot, gebaut um eine einzige Idee: aus dem Weg gehen. Leicht, atmungsaktiv und schnell.',
          fr: "Un maillot dépouillé et orienté course, construit autour d'une idée : disparaître. Léger, respirant et rapide.",
          it: null,
        },
        {
          name: 'longDescription',
          type: 'portableText',
          en: 'The Mechanism Pro Jersey is cut closer to the body, uses a featherweight mesh panel across the back, and features three rear pockets plus a zipped valuables pocket. Seams are flatlocked. The zip is a YKK camlock. It is intended to be raced, but it will reward any rider who likes their jerseys to disappear on the bike.',
          de: 'Das Mechanism Pro Trikot ist körpernah geschnitten, verwendet ein federleichtes Mesh-Panel am Rücken und verfügt über drei hintere Taschen plus eine Wertsachentasche mit Reißverschluss. Die Nähte sind flach vernäht. Der Zipper ist ein YKK Camlock. Es ist für das Rennen gemacht, aber es wird jeden Fahrer belohnen, der möchte, dass sein Trikot auf dem Rad verschwindet.',
          fr: 'Le maillot Mechanism Pro est coupé plus près du corps, utilise un panneau en mesh ultra-léger dans le dos, et comporte trois poches arrière plus une poche zippée pour les objets de valeur. Les coutures sont plates. Le zip est un YKK camlock. Il est pensé pour la course, mais récompensera tout cycliste qui préfère que son maillot disparaisse sur le vélo.',
          it: 'La maglia Mechanism Pro ha un taglio più aderente al corpo, utilizza un pannello in mesh ultraleggero sulla schiena, e presenta tre tasche posteriori più un taschino con zip per oggetti di valore.',
        },
      ],
    },
    {
      kind: 'image',
      label: 'Hero imagery',
      items: [
        {
          alt: {
            en: 'Rider in Mechanism Pro Jersey cresting a col at sunrise.',
            de: 'Fahrer im Mechanism Pro Trikot erklimmt einen Pass bei Sonnenaufgang.',
            fr: 'Un coureur en maillot Mechanism Pro franchit un col au lever du soleil.',
            it: null,
          },
          caption: {
            en: 'Col du Galibier, April 2026.',
            de: 'Col du Galibier, April 2026.',
            fr: 'Col du Galibier, avril 2026.',
            it: 'Col du Galibier, aprile 2026.',
          },
        },
      ],
    },
    {
      kind: 'fields',
      label: 'Materials & fit',
      fields: [
        {
          name: 'materials',
          type: 'text',
          en: 'Main body: 82% recycled polyester, 18% elastane. Back panel: 100% recycled polyester mesh. Made in Italy.',
          de: 'Hauptteil: 82% recyceltes Polyester, 18% Elasthan. Rückenteil: 100% recyceltes Polyester-Mesh. Hergestellt in Italien.',
          fr: 'Corps : 82% polyester recyclé, 18% élasthanne. Panneau dos : 100% mesh polyester recyclé. Fabriqué en Italie.',
          it: null,
        },
        {
          name: 'fitNotes',
          type: 'text',
          en: 'Race fit. For a relaxed fit, size up. Model is 182cm, wearing Medium.',
          de: 'Race-Passform. Für einen entspannteren Sitz eine Größe größer wählen. Das Modell ist 182 cm groß und trägt Größe M.',
          fr: 'Coupe course. Pour une coupe plus ample, prendre une taille au-dessus. Le mannequin mesure 182 cm et porte une taille M.',
          it: null,
        },
      ],
    },
    {
      kind: 'fields',
      label: 'SEO',
      fields: [
        {
          name: 'metaTitle',
          type: 'string',
          en: 'Mechanism Pro Jersey — Men | Pas Normal Studios',
          de: 'Mechanism Pro Trikot — Herren | Pas Normal Studios',
          fr: 'Maillot Mechanism Pro — Homme | Pas Normal Studios',
          it: null,
        },
        {
          name: 'metaDescription',
          type: 'text',
          en: 'A race-cut, long-day jersey. Lightweight, breathable, made in Italy.',
          de: 'Ein Race-Cut Trikot für lange Tage. Leicht, atmungsaktiv, in Italien hergestellt.',
          fr: 'Un maillot coupe course pour longues journées. Léger, respirant, fabriqué en Italie.',
          it: null,
        },
      ],
    },
  ],
};

// SSR fallback. Real content lives in data/prompts.json and is fetched on mount.
export const PROMPTS: PromptsMap = {
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

export const TYPE_LABELS: Record<string, string> = {
  product: 'Product',
  uberProduct: 'Uber Product',
  collection: 'Collection',
  category: 'Category',
  feature: 'Product Feature',
  frontpage: 'Front page',
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
