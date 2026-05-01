'use client';

import { useEffect, useState } from 'react';
import { LANGS } from '@/lib/data';
import type { DocRecord, LangCode, Tweaks } from '@/lib/types';
import { getStudioUrl } from '@/lib/studio-url';
import {
  IcArrow,
  IcChevron,
  IcMore,
  IcOpen,
  IcPlus,
  IcSearch,
  IcX,
} from '../icons';
import {
  Check,
  DocTypeBadge,
  LangChip,
  Seg,
  StatusDot,
} from '../primitives';

export type DocsFilter = 'product' | 'uberProduct' | 'category' | 'collection' | 'feature' | 'frontpage' | 'hero';

interface Props {
  layout: Tweaks['layout'];
  docs: DocRecord[];
  loading: boolean;
  error: string | null;
  onOpenDoc: (id: string) => void;
  onBulk: (ids: string[]) => void;
  filter: DocsFilter;
  setFilter: (f: DocsFilter) => void;
  search: string;
  setSearch: (s: string) => void;
}

export const DocumentsScreen = ({ layout, docs, loading, error, onOpenDoc, onBulk, filter, setFilter, search, setSearch }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleAll = () => {
    if (selected.size === docs.length) setSelected(new Set());
    else setSelected(new Set(docs.map((d) => d.id)));
  };

  const filtered = docs.filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (!Object.values(d.langs).some((l) => l.status === 'none')) return false;
    return d.type === filter;
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Documents</h1>
          <div className="sub">
            {loading ? 'Loading…' : `${docs.length} documents · 4 languages · source EN`}
          </div>
        </div>
        <div className="spacer" />
      </div>

      <div className="toolbar">
        <div className="search">
          <IcSearch size={13} />
          <input
            placeholder="Filter documents by title, slug, _id…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filters">
          <Seg<DocsFilter>
            value={filter}
            onChange={setFilter}
            options={[
              { v: 'product', label: 'Product' },
              { v: 'uberProduct', label: 'Uber Product' },
              { v: 'category', label: 'Category' },
              { v: 'collection', label: 'Collection' },
              { v: 'feature', label: 'Product Feature' },
              { v: 'frontpage', label: 'Front page' },
              { v: 'hero', label: 'Hero' },
            ]}
          />
        </div>
        <div className="spacer" />
      </div>

      {error && (
        <div
          style={{
            margin: '0 24px 16px',
            padding: '12px 14px',
            border: '1px solid var(--line)',
            borderRadius: 6,
            fontSize: 12.5,
            color: 'var(--ink-3)',
            fontFamily: 'var(--mono)',
          }}
        >
          Failed to load documents: {error}
        </div>
      )}

      {layout === 'matrix' && (
        <DocsMatrix
          docs={filtered}
          selected={selected}
          onToggle={toggle}
          onToggleAll={toggleAll}
          onOpen={onOpenDoc}
        />
      )}
      {layout === 'kanban' && <DocsKanban docs={filtered} onOpen={onOpenDoc} />}
      {layout === 'list' && (
        <DocsList docs={filtered} selected={selected} onToggle={toggle} onOpen={onOpenDoc} />
      )}

      {selected.size > 0 && (
        <div className="selection-bar">
          <span className="count">{selected.size} selected</span>
          <span className="sep" />
          <button className="btn accent" onClick={() => onBulk(Array.from(selected))}>
            <IcPlus size={13} /> Bulk Translate
          </button>
          <button
            className="btn"
            onClick={() => setSelected(new Set())}
            aria-label="Clear"
          >
            <IcX size={13} />
          </button>
        </div>
      )}
    </>
  );
};

interface MenuPos {
  id: string;
  sanityType: string;
  x: number;
  y: number;
}

const RowActionMenu = ({
  pos,
  onClose,
}: {
  pos: MenuPos;
  onClose: () => void;
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onDown = () => onClose();
    window.addEventListener('keydown', onKey);
    // Use mousedown so clicks anywhere outside (incl. the same icon to toggle) close us first.
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [onClose]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(pos.id);
      setCopied(true);
      setTimeout(onClose, 600);
    } catch {
      onClose();
    }
  };

  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 10px',
    width: '100%',
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
    fontSize: 13,
    textAlign: 'left',
    color: 'var(--ink)',
    textDecoration: 'none',
    borderRadius: 4,
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      style={{
        position: 'fixed',
        top: pos.y,
        left: pos.x,
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 6,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        zIndex: 200,
        minWidth: 180,
        padding: 4,
      }}
    >
      <button type="button" onClick={onCopy} style={itemStyle}>
        {copied ? 'Copied!' : 'Copy ID'}
      </button>
      <a
        href={getStudioUrl(pos.id, pos.sanityType)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        style={itemStyle}
      >
        <span style={{ flex: 1 }}>Open in Sanity</span>
        <IcOpen size={12} />
      </a>
    </div>
  );
};

