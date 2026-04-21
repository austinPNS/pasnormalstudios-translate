'use client';

import { useState } from 'react';
import { DOCS, LANGS } from '@/lib/data';
import type { LangCode } from '@/lib/types';
import { IcPlay, IcX } from './icons';
import { Check, DocTypeBadge, LangChip, Switch } from './primitives';

interface Props {
  initialSel: string[];
  onClose: () => void;
  onSubmit: () => void;
}

export const BulkModal = ({ initialSel, onClose, onSubmit }: Props) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sel, setSel] = useState<Set<string>>(new Set(initialSel));
  const [targets, setTargets] = useState<Set<LangCode>>(new Set<LangCode>(['fr', 'it']));
  const [skipExisting, setSkipExisting] = useState(true);
  const [model, setModel] = useState('gpt-4.1-mini');

  const toggleDoc = (id: string) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };
  const toggleTarget = (code: LangCode) => {
    const n = new Set(targets);
    n.has(code) ? n.delete(code) : n.add(code);
    setTargets(n);
  };

  const fieldsEst = sel.size * targets.size * 12;
  const timeEst = Math.max(15, Math.round(fieldsEst * 0.8));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="hd">
          <div>
            <h2>Bulk translate</h2>
            <div className="sub">
              Step {step} of 3 —{' '}
              {step === 1
                ? 'choose documents'
                : step === 2
                ? 'target languages'
                : 'review & run'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn ghost icon" onClick={onClose}>
            <IcX />
          </button>
        </div>

        <div className="bd">
          {step === 1 && (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 10 }}>
                {sel.size} of {DOCS.length} selected
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  maxHeight: 320,
                  overflow: 'auto',
                }}
              >
                {DOCS.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => toggleDoc(d.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--line)',
                      cursor: 'pointer',
                      background: sel.has(d.id) ? 'var(--accent-bg)' : 'transparent',
                    }}
                  >
                    <Check on={sel.has(d.id)} onClick={() => toggleDoc(d.id)} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{d.title}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--ink-4)',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        {d.id}
                      </div>
                    </div>
                    <DocTypeBadge type={d.type} />
                  </div>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Choose target languages
              </div>
              <div className="lang-grid">
                {LANGS.filter((l) => !l.source).map((l) => (
                  <div
                    key={l.code}
                    className={`lang-cb ${targets.has(l.code) ? 'on' : ''}`}
                    onClick={() => toggleTarget(l.code)}
                  >
                    <Check
                      on={targets.has(l.code)}
                      onClick={() => toggleTarget(l.code)}
                    />
                    <div className="flag">{l.code.toUpperCase()}</div>
                    <div>
                      <div className="nm">{l.label}</div>
                      <div className="sub">{l.region}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="section-label" style={{ marginTop: 20 }}>
                Options
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 0',
                }}
              >
                <Switch on={skipExisting} onChange={setSkipExisting} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Skip already approved</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    Only translate fields that are missing or out-of-sync
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0 10px',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>Model override</div>
                <div className="field" style={{ minWidth: 180 }}>
                  <select value={model} onChange={(e) => setModel(e.target.value)}>
                    <option>gpt-4.1-mini</option>
                    <option>gpt-4.1</option>
                    <option>claude-sonnet-4-5</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="section-label" style={{ marginTop: 0 }}>
                Summary
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.8,
                  background: 'var(--bg-1)',
                }}
              >
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Documents
                  </span>
                  <span style={{ fontWeight: 500 }}>{sel.size}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Target languages
                  </span>
                  {Array.from(targets).map((c, i) => (
                    <span key={c}>
                      {i > 0 && ' '}
                      <LangChip code={c} />
                    </span>
                  ))}
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Total fields
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>~{fieldsEst}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Estimated time
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>
                    ~{Math.floor(timeEst / 60)}m {timeEst % 60}s
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Model
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{model}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 120, display: 'inline-block' }}>
                    Skip approved
                  </span>
                  <span>{skipExisting ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-3)',
                  marginTop: 12,
                  lineHeight: 1.6,
                }}
              >
                Jobs run in the background. You can keep working. Translations land in{' '}
                <strong>Needs review</strong> status by default — you'll review and approve before
                they sync back to Sanity.
              </div>
            </>
          )}
        </div>

        <div className="ft">
          <div style={{ display: 'flex', gap: 4 }}>
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: n <= step ? 'var(--ink)' : 'var(--bg-3)',
                }}
              />
            ))}
          </div>
          <span style={{ flex: 1 }} />
          {step > 1 && (
            <button className="btn" onClick={() => setStep((step - 1) as 1 | 2 | 3)}>
              Back
            </button>
          )}
          {step < 3 && (
            <button
              className="btn primary"
              onClick={() => setStep((step + 1) as 1 | 2 | 3)}
              disabled={step === 1 && sel.size === 0}
            >
              Continue
            </button>
          )}
          {step === 3 && (
            <button className="btn accent" onClick={onSubmit}>
              <IcPlay size={12} /> Start {sel.size * targets.size} jobs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
