import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import type { LangCode } from './types';
import { PROTECTED_GLOSSARY } from './protected-terms';

const MODEL = 'claude-opus-4-7';
const apiKey = process.env.CLAUDE_API_KEY ?? process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  // Don't throw at import time — only throw when translate() is called without a key.
}

const client = new Anthropic({ apiKey: apiKey ?? '' });

type PromptsFile = Record<string, { specialRules?: string[] }>;

const loadPromptsFile = (): PromptsFile => {
  const raw = readFileSync(join(process.cwd(), 'data', 'prompts.json'), 'utf8');
  return JSON.parse(raw) as PromptsFile;
};

const loadStyleGuide = (): string => {
  // Translation style guides live in .claude/memory/. Only DE exists today.
  return readFileSync(
    join(process.cwd(), '.claude', 'memory', 'translation-style-de.md'),
    'utf8'
  );
};

const PROMPTS = loadPromptsFile();
const DE_STYLE_GUIDE = loadStyleGuide();

const LANG_LABEL: Record<Exclude<LangCode, 'en'>, string> = {
  de: 'German',
  fr: 'French',
  it: 'Italian',
};

// Stable, large system prompt. Identical across all requests to the same target
// language (when no rulesOverride is passed) → eligible for prompt caching
// (5-min TTL). Prefix-match invariant: do not interpolate timestamps /
// per-request IDs into this string. When `rulesOverride` is supplied (e.g. by
// the prompt-preview endpoint) the cache key changes, which is expected.
const buildSystemPrompt = (
  target: Exclude<LangCode, 'en'>,
  rulesOverride?: string[]
): string => {
  const protectedTerms = PROTECTED_GLOSSARY.map((g) => g.src).join(', ');
  const specialRules = rulesOverride ?? PROMPTS[target]?.specialRules ?? [];
  const rulesBlock = specialRules.length
    ? specialRules.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '(none)';

  // The DE style guide only applies to DE. Other languages use the protected-term
  // list + special rules + a brief generic instruction.
  const styleGuideBlock =
    target === 'de'
      ? `\n## DE Style Guide (PRIORITY 3)\n\n${DE_STYLE_GUIDE}\n`
      : '';

  return `You are a senior in-house translator for Pas Normal Studios, a Danish premium cycling apparel brand. Translate English source text into ${LANG_LABEL[target]}.

## Priority order
1. Protected terms — never translate these (highest priority)
2. Special rules below
3. Style guide${target === 'de' ? '' : ' (none provided for this language)'}
4. General brand voice: premium, calm, confident, informal "you" form

## Protected terms (do NOT translate, copy verbatim)
Match is **case-insensitive** and **also applies to English plural forms** of any term below. Keep the English form including its English plural — e.g. "Jerseys" stays "Jerseys" (not "Trikots"), "Bibs" stays "Bibs", "Speedsuits" stays "Speedsuits". Do NOT apply target-language pluralization or declension to protected terms; treat them as foreign-language proper nouns and leave them in English exactly as the source uses them. The same rule applies to multi-word protected terms (e.g. "Mechanism Jerseys" stays "Mechanism Jerseys").

${protectedTerms}

## Special rules for ${LANG_LABEL[target]} (PRIORITY 2)
${rulesBlock}
${styleGuideBlock}
## Output format
You will receive an array of items, each with a unique \`key\` and \`source\` text. Return an object with a \`translations\` array, one entry per input item, in the same order. Each entry has the same \`key\` and a \`translation\` field with the translated text. Do not skip items. Do not add commentary outside the JSON.

If a source string is genuinely untranslatable (e.g. a brand name on its own), return it unchanged.`;
};

export interface TranslationItem {
  key: string;
  kind: 'string' | 'text';
  source: string;
}

export interface TranslationResult {
  translations: Record<string, string>;
  notes?: Record<string, string[]>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
  };
}

export interface TranslateOptions {
  withNotes?: boolean;
  specialRulesOverride?: string[];
}

export class TranslatorError extends Error {}

export const translate = async (
  items: TranslationItem[],
  target: Exclude<LangCode, 'en'>,
  opts: TranslateOptions = {}
): Promise<TranslationResult> => {
  if (!apiKey) {
    throw new TranslatorError(
      'Missing CLAUDE_API_KEY (or ANTHROPIC_API_KEY) — set it in .env'
    );
  }
  if (items.length === 0) {
    return {
      translations: {},
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 },
    };
  }

  const system = buildSystemPrompt(target, opts.specialRulesOverride);
  const userPayload = {
    items: items.map((i) => ({ key: i.key, kind: i.kind, source: i.source })),
  };

  // Notes are scoped to free-text usage (one item, user reads the reasoning).
  // Disabled by default for doc/bulk paths to avoid 5-10× output token cost.
  const withNotes = opts.withNotes === true;
  const notesInstruction = withNotes
    ? `\n\nFor each item, also include a "notes" array of 1-3 short sentences describing key translation decisions: term choices, reframings, idiom adaptations, CTA pattern matches, or anything non-obvious. Use the format "\\"X\\" → \\"Y\\" (reasoning)" when explaining a specific phrase. Skip notes for trivial 1-1 translations (return [] in that case).`
    : '';

  const itemSchemaProperties: Record<string, unknown> = {
    key: { type: 'string' },
    translation: { type: 'string' },
  };
  const itemSchemaRequired = ['key', 'translation'];
  if (withNotes) {
    itemSchemaProperties.notes = {
      type: 'array',
      items: { type: 'string' },
    };
    itemSchemaRequired.push('notes');
  }

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system: [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Translate the following items into ${LANG_LABEL[target]}. Return strict JSON matching the schema.${notesInstruction}\n\n${JSON.stringify(userPayload)}`,
      },
    ],
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            translations: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                properties: itemSchemaProperties,
                required: itemSchemaRequired,
              },
            },
          },
          required: ['translations'],
        },
      },
    },
  });

  const textBlock = response.content.find(
    (b): b is Anthropic.TextBlock => b.type === 'text'
  );
  if (!textBlock) {
    throw new TranslatorError('Claude returned no text block');
  }

  let parsed: {
    translations: Array<{ key: string; translation: string; notes?: string[] }>;
  };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch (err) {
    throw new TranslatorError(
      `Claude response was not valid JSON: ${textBlock.text.slice(0, 200)}`
    );
  }

  const map: Record<string, string> = {};
  const notes: Record<string, string[]> = {};
  for (const t of parsed.translations) {
    map[t.key] = t.translation;
    if (Array.isArray(t.notes)) notes[t.key] = t.notes;
  }

  return {
    translations: map,
    ...(withNotes ? { notes } : {}),
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
  };
};
