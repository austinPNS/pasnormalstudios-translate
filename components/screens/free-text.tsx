'use client';

import { useEffect, useMemo, useState } from 'react';
import { IcArrow, IcCheck, IcCopy, IcPlay, IcPrompt } from '../icons';
import { LangChip } from '../primitives';
import { LANGS } from '@/lib/data';
import { PROTECTED_GLOSSARY } from '@/lib/protected-terms';
import { freeTextTranslate } from '@/lib/client-storage';
import type { LangCode } from '@/lib/types';

type TargetLang = Exclude<LangCode, 'en'>;

export const FreeTextScreen = () => {
  const [sourceLang, setSourceLang] = useState<LangCode>('en');
  const [target, setTarget] = useState<TargetLang>('de');
  const [sourceText, setSourceText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!outputText) return;
    try {
      await navigator.clipboard.writeText(outputText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard write can fail in unfocused iframes / older browsers — silently no-op.
    }
  };

  const availableTargets = LANGS.filter(
    (lang): lang is (typeof LANGS)[number] & { code: TargetLang } => !lang.source && lang.code !== sourceLang
  );

  useEffect(() => {
    if (!availableTargets.some((lang) => lang.code === target)) {
      setTarget(availableTargets[0]?.code ?? 'de');
    }
  }, [availableTargets, target]);

  const glossaryHits = useMemo(() => {
    const haystack = sourceText.toLowerCase();
    return PROTECTED_GLOSSARY.filter((entry) => haystack.includes(entry.src.toLowerCase()))
      .slice(0, 12)
      .map((entry) => entry.src);
  }, [sourceText]);

  const handleTranslate = async () => {
    const trimmed = sourceText.trim();
    setError(null);
    setNotes([]);
    if (!trimmed) {
      setOutputText('');
      return;
    }
    if (sourceLang === target) {
      setOutputText(trimmed);
      return;
    }
    setLoading(true);
    try {
      const result = await freeTextTranslate(trimmed, target);
      setOutputText(result.translation);
      setNotes(result.notes ?? []);
    } catch (err) {
      setOutputText('');
      setError(err instanceof Error ? err.message : 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="free-text-shell">
      <div className="page-head">
        <div>
          <h1 className="h1">Free Text</h1>
          <div className="sub">
            Translate ad hoc copy using your glossary and prompt rules before it becomes a document.
          </div>
        </div>
        <div className="spacer" />
        <div className="page-actions">
          <button
            className="btn primary"
            onClick={handleTranslate}
            disabled={loading || !sourceText.trim()}
          >
            <IcPlay /> {loading ? 'Translating…' : 'Translate text'}
          </button>
        </div>
      </div>

      <div className="free-text-toolbar">
        <div className="free-text-lang-row">
          <span className="mini-label">Source</span>
          <div className="field free-text-lang-select">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value as LangCode)}
            >
              {LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <IcArrow size={12} />
          <span className="mini-label">Target</span>
          <div className="field free-text-lang-select">
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as TargetLang)}
            >
              {availableTargets.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="free-text-grid">
        <section className="free-text-main">
          <div className="free-text-compare">
            <div className="free-text-panel">
              <div className="panel-hd">
                <div>
                  <LangChip code={sourceLang} source={sourceLang === 'en'} />
                  <span className="panel-title">Source text</span>
                </div>
              </div>
              <textarea
                className="free-text-area"
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder="Paste or type text to translate..."
              />
              <div className="free-text-meta">
                <LangChip code={sourceLang} source={sourceLang === 'en'} />
                <span>{sourceText.trim() ? sourceText.trim().split(/\s+/).length : 0} words</span>
              </div>
            </div>

            <div className="free-text-panel accent">
              <div className="panel-hd">
                <div>
                  <LangChip code={target} />
                  <span className="panel-title">Prompt-based output</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {error ? (
                    <span className="status-pill">
                      <span className="dot" />
                      Error
                    </span>
                  ) : outputText ? (
                    <span className="status-pill approved">
                      <span className="dot approved" />
                      Translated
                    </span>
                  ) : null}
                  <button
                    className="btn"
                    onClick={handleCopy}
                    disabled={!outputText}
                    title="Copy translation"
                  >
                    {copied ? <IcCheck /> : <IcCopy />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <textarea
                className="free-text-area"
                value={error ?? outputText}
                readOnly
                placeholder={loading ? 'Translating…' : 'Output will appear here.'}
              />
              <div className="free-text-meta">
                <span className="chip mono">model: claude-opus-4-7</span>
                <span>Glossary enforced</span>
              </div>
            </div>
          </div>

          <div className="free-text-insights">
            <div className="insight-card">
              <div className="insight-hd">
                <IcPrompt />
                <span>Translation notes</span>
              </div>
              <div className="insight-list">
                {notes.length > 0 ? (
                  notes.map((note, i) => (
                    <span key={i} className="chip">
                      {note}
                    </span>
                  ))
                ) : (
                  <span className="free-text-empty">
                    {loading
                      ? 'Generating notes…'
                      : outputText
                        ? 'No notes for this translation.'
                        : 'Translate to see the model’s reasoning.'}
                  </span>
                )}
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-hd">
                <IcCheck />
                <span>Glossary matches</span>
              </div>
              <div className="insight-list">
                {glossaryHits.length > 0 ? (
                  glossaryHits.map((term) => (
                    <span key={term} className="chip mono">
                      {term}
                    </span>
                  ))
                ) : (
                  <span className="free-text-empty">No glossary hits in this sample.</span>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="free-text-side">
          <div className="side-card">
            <div className="side-card-hd">
              <span>How this will work</span>
            </div>
            <div className="free-text-notes">
              <div>Uses the target language prompt profile as the base instruction set.</div>
              <div>Applies glossary protections before generating output.</div>
              <div>Keeps this flow separate from document-level translation jobs.</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
