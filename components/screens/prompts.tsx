'use client';

import { useState } from 'react';
import { DOCS, LANGS, PROMPTS } from '@/lib/data';
import type { LangCode, PromptEntry, PromptsMap } from '@/lib/types';
import { IcCheck, IcDocs, IcHistory, IcPlay, IcPlus, IcSync } from '../icons';
import { LangChip } from '../primitives';

type TargetLang = Exclude<LangCode, 'en'>;

export const PromptsScreen = () => {
  const [active, setActive] = useState<TargetLang>('de');
  const [prompt, setPrompt] = useState<PromptsMap>(() => ({ ...PROMPTS }));
  const p = prompt[active]!;
  const lang = LANGS.find((l) => l.code === active)!;

  const update = <K extends keyof PromptEntry>(k: K, v: PromptEntry[K]) =>
    setPrompt((s) => ({ ...s, [active]: { ...(s[active] as PromptEntry), [k]: v } }));

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
                color: 'var(--ink-4)',
                fontFamily: 'var(--mono)',
              }}
            >
              Last edited 3h ago · Ida W.
            </span>
            <button className="btn">
              <IcHistory /> History
            </button>
            <button className="btn">Discard</button>
            <button className="btn primary">
              <IcCheck /> Save & publish
            </button>
          </div>
        </div>

        <div className="prompt-body">
          <div className="prompt-main">
            <div className="section-label">System prompt</div>
            <textarea
              className="prompt-ta"
              value={p.system}
              onChange={(e) => update('system', e.target.value)}
              rows={18}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>Insert variable:</span>
              <div className="var-chips">
                <span className="var-chip">{'{{source_text}}'}</span>
                <span className="var-chip">{'{{field_name}}'}</span>
                <span className="var-chip">{'{{doc_type}}'}</span>
                <span className="var-chip">{'{{brand_voice}}'}</span>
                <span className="var-chip">{'{{glossary}}'}</span>
              </div>
            </div>

            <div className="section-label">Brand voice guidelines</div>
            <textarea
              className="ta brand"
              value={p.brand}
              onChange={(e) => update('brand', e.target.value)}
              rows={5}
            />

            <div className="section-label">
              Glossary (scoped to {lang.code.toUpperCase()})
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 6, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-1)' }}>
                    {['Source', lang.code.toUpperCase(), 'Rule', 'Notes'].map((h, i) => (
                      <th
                        key={i}
                        style={{
                          textAlign: i === 2 ? 'left' : 'left',
                          padding: '8px 10px',
                          fontSize: 10.5,
                          fontWeight: 600,
                          color: 'var(--ink-4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          borderBottom: '1px solid var(--line)',
                          width: i === 2 ? 80 : undefined,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {p.glossary.map((g, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 500 }}>{g.src}</td>
                      <td style={{ padding: '8px 10px' }}>{g.target}</td>
                      <td style={{ padding: '8px 10px' }}>
                        <span className={`tag ${g.kind}`}>
                          {g.kind === 'dnt' ? 'Do not translate' : 'Preferred'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 10px', color: 'var(--ink-3)' }}>
                        {g.notes || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div
                style={{
                  padding: 8,
                  background: 'var(--bg-1)',
                  borderTop: '1px solid var(--line)',
                }}
              >
                <button className="btn sm ghost">
                  <IcPlus size={11} /> Add term
                </button>
                <button className="btn sm ghost">Open shared glossary →</button>
              </div>
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
                {DOCS.filter((d) => d.langs[active].status !== 'approved').length} documents
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
