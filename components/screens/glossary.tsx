'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchGlossaryEntries,
  saveGlossaryEntries,
} from '@/lib/client-storage';
import {
  CATEGORY_NOTE,
  PROTECTED_CATEGORIES,
  type ProtectedCategory,
} from '@/lib/protected-terms';
import type { GlossaryRow } from '@/lib/types';
import { IcPlus, IcSearch, IcX } from '../icons';
import { Seg } from '../primitives';

type ScopeFilter = 'all' | ProtectedCategory;
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const buildRow = (src: string, scope: ProtectedCategory): GlossaryRow => ({
  src,
  de: src,
  fr: src,
  it: src,
  kind: 'dnt',
  scope,
  notes: CATEGORY_NOTE[scope],
});

interface AddTermModalProps {
  existingTerms: Set<string>;
  saving: boolean;
  onClose: () => void;
  onSave: (src: string, category: ProtectedCategory) => Promise<void>;
}

const AddTermModal = ({
  existingTerms,
  saving,
  onClose,
  onSave,
}: AddTermModalProps) => {
  const [src, setSrc] = useState('');
  const [category, setCategory] = useState<ProtectedCategory>('Product');

  const trimmed = src.trim();
  const duplicate = !!trimmed && existingTerms.has(trimmed.toLowerCase());
  const canSave = !!trimmed && !duplicate && !saving;

  const submit = () => {
    if (!canSave) return;
    onSave(trimmed, category);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="hd">
          <div>
            <h2>Add protected term</h2>
            <div className="sub">Stays unchanged in DE, FR, and IT translations.</div>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn ghost icon" onClick={onClose} aria-label="Close">
            <IcX />
          </button>
        </div>

        <div className="bd" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label
              htmlFor="add-term-src"
              style={{
                display: 'block',
                fontSize: 11.5,
                color: 'var(--ink-3)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Term
            </label>
            <input
              id="add-term-src"
              autoFocus
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="e.g. Mechanism Pro"
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: 'var(--bg-1)',
                border: '1px solid var(--line)',
                borderRadius: 6,
                outline: 'none',
              }}
            />
            {duplicate && (
              <div style={{ fontSize: 11.5, color: 'var(--err, #c33)', marginTop: 6 }}>
                Already in the glossary.
              </div>
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 11.5,
                color: 'var(--ink-3)',
                marginBottom: 6,
                textTransform: 'uppercase',
                letterSpacing: 0.4,
              }}
            >
              Category
            </label>
            <div
              role="radiogroup"
              style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}
            >
              {PROTECTED_CATEGORIES.map((c) => {
                const on = c === category;
                return (
                  <button
                    key={c}
                    role="radio"
                    aria-checked={on}
                    onClick={() => setCategory(c)}
                    className={`btn${on ? ' primary' : ''}`}
                    type="button"
                  >
                    {c}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-4)', marginTop: 8 }}>
              {CATEGORY_NOTE[category]}
            </div>
          </div>
        </div>

        <div className="ft">
          <span style={{ flex: 1 }} />
          <button className="btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn primary" onClick={submit} disabled={!canSave}>
            {saving ? 'Saving…' : 'Add term'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const GlossaryScreen = () => {
  const [scope, setScope] = useState<ScopeFilter>('all');
  const [q, setQ] = useState('');
  const [entries, setEntries] = useState<GlossaryRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchGlossaryEntries()
      .then((rows) => {
        if (cancelled) return;
        setEntries(rows);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return entries.filter((g) => {
      if (scope !== 'all' && g.scope !== scope) return false;
      if (needle && !g.src.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [entries, scope, q]);

  const existingTerms = useMemo(
    () => new Set(entries.map((g) => g.src.toLowerCase())),
    [entries]
  );

  const persist = async (next: GlossaryRow[]) => {
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveGlossaryEntries(next);
      setEntries(next);
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (e) {
      setSaveState('error');
      setSaveError(e instanceof Error ? e.message : 'Save failed');
      throw e;
    }
  };

  const handleAdd = async (src: string, category: ProtectedCategory) => {
    const next = [buildRow(src, category), ...entries];
    try {
      await persist(next);
      setAdding(false);
    } catch {
      // keep modal open on failure so user can retry
    }
  };

  const statusLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
      ? 'Saved to data/protected-terms.json'
      : saveState === 'error'
      ? saveError ?? 'Save failed'
      : loaded
      ? `${entries.length} terms`
      : 'Loading…';

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Glossary</h1>
          <div
            className="sub"
            style={{ color: saveState === 'error' ? 'var(--err)' : undefined }}
          >
            {statusLabel}
          </div>
        </div>
        <div className="spacer" />
        <div className="page-actions">
          <button className="btn primary" onClick={() => setAdding(true)}>
            <IcPlus /> Add term
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <IcSearch size={13} />
          <input
            placeholder="Search terms…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Seg<ScopeFilter>
          value={scope}
          onChange={setScope}
          options={[
            { v: 'all', label: 'Any scope' },
            { v: 'Company', label: 'Companies' },
            { v: 'Collection', label: 'Collections' },
            { v: 'Phrase', label: 'Phrases' },
            { v: 'Color', label: 'Colors' },
            { v: 'Product', label: 'Products' },
          ]}
        />
      </div>

      {adding && (
        <AddTermModal
          existingTerms={existingTerms}
          saving={saveState === 'saving'}
          onClose={() => setAdding(false)}
          onSave={handleAdd}
        />
      )}

      <div className="glossary-wrap">
        <table className="glossary-table">
          <thead>
            <tr>
              <th style={{ width: 320 }}>Term</th>
              <th style={{ width: 140 }}>Category</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={`${g.src}-${i}`}>
                <td className="term">{g.src}</td>
                <td>
                  <span className="chip sq">{g.scope}</span>
                </td>
                <td className="notes">
                  {g.notes || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
