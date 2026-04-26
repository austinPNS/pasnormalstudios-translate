const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET;
const API_VERSION = process.env.NEXT_PUBLIC_SANITY_API_VERSION;
const VIEW_TOKEN = process.env.SECRET_SANITY_VIEW_TOKEN;
const ADMIN_TOKEN = process.env.SECRET_SANITY_ADMIN_TOKEN;

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

export type SanityMutation =
  | { patch: { id: string; set?: Record<string, unknown>; setIfMissing?: Record<string, unknown> } }
  | { create: Record<string, unknown> }
  | { delete: { id: string } };

export async function sanityMutate<T = unknown>(mutations: SanityMutation[]): Promise<T> {
  if (!PROJECT_ID || !DATASET || !API_VERSION) {
    throw new SanityConfigError(
      'Missing Sanity config. Set NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET, NEXT_PUBLIC_SANITY_API_VERSION.'
    );
  }
  if (!ADMIN_TOKEN) {
    throw new SanityConfigError('Missing SECRET_SANITY_ADMIN_TOKEN — required for write operations.');
  }

  const url = `https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/mutate/${DATASET}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new SanityQueryError(
      `Sanity mutate failed: ${res.status} ${res.statusText}`,
      res.status,
      body
    );
  }

  return (await res.json()) as T;
}
