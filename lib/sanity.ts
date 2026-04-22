const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const VIEW_TOKEN = process.env.SECRET_SANITY_VIEW_TOKEN;

export class SanityConfigError extends Error {}
export class SanityQueryError extends Error {
  constructor(message: string, public status: number, public body: string) {
    super(message);
  }
}

const assertConfig = () => {
  if (!PROJECT_ID || !DATASET || !API_VERSION) {
    throw new SanityConfigError(
      'Missing Sanity config. Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION.'
    );
  }
  if (!VIEW_TOKEN) {
    throw new SanityConfigError('Missing SECRET_SANITY_VIEW_TOKEN.');
  }
};

export async function sanityQuery<T>(
  query: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  assertConfig();

  const url = new URL(
    `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}`
  );
  url.searchParams.set('query', query);
  url.searchParams.set('perspective', 'previewDrafts');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(`$${k}`, JSON.stringify(v));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${VIEW_TOKEN}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new SanityQueryError(
      `Sanity query failed: ${res.status} ${res.statusText}`,
      res.status,
      body
    );
  }

  const json = (await res.json()) as { result: T };
  return json.result;
}
