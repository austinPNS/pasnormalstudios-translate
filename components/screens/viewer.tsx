'use client';

import { Fragment, useEffect, useState } from 'react';
import { LANGS } from '@/lib/data';
import { fetchDocument } from '@/lib/client-storage';
import { getStudioUrl } from '@/lib/studio-url';
import type { ImageItem, LangCode, SampleDoc, Tweaks } from '@/lib/types';
import { IcArrow, IcBlock, IcOpen, IcPlay } from '../icons';
import { FieldType, LangChip } from '../primitives';

interface Props {
  docId: string | null;
  target: LangCode;
  setTarget: (l: LangCode) => void;
  diffMode: Tweaks['diffMode'];
  setDiffMode: (m: Tweaks['diffMode']) => void;
  onBack: () => void;
}

export const ViewerScreen = ({ docId, target, setTarget, diffMode, setDiffMode, onBack }: Props) => {
  const [doc, setDoc] = useState<SampleDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);

  const reload = (id: string) => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchDocument(id)
      .then((d) => {
        if (!cancelled) setDoc(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unknown error');
          setDoc(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    if (!docId) {
      setDoc(null);
      setLoading(false);
      setError(null);
      return;
    }
    return reload(docId);
  }, [docId]);

  const onRun = async () => {
    if (!docId || running) return;
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ docId, target }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const n = json.translated ?? 0;
      setRunMsg(n === 0 ? 'Nothing to translate.' : `Translated ${n} field${n === 1 ? '' : 's'}.`);
      if (n > 0) reload(docId);
    } catch (e: unknown) {
      setRunMsg(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setRunning(false);
    }
  };

  if (loading) {
    return <ViewerStatus onBack={onBack} message="Loading document…" />;
  }
  if (error) {
    return <ViewerStatus onBack={onBack} message={`Failed to load document: ${error}`} />;
  }
  if (!doc) {
    return <ViewerStatus onBack={onBack} message="No document selected." />;
  }

  const targetLang = LANGS.find((l) => l.code === target)!;
  const isDiff = diffMode === 'diff';

  const allFields = doc.blocks.flatMap((b) => (b.kind === 'fields' ? b.fields : []));
  const withEn = allFields.filter((f) => f.en != null);
  const translated = withEn.filter((f) => f[target] != null).length;

  return (
    <>
      <div className="viewer-head">
        <div>
          <div className="crumb">
            <button onClick={onBack} style={{ color: 'var(--ink-3)' }}>
              Documents
            </button>{' '}
            <span style={{ color: 'var(--ink-4)' }}>/</span>{' '}
            <span style={{ color: 'var(--ink-3)' }}>Products</span>
          </div>
          <h2 style={{ marginTop: 2 }}>{doc.title}</h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <span className="doc-id">_id: {doc.id}</span>
            <span style={{ color: 'var(--ink-4)' }}>·</span>
            <span className="doc-id">_type: {doc.sanityType}</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a
            className="btn"
            href={getStudioUrl(doc.id, doc.sanityType)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <IcOpen /> Open in Sanity
          </a>
        </div>
      </div>

      <div className="viewer-subbar">
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Compare</span>
        <span className="lang-chip source">EN</span>
        <IcArrow size={12} />
        <div className="lang-switcher">
          {LANGS.filter((l) => !l.source).map((l) => (
            <button
              key={l.code}
              className={target === l.code ? 'active' : ''}
              onClick={() => setTarget(l.code)}
            >
              {l.code.toUpperCase()}
              <span
                className={`dot ${doc.blocks ? 'progress' : 'none'}`}
                style={{ width: 6, height: 6 }}
              />
            </button>
          ))}
        </div>
        <span style={{ color: 'var(--ink-4)', margin: '0 6px' }}>·</span>
        <div
          className="seg"
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: 2,
            background: 'var(--bg-1)',
            border: '1px solid var(--line)',
            borderRadius: 6,
          }}
        >
          {(['side', 'diff'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setDiffMode(m)}
              style={{
                padding: '3px 10px',
                borderRadius: 4,
                fontSize: 11.5,
                textTransform: 'capitalize',
                background: diffMode === m ? 'var(--bg)' : 'transparent',
                color: diffMode === m ? 'var(--ink)' : 'var(--ink-3)',
                fontWeight: diffMode === m ? 500 : 400,
                boxShadow: diffMode === m ? 'var(--shadow-1)' : 'none',
              }}
            >
              {m === 'side' ? 'Side-by-side' : m}
            </button>
          ))}
        </div>
        <span style={{ flex: 1 }} />
        <div className="diff-summary">
          <span>
            <span className="n">{translated}</span>/{allFields.length} fields
          </span>
        </div>
        {runMsg && (
          <span
            style={{
              fontSize: 12,
              color: runMsg.startsWith('Error') ? 'var(--err)' : 'var(--ink-3)',
              fontFamily: 'var(--mono)',
            }}
          >
            {runMsg}
          </span>
        )}
        <button
          className="btn primary sm"
          onClick={onRun}
          disabled={running || !docId}
          style={running ? { opacity: 0.6, cursor: 'wait' } : undefined}
        >
          <IcPlay /> {running ? 'Running…' : 'Run'}
        </button>
      </div>

      <div className="viewer-panes">
        <div className="pane-hd-row">
          <div className="pane-hd">
            <LangChip code="en" source />
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>English</span>
            <span style={{ color: 'var(--ink-4)' }}>· source</span>
          </div>
          <div className="pane-hd">
            <LangChip code={target} />
            <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{targetLang.label}</span>
            <span style={{ color: 'var(--ink-4)' }}>· target</span>
          </div>
        </div>

        <div className="viewer-rows">
          {doc.blocks.map((b, bi) => {
            if (b.kind === 'fields') {
              return (
                <Fragment key={bi}>
                  <div className="block-hd-row">
                    <IcBlock /> <span>{b.label}</span>
                  </div>
                  {b.fields.map((f, fi) => {
                    const en = f.en;
                    const tg = f[target];
                    const changed = isDiff && en != null && tg != null && en !== tg;
                    return (
                      <div key={fi} className="row">
                        <div className="row-label">
                          <span>{f.name}</span>
                          <FieldType t={f.type} />
                        </div>
                        <div className="row-cells">
                          <TextCell value={en} />
                          <TextCell
                            value={tg}
                            diff={isDiff && en != null ? en : null}
                            changed={changed}
                          />
                        </div>
                      </div>
                    );
                  })}
                </Fragment>
              );
            }
            if (b.kind === 'image') {
              return (
                <Fragment key={bi}>
                  <div className="block-hd-row">
                    <IcBlock /> <span>{b.label}</span>
                  </div>
                  {b.items.map((it, ii) => (
                    <div key={ii} className="row">
                      <div className="row-label">
                        <span>image[{ii}]</span>
                        <FieldType t="image + alt" />
                      </div>
                      <div className="row-cells">
                        <ImageCell item={it} lang="en" />
                        <ImageCell item={it} lang={target} />
                      </div>
                    </div>
                  ))}
                </Fragment>
              );
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
};

const TextCell = ({
  value,
  diff,
  changed,
}: {
  value: string | null;
  diff?: string | null;
  changed?: boolean;
}) => {
  if (value == null) return <div className="cell empty">— not translated —</div>;
  if (diff) {
    return (
      <div className={`cell ${changed ? 'changed' : ''}`}>
        <RenderDiff src={diff} target={value} />
      </div>
    );
  }
  return <div className="cell">{value}</div>;
};

const ImageCell = ({ item, lang }: { item: ImageItem; lang: LangCode }) => (
  <div className="cell">
    <div className="block-image">
      <div className="ph">{'PRODUCT\nSHOT'}</div>
      <div className="txt">
        <div className="alt">alt</div>
        <div>
          {item.alt[lang] || (
            <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>
              — not translated —
            </span>
          )}
        </div>
        <div className="alt" style={{ marginTop: 8 }}>
          caption
        </div>
        <div>{item.caption[lang]}</div>
      </div>
    </div>
  </div>
);

const ViewerStatus = ({ onBack, message }: { onBack: () => void; message: string }) => (
  <div style={{ padding: 40 }}>
    <button onClick={onBack} style={{ color: 'var(--ink-3)', fontSize: 12 }}>
      ← Documents
    </button>
    <div
      style={{
        marginTop: 16,
        color: 'var(--ink-3)',
        fontFamily: 'var(--mono)',
        fontSize: 12.5,
      }}
    >
      {message}
    </div>
  </div>
);

const RenderDiff = ({ src, target }: { src: string; target: string }) => {
  const srcWords = new Set(src.toLowerCase().split(/\s+/));
  const parts = target.split(/(\s+)/);
  return (
    <span style={{ whiteSpace: 'pre-wrap' }}>
      {parts.map((w, i) => {
        if (/^\s+$/.test(w)) return w;
        const key = w.toLowerCase().replace(/[.,;:!?"']/g, '');
        if (!srcWords.has(key) && key.length > 2 && !/^\d+$/.test(key)) {
          return (
            <span key={i} className="add">
              {w}
            </span>
          );
        }
        return <span key={i}>{w}</span>;
      })}
    </span>
  );
};
