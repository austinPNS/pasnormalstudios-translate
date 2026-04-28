'use client';

import { useState } from 'react';
import { LANGS } from '@/lib/data';
import {
  bulkTranslate,
  type BulkTranslateDocResult,
  type BulkTranslateResponse,
} from '@/lib/client-storage';
import type { DocRecord, LangCode } from '@/lib/types';
import { IcPlay, IcX } from './icons';
import { Check, DocTypeBadge, LangChip } from './primitives';

interface Props {
  initialSel: string[];
  docs: DocRecord[];
  onClose: () => void;
  onDone: (response: BulkTranslateResponse) => void;
}

interface RunningState {
  status: 'running';
  phase: string;
  done: number;
  total: number;
  results: BulkTranslateDocResult[];
}

type RunState =
  | { status: 'idle' }
  | RunningState
  | { status: 'done'; response: BulkTranslateResponse }
  | { status: 'error'; message: string };

export const BulkModal = ({ initialSel, docs, onClose, onDone }: Props) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [sel, setSel] = useState<Set<string>>(new Set(initialSel));
  const [targets, setTargets] = useState<Set<Exclude<LangCode, 'en'>>>(
    new Set<Exclude<LangCode, 'en'>>(['de'])
  );
  const [run, setRun] = useState<RunState>({ status: 'idle' });

  const selectedDocs = docs.filter((d) => sel.has(d.id));

  const toggleDoc = (id: string) => {
    const n = new Set(sel);
    n.has(id) ? n.delete(id) : n.add(id);
    setSel(n);
  };
  const toggleTarget = (code: Exclude<LangCode, 'en'>) => {
    const n = new Set(targets);
    n.has(code) ? n.delete(code) : n.add(code);
    setTargets(n);
  };

  const submit = async () => {
    setRun({
      status: 'running',
      phase: 'Starting…',
      done: 0,
      total: sel.size * targets.size,
      results: [],
    });
    try {
      const response = await bulkTranslate(
        Array.from(sel),
        Array.from(targets),
        (e) => {
          if (e.type === 'phase') {
            setRun((s) =>
              s.status === 'running' ? { ...s, phase: e.message } : s
            );
          } else if (e.type === 'start') {
            setRun((s) =>
              s.status === 'running'
                ? { ...s, total: e.total, phase: 'Translating…' }
                : s
            );
          } else if (e.type === 'progress') {
            setRun((s) =>
              s.status === 'running'
                ? {
                    ...s,
                    done: e.done,
                    total: e.total,
                    results: [...s.results, e.result],
                  }
                : s
            );
          }
        }
      );
      setRun({ status: 'done', response });
    } catch (e) {
      setRun({
        status: 'error',
        message: e instanceof Error ? e.message : 'Unknown error',
      });
    }
  };

  const totalJobs = sel.size * targets.size;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="hd">
          <div>
            <h2>Bulk Translate</h2>
            <div className="sub">
              {run.status === 'running' && 'Translating…'}
              {run.status === 'done' && 'Result'}
              {run.status === 'error' && 'Error'}
              {run.status === 'idle' &&
                `Step ${step} of 2 — ${
                  step === 1 ? 'review selected documents' : 'target languages'
                }`}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn ghost icon" onClick={onClose}>
            <IcX />
          </button>
        </div>

        <div className="bd">
          {run.status === 'idle' && step === 1 && (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)', marginBottom: 10 }}>
                {sel.size} document{sel.size === 1 ? '' : 's'} selected
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  maxHeight: 320,
                  overflow: 'auto',
                }}
              >
                {selectedDocs.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--line)',
                      background: 'var(--accent-bg)',
                    }}
                  >
                    <Check on={true} onClick={() => toggleDoc(d.id)} />
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
                {selectedDocs.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: 'var(--ink-4)',
                      textAlign: 'center',
                    }}
                  >
                    No documents selected.
                  </div>
                )}
              </div>
            </>
          )}

          {run.status === 'idle' && step === 2 && (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                Choose target languages
              </div>
              <div className="lang-grid">
                {LANGS.filter((l) => !l.source).map((l) => (
                  <div
                    key={l.code}
                    className={`lang-cb ${targets.has(l.code as Exclude<LangCode, 'en'>) ? 'on' : ''}`}
                    onClick={() => toggleTarget(l.code as Exclude<LangCode, 'en'>)}
                  >
                    <Check
                      on={targets.has(l.code as Exclude<LangCode, 'en'>)}
                      onClick={() => toggleTarget(l.code as Exclude<LangCode, 'en'>)}
                    />
                    <div className="flag">{l.code.toUpperCase()}</div>
                    <div>
                      <div className="nm">{l.label}</div>
                      <div className="sub">{l.region}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {run.status === 'running' && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: 'var(--bg-3)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${run.total === 0 ? 0 : (run.done / run.total) * 100}%`,
                      height: '100%',
                      background: 'var(--ink)',
                      transition: 'width 120ms ease-out',
                    }}
                  />
                </div>
                <div
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    minWidth: 56,
                    textAlign: 'right',
                  }}
                >
                  {run.done}/{run.total}
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--ink-3)',
                  marginBottom: 10,
                }}
              >
                {run.phase}
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  maxHeight: 240,
                  overflow: 'auto',
                }}
              >
                {run.results.length === 0 && (
                  <div
                    style={{
                      padding: 16,
                      fontSize: 12,
                      color: 'var(--ink-4)',
                      textAlign: 'center',
                    }}
                  >
                    Waiting for first result…
                  </div>
                )}
                {run.results.map((r, i) => (
                  <div
                    key={`${r.docId}-${r.target}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--line)',
                      fontSize: 12,
                    }}
                  >
                    <LangChip code={r.target} />
                    <code style={{ fontFamily: 'var(--mono)', flex: 1, minWidth: 0 }}>
                      {r.docId}
                    </code>
                    {r.status === 'translated' && (
                      <span style={{ color: 'var(--ok, #2a8)' }}>
                        {r.fieldsSet} field{r.fieldsSet === 1 ? '' : 's'}
                      </span>
                    )}
                    {r.status === 'nothing' && (
                      <span style={{ color: 'var(--ink-4)' }}>nothing missing</span>
                    )}
                    {r.status === 'error' && (
                      <span style={{ color: 'var(--err, #c33)' }}>error</span>
                    )}
                  </div>
                ))}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--ink-4)',
                  marginTop: 10,
                }}
              >
                Do not close the window.
              </div>
            </>
          )}

          {run.status === 'done' && (
            <>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.8,
                  background: 'var(--bg-1)',
                  marginBottom: 12,
                }}
              >
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 160, display: 'inline-block' }}>
                    Mutations applied
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{run.response.mutationsApplied}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 160, display: 'inline-block' }}>
                    Total fields set
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>{run.response.totalFieldsSet}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--ink-3)', width: 160, display: 'inline-block' }}>
                    Cache reads / writes
                  </span>
                  <span style={{ fontFamily: 'var(--mono)' }}>
                    {run.response.usage.cacheReadTokens} / {run.response.usage.cacheCreationTokens}
                  </span>
                </div>
              </div>
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  maxHeight: 240,
                  overflow: 'auto',
                }}
              >
                {run.response.results.map((r, i) => (
                  <div
                    key={`${r.docId}-${r.target}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--line)',
                      fontSize: 12,
                    }}
                  >
                    <LangChip code={r.target} />
                    <code style={{ fontFamily: 'var(--mono)', flex: 1, minWidth: 0 }}>
                      {r.docId}
                    </code>
                    {r.status === 'translated' && (
                      <span style={{ color: 'var(--ok, #2a8)' }}>
                        {r.fieldsSet} field{r.fieldsSet === 1 ? '' : 's'}
                      </span>
                    )}
                    {r.status === 'nothing' && (
                      <span style={{ color: 'var(--ink-4)' }}>nothing missing</span>
                    )}
                    {r.status === 'error' && (
                      <span style={{ color: 'var(--err, #c33)' }}>error: {r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {run.status === 'error' && (
            <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--err, #c33)' }}>
              {run.message}
            </div>
          )}
        </div>

        <div className="ft">
          {run.status === 'idle' && (
            <>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1, 2].map((n) => (
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
              {step === 2 && (
                <button className="btn" onClick={() => setStep(1)}>
                  Back
                </button>
              )}
              {step === 1 && (
                <button
                  className="btn primary"
                  onClick={() => setStep(2)}
                  disabled={sel.size === 0}
                >
                  Continue
                </button>
              )}
              {step === 2 && (
                <button
                  className="btn accent"
                  onClick={submit}
                  disabled={targets.size === 0}
                >
                  <IcPlay size={12} /> Translate {totalJobs} job
                  {totalJobs === 1 ? '' : 's'}
                </button>
              )}
            </>
          )}
          {run.status === 'running' && (
            <>
              <span style={{ flex: 1 }} />
              <button className="btn" disabled>
                Translating…
              </button>
            </>
          )}
          {run.status === 'done' && (
            <>
              <span style={{ flex: 1 }} />
              <button
                className="btn primary"
                onClick={() => onDone(run.response)}
              >
                Done
              </button>
            </>
          )}
          {run.status === 'error' && (
            <>
              <span style={{ flex: 1 }} />
              <button className="btn" onClick={() => setRun({ status: 'idle' })}>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
