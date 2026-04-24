'use client';

import { useEffect, useMemo, useState } from 'react';
import { IcArrow, IcCheck, IcHistory, IcPlay, IcPrompt, IcSync } from '../icons';
import { LangChip } from '../primitives';
import { FREE_TEXT_PRESETS, GLOSSARY, LANGS } from '@/lib/data';
import type { LangCode } from '@/lib/types';

type TargetLang = Exclude<LangCode, 'en'>;

export const FreeTextScreen = () => {
  const [presetId, setPresetId] = useState(FREE_TEXT_PRESETS[0].id);
  const [sourceLang, setSourceLang] = useState<LangCode>('en');
  const [target, setTarget] = useState<TargetLang>('de');
  const [sourceText, setSourceText] = useState(FREE_TEXT_PRESETS[0].sourceText);
  const [outputText, setOutputText] = useState(FREE_TEXT_PRESETS[0].outputs.de);

  const preset = FREE_TEXT_PRESETS.find((item) => item.id === presetId) ?? FREE_TEXT_PRESETS[0];
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
    return GLOSSARY.filter((entry) => haystack.includes(entry.src.toLowerCase()))
      .slice(0, 6)
      .map((entry) => entry.src);
  }, [sourceText]);

  const rules = useMemo(
    () => [
      'Use the saved prompt rules for the selected target language.',
      'Keep glossary protected terms unchanged when they appear in the source text.',
      'Return a natural translation suitable for internal review before publishing.',
    ],
    []
  );

  const loadPreset = (nextPresetId: string) => {
    const nextPreset = FREE_TEXT_PRESETS.find((item) => item.id === nextPresetId) ?? FREE_TEXT_PRESETS[0];
    setPresetId(nextPreset.id);
    setSourceLang('en');
    setSourceText(nextPreset.sourceText);
    setOutputText(nextPreset.outputs[target] ?? nextPreset.outputs.de);
  };

  const translateMock = () => {
    const trimmed = sourceText.trim();
    if (!trimmed) {
      setOutputText('');
      return;
    }
    if (sourceLang === 'en' && trimmed === preset.sourceText) {
      setOutputText(preset.outputs[target]);
      return;
    }

    const prefix =
      sourceLang === target ? 'No translation needed.' : `${sourceLang.toUpperCase()} -> ${target.toUpperCase()} mock`;
    setOutputText(`${prefix}: ${trimmed}`);
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
          <button className="btn">
            <IcHistory /> History
          </button>
          <button className="btn" onClick={() => loadPreset(preset.id)}>
            <IcSync /> Load sample
          </button>
          <button className="btn primary" onClick={translateMock}>
            <IcPlay /> Translate text
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
                <div className="field wide free-text-select">
                  <select value={presetId} onChange={(e) => loadPreset(e.target.value)}>
                    {FREE_TEXT_PRESETS.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
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
                <span className="status-pill approved">
                  <span className="dot approved" />
                  Mock result
                </span>
              </div>
              <textarea className="free-text-area" value={outputText} readOnly />
              <div className="free-text-meta">
                <span className="chip mono">model: gpt-4.1-mini</span>
                <span>Glossary enforced</span>
              </div>
            </div>
          </div>

          <div className="free-text-insights">
            <div className="insight-card">
              <div className="insight-hd">
                <IcPrompt />
                <span>Prompt rules used</span>
              </div>
              <div className="insight-list">
                {rules.map((rule) => (
                  <span key={rule} className="chip">
                    {rule}
                  </span>
                ))}
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
