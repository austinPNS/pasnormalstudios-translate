import { promises as fs } from 'fs';
import path from 'path';
import {
  CATEGORY_NOTE,
  KEY_TO_CATEGORY,
  groupRowsByCategory,
  type ProtectedTerms,
} from './protected-terms';
import type { GlossaryRow, PromptsMap } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const PROTECTED_FILE = path.join(DATA_DIR, 'protected-terms.json');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');

const readJson = async <T>(file: string): Promise<T> => {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as T;
};

const writeJson = async (file: string, data: unknown): Promise<void> => {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
};

const PROTECTED_KEYS = Object.keys(KEY_TO_CATEGORY) as (keyof ProtectedTerms)[];

const flattenProtected = (data: ProtectedTerms): GlossaryRow[] => {
  const rows: GlossaryRow[] = [];
  for (const key of PROTECTED_KEYS) {
    const category = KEY_TO_CATEGORY[key];
    for (const src of data[key] ?? []) {
      rows.push({
        src,
        de: src,
        fr: src,
        it: src,
        kind: 'dnt',
        scope: category,
        notes: CATEGORY_NOTE[category],
      });
    }
  }
  return rows;
};

export const readGlossaryEntries = async (): Promise<GlossaryRow[]> => {
  const data = await readJson<ProtectedTerms>(PROTECTED_FILE);
  return flattenProtected(data);
};

export const writeGlossaryEntries = async (
  entries: GlossaryRow[]
): Promise<void> => {
  const grouped = groupRowsByCategory(entries);
  await writeJson(PROTECTED_FILE, grouped);
};

export const readPrompts = async (): Promise<PromptsMap> => {
  return readJson<PromptsMap>(PROMPTS_FILE);
};

export const writePrompts = async (prompts: PromptsMap): Promise<void> => {
  await writeJson(PROMPTS_FILE, prompts);
};
