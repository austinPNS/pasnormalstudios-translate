// One-off audit: walk Sanity sample docs for the 6 supported types, detect every
// i18n-shaped or portable-text field (by `_type` or by a {en,de,fr,it} key shape),
// and diff against the configured fields in lib/translatable-fields.ts.
//
// Run: `set -a; source .env; set +a; node scripts/audit-translatable-fields.mjs`

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const TOKEN = process.env.SECRET_SANITY_VIEW_TOKEN;

if (!PROJECT_ID || !DATASET || !API_VERSION || !TOKEN) {
  console.error('Missing Sanity env. Source .env first.');
  process.exit(1);
}

const TYPES = [
  'product',
  'uberProduct',
  'feature.product',
  'pnsCategory',
  'pnsCollection',
  'frontPage',
  'hero',
];

const LANG_KEYS = ['en', 'de', 'fr', 'it'];
const SAMPLE_SIZE = 8; // per type — bigger = more coverage

const sanityQuery = async (query) => {
  const url = new URL(
    `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`
  );
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'previewDrafts');
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`Sanity ${res.status}: ${await res.text()}`);
  const json = await res.json();
  return json.result;
};

// Heuristics:
// - i18n object: has `_type` starting with "i18n." OR has at least one of LANG_KEYS as a string and no other "structural" keys beyond { en, de, fr, it, _type }.
// - portable text: array whose elements include any with `_type === 'block'`.
const isI18nObject = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  const t = v._type;
  if (typeof t === 'string' && t.startsWith('i18n.')) return t;
  // Bare-object shape (no _type) — only flag when EVERY non-underscore key is a lang key.
  const keys = Object.keys(v).filter((k) => !k.startsWith('_'));
  if (keys.length === 0) return null;
  const allLang = keys.every((k) => LANG_KEYS.includes(k));
  if (!allLang) return null;
  // And at least one value is a string (skip empty {}).
  if (!keys.some((k) => typeof v[k] === 'string')) return null;
  return 'i18n.string?'; // unknown variant — could be string or text
};

const isPortableText = (v) => {
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.some((x) => x && typeof x === 'object' && x._type === 'block');
};

// Walk a value, accumulating paths to translatable leaves.
// - Objects descend by key (using `.`)
// - Arrays descend with `[]` (no index — we want one entry per array shape)
// Records: { path, kind: 'i18n.string' | 'i18n.text' | 'portableText', sampleType?: string }
const walk = (value, path, found) => {
  if (value == null) return;
  if (Array.isArray(value)) {
    if (isPortableText(value)) {
      found.set(path, { path, kind: 'portableText' });
      return;
    }
    // Recurse into array items as `path[]`
    for (const item of value) walk(item, `${path}[]`, found);
    return;
  }
  if (typeof value === 'object') {
    const i18nType = isI18nObject(value);
    if (i18nType) {
      // Pick refined kind: if any value contains a newline, treat as text.
      const anyMultiline = LANG_KEYS.some(
        (k) => typeof value[k] === 'string' && value[k].includes('\n')
      );
      const kind =
        i18nType === 'i18n.text'
          ? 'i18n.text'
          : i18nType === 'i18n.string'
          ? 'i18n.string'
          : anyMultiline
          ? 'i18n.text'
          : 'i18n.string';
      const existing = found.get(path);
      // Promote to text if any sample showed multiline
      if (!existing) found.set(path, { path, kind, sampleType: i18nType });
      else if (kind === 'i18n.text' && existing.kind === 'i18n.string') {
        found.set(path, { ...existing, kind });
      }
      return;
    }
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('_')) continue;
      walk(v, path ? `${path}.${k}` : k, found);
    }
  }
};

const fetchSamples = async (type) => {
  // Get a handful of docs ordered by _updatedAt desc — likely to be most populated.
  const query = `*[_type == "${type}"] | order(_updatedAt desc) [0...${SAMPLE_SIZE}]{...}`;
  return (await sanityQuery(query)) || [];
};

// Configured paths from lib/translatable-fields.ts (mirrored here as plain data so
// we don't need to import TS).
const CONFIGURED = {
  product: ['title', 'color', 'details', 'description', 'modelInfo.text', 'modelInfo.womenText'],
  uberProduct: [
    'title',
    'details',
    'description',
    'sharedProductIntendedUse',
    'modelInfo.text',
    'modelInfo.womenText',
    'testimonials.name',
    'testimonials.role',
    'testimonials.quote',
    'specifications[].description',
  ],
  'feature.product': ['title', 'text'],
  pnsCategory: ['title', 'description'],
  pnsCollection: [
    'title',
    'descriptionMens',
    'descriptionWomens',
    'descriptionUnisex',
    'galleryMensSeasonal.title',
    'galleryWomensSeasonal.title',
    'galleryUnisexSeasonal.title',
    'collectionFeaturesMens.features[].title',
    'collectionFeaturesMens.features[].text',
    'collectionFeaturesWomens.features[].title',
    'collectionFeaturesWomens.features[].text',
    'collectionFeaturesUnisex.features[].title',
    'collectionFeaturesUnisex.features[].text',
    'tags[]',
  ],
  frontPage: [
    'title',
    'blocks[].categoriesLabel',
    'blocks[].collectionsLabel',
    'blocks[].categories[].name',
    'blocks[].title',
    'blocks[].content',
    'blocks[].buttonText',
    'blocks[].activeCampaign.formTitle',
    'blocks[].newsTickers[].text',
  ],
  hero: [
    'label',
    'headerText',
    'byline',
    'ctaButtons[].btnText',
  ],
};

const auditType = async (type) => {
  const samples = await fetchSamples(type);
  const found = new Map();
  for (const doc of samples) walk(doc, '', found);
  // Drop synthetic top-level _-prefixed paths.
  return { type, sampleCount: samples.length, found: [...found.values()].sort((a, b) => a.path.localeCompare(b.path)) };
};

const main = async () => {
  for (const type of TYPES) {
    const { sampleCount, found } = await auditType(type);
    const configured = new Set(CONFIGURED[type] || []);
    console.log(`\n=== ${type} (samples: ${sampleCount}) ===`);
    if (found.length === 0) {
      console.log('  (no translatable fields found in samples)');
      continue;
    }
    for (const { path, kind } of found) {
      // Compare against configured: configured may use `->title` for refs but we walk through refs only if doc was projected with them; refs likely won't appear in our raw walk.
      const isConfigured = configured.has(path);
      const flag = isConfigured ? '✓' : '✗';
      console.log(`  ${flag} ${path}  [${kind}]`);
    }
    // Print configured-but-not-found (could indicate dead config or ref paths).
    for (const p of configured) {
      if (!found.find((f) => f.path === p)) {
        console.log(`  ? ${p}  (configured but not seen in samples — possibly a ref path or unpopulated)`);
      }
    }
  }
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
