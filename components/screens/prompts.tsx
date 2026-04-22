'use client';

import { useEffect, useState } from 'react';
import { fetchPrompts, savePrompts } from '@/lib/client-storage';
import { LANGS, PROMPTS } from '@/lib/data';
import type { DocRecord, LangCode, PromptEntry, PromptsMap } from '@/lib/types';
import { IcCheck, IcDocs, IcHistory, IcPlay, IcPlus, IcSync, IcX } from '../icons';
import { LangChip } from '../primitives';

type TargetLang = Exclude<LangCode, 'en'>;
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface Props {
  docs: DocRecord[];
}

export const PromptsScreen = ({ docs }: Props) => {
  const [active, setActive] = useState<TargetLang>('de');
  const [prompt, setPrompt] = useState<PromptsMap>(() => ({ ...PROMPTS }));
  const [saved, setSaved] = useState<PromptsMap>(() => ({ ...PROMPTS }));
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const p = prompt[active]!;
  const lang = LANGS.find((l) => l.code === active)!;

  // Hydrate from data/prompts.json on mount.
  useEffect(() => {
    let cancelled = false;
    fetchPrompts()
      .then((p) => {
        if (cancelled) return;
        setPrompt(p);
        setSaved(p);
      })
      .catch(() => {
        /* keep defaults on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = <K extends keyof PromptEntry>(k: K, v: PromptEntry[K]) =>
    setPrompt((s) => ({ ...s, [active]: { ...(s[active] as PromptEntry), [k]: v } }));

  // specialRules is stored on disk as string[] (one rule per item, preserving
  // blank-string separators). The editor uses a single textarea where each
  // line = one rule; we join/split on '\n' to round-trip.
  const rulesText = p.specialRules.join('\n');
  const setRulesText = (text: string) =>
    update('specialRules', text.split('\n'));

  const dirty = JSON.stringify(prompt) !== JSON.stringify(saved);

  const onSave = async () => {
    setSaveState('saving');
    setSaveError(null);
    try {
      await savePrompts(prompt);
      setSaved(prompt);
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (e) {
      setSaveState('error');
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const onDiscard = () => setPrompt(saved);

  const version = active === 'de' ? '12' : active === 'fr' ? '3' : '1';

  return (
    <div className="prompts-split">
      <aside className="prompts-list">
        <div className="hd">Languages</div>
        {LANGS.filter((l): l is (typeof LANGS)[number] & { code: TargetLang } => !l.source).map((l) => {
          const v = l.code === 'de' ? '12' : l.code === 'fr' ? '3' : '1';
          return (
            <div
              key={l.code}
              className={`lang-row ${active === l.code ? 'active' : ''}`}
              onClick={() => setActive(l.code)}
            >
              <div className="flag">{l.code.toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="nm">{l.label}</div>
                <div className="sub">{l.region}</div>
              </div>
              <span className="chip mono sq" style={{ fontSize: 10 }}>
                v{v}
              </span>
            </div>
          );
        })}
        <div
          style={{
            padding: '12px 16px 16px',
            marginTop: 8,
            borderTop: '1px solid var(--line)',
          }}
        >
          <button className="btn sm" style={{ width: '100%', justifyContent: 'center' }}>
            <IcPlus size={12} /> Add language
          </button>
        </div>
      </aside>

      <div className="prompt-editor">
        <div className="prompt-editor-head">
          <div>
            <h2>
              {lang.label}{' '}
              <span
                style={{
                  color: 'var(--ink-4)',
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  fontWeight: 400,
                  marginLeft: 4,
                }}
              >
                {lang.region}
              </span>
            </h2>
            <div className="sub">
              Prompt used for every EN → {lang.code.toUpperCase()} translation. Supports{' '}
              {'{{field_name}}'}, {'{{doc_type}}'}, {'{{source_text}}'}.
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span
              style={{
                fontSize: 11,
                color: saveState === 'error' ? 'var(--err)' : 'var(--ink-4)',
                fontFamily: 'var(--mono)',
              }}
            >
              {saveState === 'saving'
                ? 'Saving…'
                : saveState === 'saved'
                ? 'Saved to data/prompts.json'
                : saveState === 'error'
                ? saveError ?? 'Save failed'
                : dirty
                ? 'Unsaved changes'
                : 'Last edited 3h ago · Ida W.'}
            </span>
            <button className="btn">
              <IcHistory /> History
            </button>
            <button
              className="btn"
              onClick={onDiscard}
              disabled={!dirty || saveState === 'saving'}
            >
              Discard
            </button>
            <button
              className="btn primary"
              onClick={onSave}
              disabled={!dirty || saveState === 'saving'}
            >
              <IcCheck /> Save & publish
            </button>
          </div>
        </div>

        <div className="prompt-body">
          <div className="prompt-main">
            <div
              className="section-label"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span>Special rules</span>
              <span
                style={{
                  fontSize: 10.5,
                  color: 'var(--ink-4)',
                  fontFamily: 'var(--mono)',
                  textTransform: 'none',
                  letterSpacing: 0,
                }}
              >
                {p.specialRules.length} rule{p.specialRules.length === 1 ? '' : 's'} ·
                one per line · blank lines are preserved
              </span>
            </div>
            <textarea
              className="prompt-ta"
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={28}
              spellCheck={false}
              style={{ fontFamily: 'var(--mono)', fontSize: 12.5, lineHeight: 1.55 }}
              placeholder={
                p.specialRules.length === 0
                  ? `No rules yet for ${lang.label}. Add one rule per line — e.g.\nTARGET LANGUAGE: ${lang.label}.\n- Keep brand and collection names in English.`
                  : undefined
              }
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <button
                className="btn sm ghost"
                onClick={() => update('specialRules', [...p.specialRules, ''])}
              >
                <IcPlus size={11} /> Append blank line
              </button>
              <button
                className="btn sm ghost"
                onClick={() => update('specialRules', [])}
                disabled={p.specialRules.length === 0}
              >
                <IcX size={11} /> Clear all
              </button>
            </div>
          </div>

          <aside className="prompt-aside">
            <div className="section-label">Preview: run on sample</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 10 }}>
              Test the prompt on a real field from a mock product. Does not write to Sanity.
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              <div className="field wide">
                <IcDocs size={13} />
                <select defaultValue="mech">
                  <option value="mech">Mechanism Pro Jersey — subtitle</option>
                  <option>Escapism Gilet — longDescription</option>
                  <option>Fit Guide — intro</option>
                </select>
              </div>
            </div>

            <div className="preview-card">
              <div className="hd">
                <LangChip code="en" source />
                <span className="ttl">Sample field</span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: 'var(--mono)',
                    fontSize: 10.5,
                    color: 'var(--ink-4)',
                  }}
                >
                  subtitle · string
                </span>
              </div>
              <div className="row">
                <div className="lbl">Source</div>
                <div className="val src">
                  Race-cut jersey engineered for long days in the saddle.
                </div>
              </div>
              <div className="row">
                <div className="lbl">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <LangChip code={active} /> Output
                  </span>
                </div>
                <div className="val">
                  {active === 'de' && 'Race-Cut Trikot für lange Tage im Sattel.'}
                  {active === 'fr' &&
                    'Maillot coupe course, conçu pour les longues journées en selle.'}
                  {active === 'it' &&
                    'Maglia taglio racing, pensata per le giornate lunghe in sella.'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center' }}>
              <button className="btn primary" style={{ flex: 1, justifyContent: 'center' }}>
                <IcPlay size={12} /> Run preview
              </button>
              <button className="btn icon" title="Shuffle sample">
                <IcSync size={13} />
              </button>
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 11,
                fontFamily: 'var(--mono)',
                color: 'var(--ink-4)',
              }}
            >
              model: gpt-4.1-mini · 412 tok in · 78 tok out · 1.2s
            </div>

            <hr className="sep" />

            <div className="section-label">Applies to</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              <div>
                —{' '}
                {docs.filter((d) => d.langs[active].status !== 'approved').length} documents
                currently out-of-date
              </div>
              <div>
                — Model:{' '}
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>
                  gpt-4.1-mini
                </span>
              </div>
              <div>
                — Version:{' '}
                <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink)' }}>
                  v{version}
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
