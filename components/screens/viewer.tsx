'use client';

import { LANGS, SAMPLE_DOC } from '@/lib/data';
import type { Block, LangCode, SampleDoc, Tweaks } from '@/lib/types';
import {
  IcArrow,
  IcBlock,
  IcCheck,
  IcHistory,
  IcOpen,
  IcPlay,
  IcSync,
} from '../icons';
import { FieldType, LangChip } from '../primitives';

interface Props {
  docId: string | null;
  target: LangCode;
  setTarget: (l: LangCode) => void;
  diffMode: Tweaks['diffMode'];
  setDiffMode: (m: Tweaks['diffMode']) => void;
  onBack: () => void;
}

export const ViewerScreen = ({ target, setTarget, diffMode, setDiffMode, onBack }: Props) => {
  const doc = SAMPLE_DOC;
  const targetLang = LANGS.find((l) => l.code === target)!;

  const allFields = doc.blocks
    .filter((b): b is Extract<Block, { kind: 'fields' }> => b.kind === 'fields')
    .flatMap((b) => b.fields);
  const translated = allFields.filter((f) => f[target] != null).length;
  const missing = allFields.length - translated;

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
            <span className="doc-id">_type: product</span>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn">
            <IcHistory /> History
          </button>
          <button className="btn">
            <IcOpen /> Open in Sanity
          </button>
          <button className="btn accent">
            <IcSync /> Sync to Sanity
          </button>
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
          {(['side', 'overlay', 'diff'] as const).map((m) => (
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
          <span className="mod">{doc.blocks.length} blocks</span>
          <span className="rm">{missing} missing</span>
        </div>
        <button className="btn sm">
          <IcPlay /> Re-run
        </button>
        <button className="btn primary sm">
          <IcCheck /> Approve
        </button>
      </div>

      <div className={`viewer-panes ${diffMode === 'overlay' ? 'overlay' : ''}`}>
        <div className="pane">
            <div className="pane-hd">
              <LangChip code="en" source />
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>English</span>
              <span style={{ color: 'var(--ink-4)' }}>· source</span>
              <span className="meta">revised 2d ago</span>
            </div>
          <div className="pane-body">
            <DocRenderer doc={doc} lang="en" diffMode={diffMode} other={target} />
          </div>
        </div>
        {diffMode !== 'overlay' && (
          <div className="pane">
            <div className="pane-hd">
              <LangChip code={target} />
              <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{targetLang.label}</span>
              <span style={{ color: 'var(--ink-4)' }}>· target</span>
              <span className="meta">14:02 · gpt-4.1-mini</span>
            </div>
            <div className="pane-body">
              <DocRenderer doc={doc} lang={target} diffMode={diffMode} other="en" />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

const DocRenderer = ({
  doc,
  lang,
  diffMode,
  other,
}: {
  doc: SampleDoc;
  lang: LangCode;
  diffMode: Tweaks['diffMode'];
  other: LangCode;
}) => {
  return (
    <>
      {doc.blocks.map((b, bi) => {
        if (b.kind === 'fields') {
          return (
            <div key={bi}>
              <div className="block-hd">
                <IcBlock /> <span>{b.label}</span>
              </div>
              {b.fields.map((f, fi) => {
                const v = f[lang];
                const ov = f[other];
                const changed = diffMode === 'diff' && v !== ov && !!v && !!ov;
                return (
                  <div key={fi} className="field-row">
                    <div className="field-label">
                      <span>{f.name}</span>
                      <FieldType t={f.type} />
                    </div>
                    {v == null ? (
                      <div className="field-value empty">— not translated —</div>
                    ) : diffMode === 'diff' && lang !== 'en' && other === 'en' && ov ? (
                      <div className={`field-value ${changed ? 'changed' : ''}`}>
                        <RenderDiff src={ov} target={v} />
                      </div>
                    ) : (
                      <div className="field-value" style={{ whiteSpace: 'pre-wrap' }}>
                        {v}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }
        if (b.kind === 'image') {
          return (
            <div key={bi}>
              <div className="block-hd">
                <IcBlock /> <span>{b.label}</span>
              </div>
              {b.items.map((it, ii) => (
                <div key={ii} className="field-row">
                  <div className="field-label">
                    <span>image[{ii}]</span>
                    <FieldType t="image + alt" />
                  </div>
                  <div className="block-image">
                    <div className="ph">{'PRODUCT\nSHOT'}</div>
                    <div className="txt">
                      <div className="alt">alt</div>
                      <div>
                        {it.alt[lang] || (
                          <span style={{ color: 'var(--ink-4)', fontStyle: 'italic' }}>
                            — not translated —
                          </span>
                        )}
                      </div>
                      <div className="alt" style={{ marginTop: 8 }}>
                        caption
                      </div>
                      <div>{it.caption[lang]}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        }
        return null;
      })}
    </>
  );
};

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
