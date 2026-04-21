import { promises as fs } from 'fs';
import path from 'path';
import type { GlossaryRow, PromptsMap } from './types';

const DATA_DIR = path.join(process.cwd(), 'data');
const GLOSSARY_FILE = path.join(DATA_DIR, 'glossary.json');
const PROMPTS_FILE = path.join(DATA_DIR, 'prompts.json');

interface GlossaryFile {
  entries: GlossaryRow[];
}

const readJson = async <T>(file: string): Promise<T> => {
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw) as T;
};

const writeJson = async (file: string, data: unknown): Promise<void> => {
  const tmp = `${file}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  await fs.rename(tmp, file);
};

export const readGlossaryEntries = async (): Promise<GlossaryRow[]> => {
  const data = await readJson<GlossaryFile>(GLOSSARY_FILE);
  return data.entries ?? [];
};

export const writeGlossaryEntries = async (
  entries: GlossaryRow[]
): Promise<void> => {
  await writeJson(GLOSSARY_FILE, { entries });
};

export const readPrompts = async (): Promise<PromptsMap> => {
  return readJson<PromptsMap>(PROMPTS_FILE);
};

export const writePrompts = async (prompts: PromptsMap): Promise<void> => {
  await writeJson(PROMPTS_FILE, prompts);
};