const DocsMatrix = ({
  docs,
  selected,
  onToggle,
  onToggleAll,
  onOpen,
}: {
  docs: DocRecord[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onOpen: (id: string) => void;
}) => {
  const allOn = selected.size === docs.length && docs.length > 0;
  const some = selected.size > 0 && !allOn;
  const [menu, setMenu] = useState<MenuPos | null>(null);

  const openMenu = (e: React.MouseEvent, id: string, sanityType: string) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    // Anchor below-right of the icon. Clamp within viewport.
    const menuW = 180;
    const x = Math.min(rect.right - menuW, window.innerWidth - menuW - 8);
    const y = rect.bottom + 4;
    setMenu({ id, sanityType, x: Math.max(8, x), y });
  };

  return (
    <div className="matrix-wrap">
      <table className="matrix">
        <thead>
          <tr>
            <th className="sel">
              <Check on={allOn} indeterminate={some} onClick={onToggleAll} />
            </th>
            <th>Document</th>
            <th className="type">Type</th>
            {LANGS.map((l) => (
              <th key={l.code} className={`lang ${l.source ? 'source' : ''}`}>
                <LangChip code={l.code} source={l.source} />
              </th>
            ))}
            <th className="updated">Updated</th>
            <th className="actions" />
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr
              key={d.id}
              className={selected.has(d.id) ? 'selected' : ''}
              onClick={() => onOpen(d.id)}
            >
              <td className="sel">
                <Check on={selected.has(d.id)} onClick={() => onToggle(d.id)} />
              </td>
              <td className="title">
                {d.title}
                <span className="id">_id: {d.id}</span>
              </td>
              <td className="type">
                <DocTypeBadge type={d.type} />
              </td>
              {LANGS.map((l) => {
                const ls = d.langs[l.code];
                return (
                  <td key={l.code} className={`lang ${l.source ? 'source' : ''}`}>
                    <span className="cell">
                      <StatusDot status={ls.status} pct={ls.pct} />
                    </span>
                  </td>
                );
              })}
              <td className="updated">{d.updated}</td>
              <td className="actions">
                <button
                  type="button"
                  className="row-action-btn"
                  aria-label="Row actions"
                  onClick={(e) => openMenu(e, d.id, d.sanityType)}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: 4,
                    cursor: 'pointer',
                    color: 'inherit',
                    display: 'inline-flex',
                  }}
                >
                  <IcMore />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {menu && <RowActionMenu pos={menu} onClose={() => setMenu(null)} />}
    </div>
  );
};

const DocsList = ({
  docs,
  selected,
  onToggle,
  onOpen,
}: {
  docs: DocRecord[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}) => (
  <div style={{ padding: '0 24px 24px' }}>
    {docs.map((d) => {
      const missing = LANGS.filter((l) => !l.source && d.langs[l.code].status === 'none').length;
      const inReview = LANGS.filter((l) => !l.source && d.langs[l.code].status === 'review').length;
      return (
        <div
          key={d.id}
          onClick={() => onOpen(d.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '14px 12px',
            borderBottom: '1px solid var(--line)',
            cursor: 'pointer',
          }}
        >
          <Check on={selected.has(d.id)} onClick={() => onToggle(d.id)} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 500, marginBottom: 3 }}>{d.title}</div>
            <div className="meta-line">
              <DocTypeBadge type={d.type} />
              <span className="dotsep">·</span>
              <span>{d.id}</span>
              <span className="dotsep">·</span>
              <span>
                updated {d.updated} by {d.author}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {LANGS.map((l) => (
              <div
                key={l.code}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  minWidth: 38,
                }}
              >
                <LangChip code={l.code} source={l.source} />
                <StatusDot status={d.langs[l.code].status} pct={d.langs[l.code].pct} />
              </div>
            ))}
          </div>
          <div style={{ width: 110, textAlign: 'right' }}>
            {missing > 0 && (
              <span className="chip" style={{ color: 'var(--ink-4)' }}>
                {missing} missing
              </span>
            )}
            {inReview > 0 && (
              <span className="status-pill review">
                <span className="dot review" />
                {inReview} review
              </span>
            )}
          </div>
          <IcChevron size={14} />
        </div>
      );
    })}
  </div>
);

const DocsKanban = ({
  docs,
  onOpen,
}: {
  docs: DocRecord[];
  onOpen: (id: string) => void;
}) => {
  const cols: { status: DocRecord['langs'][LangCode]['status']; label: string }[] = [
    { status: 'none', label: 'Not translated' },
    { status: 'progress', label: 'In progress' },
    { status: 'review', label: 'Needs review' },
    { status: 'stale', label: 'Out of sync' },
    { status: 'approved', label: 'Approved' },
  ];
  const cards: { doc: DocRecord; lang: (typeof LANGS)[number]; state: DocRecord['langs'][LangCode] }[] = [];
  docs.forEach((d) => {
    LANGS.filter((l) => !l.source).forEach((l) => {
      cards.push({ doc: d, lang: l, state: d.langs[l.code] });
    });
  });

  return (
    <div className="kanban">
      {cols.map((c) => {
        const bucket = cards.filter((x) => x.state.status === c.status);
        return (
          <div key={c.status} className="col">
            <div className="col-hd">
              <span className={`dot ${c.status}`} />
              <span>{c.label}</span>
              <span className="count">{bucket.length}</span>
            </div>
            <div className="col-body">
              {bucket.slice(0, 10).map((x, i) => (
                <div key={i} className="card" onClick={() => onOpen(x.doc.id)}>
                  <div className="t">{x.doc.title}</div>
                  <div className="meta">
                    <DocTypeBadge type={x.doc.type} />
                    <span className="dotsep">·</span>
                    <span>{x.doc.updated}</span>
                  </div>
                  <div className="langs">
                    <LangChip code="en" source />
                    <IcArrow size={10} />
                    <LangChip code={x.lang.code} />
                    {x.state.status === 'progress' && (
                      <span className="chip mono" style={{ marginLeft: 'auto' }}>
                        {x.state.pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {bucket.length === 0 && (
                <div
                  style={{
                    padding: '16px 8px',
                    fontSize: 11,
                    color: 'var(--ink-4)',
                    textAlign: 'center',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
