import type { DocRecord, GlossaryRow, LangCode, PromptsMap, SampleDoc } from './types';

export interface BulkTranslateDocResult {
  docId: string;
  baseId: string;
  target: Exclude<LangCode, 'en'>;
  status: 'translated' | 'nothing' | 'error';
  fieldsSet: number;
  itemsRequested: number;
  missingFromResponse: string[];
  error?: string;
}

export interface BulkTranslateResponse {
  ok: boolean;
  results: BulkTranslateDocResult[];
  totalFieldsSet: number;
  mutationsApplied: number;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

export const fetchDocuments = async (): Promise<DocRecord[]> => {
  const res = await fetch('/api/documents', { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET /api/documents failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { docs: DocRecord[] };
  return data.docs;
};

export const fetchDocument = async (id: string): Promise<SampleDoc> => {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GET /api/documents/${id} failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { doc: SampleDoc };
  return data.doc;
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

export interface FreeTextTranslateResponse {
  translation: string;
  notes: string[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

export const freeTextTranslate = async (
  text: string,
  target: Exclude<LangCode, 'en'>
): Promise<FreeTextTranslateResponse> => {
  const res = await fetch('/api/free-text', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, target }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST /api/free-text failed: ${res.status} ${err}`);
  }
  return (await res.json()) as FreeTextTranslateResponse;
};

export const previewPromptTranslate = async (
  text: string,
  target: Exclude<LangCode, 'en'>,
  specialRules: string[]
): Promise<FreeTextTranslateResponse> => {
  const res = await fetch('/api/prompt-preview', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, target, specialRules }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`POST /api/prompt-preview failed: ${res.status} ${err}`);
  }
  return (await res.json()) as FreeTextTranslateResponse;
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

export type BulkTranslateEvent =
  | { type: 'phase'; phase: 'resolve' | 'fetch' | 'mutate'; message: string }
  | {
      type: 'start';
      total: number;
      totalDocs: number;
      targets: Exclude<LangCode, 'en'>[];
    }
  | { type: 'progress'; done: number; total: number; result: BulkTranslateDocResult }
  | { type: 'done'; response: BulkTranslateResponse }
  | { type: 'error'; status: number; message: string };

// Reads `text/event-stream` chunks shaped like:
//   event: <name>\n
//   data:  <json>\n\n
// and dispatches each as a typed BulkTranslateEvent. Resolves with the final
// BulkTranslateResponse (from the `done` event) or rejects on `error`.
export const bulkTranslate = async (
  docIds: string[],
  targets: Exclude<LangCode, 'en'>[],
  onEvent?: (e: BulkTranslateEvent) => void
): Promise<BulkTranslateResponse> => {
  const res = await fetch('/api/bulk-translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
    body: JSON.stringify({ docIds, targets }),
  });
  if (!res.ok || !res.body) {
    const err = await res.text();
    throw new Error(`POST /api/bulk-translate failed: ${res.status} ${err}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let final: BulkTranslateResponse | null = null;
  let failure: { status: number; message: string } | null = null;

  const dispatch = (block: string) => {
    let evt = 'message';
    let dataStr = '';
    for (const line of block.split('\n')) {
      if (line.startsWith('event: ')) evt = line.slice(7).trim();
      else if (line.startsWith('data: ')) dataStr += line.slice(6);
    }
    if (!dataStr) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(dataStr);
    } catch {
      return;
    }
    if (evt === 'done') {
      final = parsed as BulkTranslateResponse;
      onEvent?.({ type: 'done', response: final });
      return;
    }
    if (evt === 'error') {
      const e = parsed as { status?: number; message?: string };
      failure = { status: e.status ?? 500, message: e.message ?? 'Unknown error' };
      onEvent?.({ type: 'error', status: failure.status, message: failure.message });
      return;
    }
    if (evt === 'phase' || evt === 'start' || evt === 'progress') {
      onEvent?.({ type: evt, ...(parsed as object) } as BulkTranslateEvent);
    }
  };

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE event blocks are separated by a blank line.
    let sepIndex = buffer.indexOf('\n\n');
    while (sepIndex !== -1) {
      const block = buffer.slice(0, sepIndex);
      buffer = buffer.slice(sepIndex + 2);
      if (block.trim()) dispatch(block);
      sepIndex = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) dispatch(buffer);

  if (failure) {
    const f = failure as { status: number; message: string };
    throw new Error(`bulk-translate failed (${f.status}): ${f.message}`);
  }
  if (!final) {
    throw new Error('bulk-translate stream ended without a `done` event');
  }
  return final;
};
