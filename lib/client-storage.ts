import type { DocRecord, GlossaryRow, PromptsMap } from './types';

export const fetchDocuments = async (): Promise<DocRecord[]> => {
  const res = await fetch('/api/documents', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET /api/documents failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { docs: DocRecord[] };
  return data.docs;
};

export const fetchGlossaryEntries = async (): Promise<GlossaryRow[]> => {
  const res = await fetch('/api/glossary', { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET /api/glossary failed: ${res.status}`);
  const data = (await res.json()) as { entries: GlossaryRow[] };
  return data.entries;
};

export const saveGlossaryEntries = async (
  entries: GlossaryRow[]
): Promise<void> => {
  const res = await fetch('/api/glossary', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ entries }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PUT /api/glossary failed: ${res.status} ${err}`);
  }
};

export const fetchPrompts = async (): Promise<PromptsMap> => {
  const res = await fetch('/api/prompts', { cache: 'no-store' });
  if (!res.ok) throw new Error(`GET /api/prompts failed: ${res.status}`);
  return (await res.json()) as PromptsMap;
};

export const savePrompts = async (prompts: PromptsMap): Promise<void> => {
  const res = await fetch('/api/prompts', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(prompts),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PUT /api/prompts failed: ${res.status} ${err}`);
  }
};
