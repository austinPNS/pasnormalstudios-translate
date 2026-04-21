'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  fetchGlossaryEntries,
  saveGlossaryEntries,
} from '@/lib/client-storage';
import { LANGS } from '@/lib/data';
import { PROTECTED_GLOSSARY } from '@/lib/protected-terms';
import type { GlossaryRow } from '@/lib/types';
import { IcMore, IcOpen, IcPlus, IcSearch, IcX } from '../icons';
import { Seg } from '../primitives';

type Kind = 'all' | 'dnt' | 'brand';
type Scope = 'all' | 'Collection' | 'Phrase' | 'Color' | 'Product' | 'Other';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const KNOWN_SCOPES = new Set(['Collection', 'Phrase', 'Color', 'Product']);

const EMPTY_DRAFT: GlossaryRow = {
  src: '',
  de: '',
  fr: '',
  it: '',
  kind: 'brand',
  scope: 'Product',
  notes: '',
};

export const GlossaryScreen = () => {
  const [kind, setKind] = useState<Kind>('all');
  const [scope, setScope] = useState<Scope>('all');
  const [q, setQ] = useState('');
  const [userEntries, setUserEntries] = useState<GlossaryRow[]>([]);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<GlossaryRow>(EMPTY_DRAFT);

  // Hydrate user-added glossary entries from data/glossary.json.
  useEffect(() => {
    let cancelled = false;
    fetchGlossaryEntries()
      .then((entries) => {
        if (!cancelled) setUserEntries(entries);
      })
      .catch(() => {
        /* keep empty on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const allEntries = useMemo<GlossaryRow[]>(() => {
    const userKeys = new Set(userEntries.map((g) => g.src.toLowerCase()));
    return [
      ...userEntries,
      ...PROTECTED_GLOSSARY.filter((g) => !userKeys.has(g.src.toLowerCase())),
    ];
  }, [userEntries]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return allEntries.filter((g) => {
      if (kind !== 'all' && g.kind !== kind) return false;
      if (scope !== 'all') {
        if (scope === 'Other') {
          if (KNOWN_SCOPES.has(g.scope)) return false;
        } else if (g.scope !== scope) return false;
      }
      if (needle && !g.src.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [allEntries, kind, scope, q]);

  const persist = async (next: GlossaryRow[]) => {
    setSaveState('saving');
    setSaveError(null);
    try {
      await saveGlossaryEntries(next);
      setUserEntries(next);
      setSaveState('saved');
      setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (e) {
      setSaveState('error');
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const onSubmitDraft = async () => {
    if (!draft.src.trim()) return;
    const clean: GlossaryRow = {
      ...draft,
      src: draft.src.trim(),
      de: draft.de.trim() || draft.src.trim(),
      fr: draft.fr.trim() || draft.src.trim(),
      it: draft.it.trim() || draft.src.trim(),
      scope: draft.scope.trim() || 'Product',
      notes: draft.notes?.trim() || undefined,
    };
    const filtered = userEntries.filter(
      (g) => g.src.toLowerCase() !== clean.src.toLowerCase()
    );
    await persist([clean, ...filtered]);
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  };

  const onRemoveUserEntry = async (src: string) => {
    const next = userEntries.filter((g) => g.src !== src);
    await persist(next);
  };

  const isUserEntry = (src: string) =>
    userEntries.some((g) => g.src.toLowerCase() === src.toLowerCase());

  const statusLabel =
    saveState === 'saving'
      ? 'Saving…'
      : saveState === 'saved'
      ? 'Saved to data/glossary.json'
      : saveState === 'error'
      ? saveError ?? 'Save failed'
      : `${allEntries.length} terms · ${userEntries.length} edited locally`;

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
          <button className="btn">
            <IcOpen /> Import CSV
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setDraft(EMPTY_DRAFT);
              setAdding(true);
            }}
          >
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
        <Seg<Kind>
          value={kind}
          onChange={setKind}
          options={[
            { v: 'all', label: 'All' },
            { v: 'dnt', label: 'Do not translate' },
            { v: 'brand', label: 'Preferred terms' },
          ]}
        />
        <Seg<Scope>
          value={scope}
          onChange={setScope}
          options={[
            { v: 'all', label: 'Any scope' },
            { v: 'Collection', label: 'Collections' },
            { v: 'Phrase', label: 'Phrases' },
            { v: 'Color', label: 'Colors' },
            { v: 'Product', label: 'Products' },
            { v: 'Other', label: 'Other' },
          ]}
        />
      </div>

      {adding && (
        <div
          style={{
            margin: '0 24px 12px',
            padding: 12,
            border: '1px solid var(--line)',
            borderRadius: 6,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr 120px 120px 1fr auto',
            gap: 8,
            alignItems: 'end',
          }}
        >
          <label style={{ fontSize: 11 }}>
            Source (EN)
            <input
              value={draft.src}
              onChange={(e) => setDraft({ ...draft, src: e.target.value })}
              placeholder="e.g. Mechanism Pro"
            />
          </label>
          <label style={{ fontSize: 11 }}>
            DE
            <input
              value={draft.de}
              onChange={(e) => setDraft({ ...draft, de: e.target.value })}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            FR
            <input
              value={draft.fr}
              onChange={(e) => setDraft({ ...draft, fr: e.target.value })}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            IT
            <input
              value={draft.it}
              onChange={(e) => setDraft({ ...draft, it: e.target.value })}
            />
          </label>
          <label style={{ fontSize: 11 }}>
            Rule
            <select
              value={draft.kind}
              onChange={(e) =>
                setDraft({ ...draft, kind: e.target.value as 'dnt' | 'brand' })
              }
            >
              <option value="brand">Preferred</option>
              <option value="dnt">Do not translate</option>
            </select>
          </label>
          <label style={{ fontSize: 11 }}>
            Scope
            <select
              value={draft.scope}
              onChange={(e) => setDraft({ ...draft, scope: e.target.value })}
            >
              <option>Product</option>
              <option>Collection</option>
              <option>Phrase</option>
              <option>Color</option>
              <option>Editorial</option>
              <option>All</option>
            </select>
          </label>
          <label style={{ fontSize: 11 }}>
            Notes
            <input
              value={draft.notes ?? ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
            />
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              className="btn"
              onClick={() => {
                setAdding(false);
                setDraft(EMPTY_DRAFT);
              }}
            >
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={onSubmitDraft}
              disabled={!draft.src.trim() || saveState === 'saving'}
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="glossary-wrap">
        <table className="glossary-table">
          <thead>
            <tr>
              <th style={{ width: 220 }}>Source (EN)</th>
              {LANGS.filter((l) => !l.source).map((l) => (
                <th key={l.code}>{l.label}</th>
              ))}
              <th style={{ width: 100 }}>Rule</th>
              <th style={{ width: 100 }}>Scope</th>
              <th>Notes</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {rows.map((g, i) => (
              <tr key={`${g.src}-${i}`}>
                <td className="term">{g.src}</td>
                <td className="dnt">{g.de}</td>
                <td className="dnt">{g.fr}</td>
                <td className="dnt">{g.it}</td>
                <td>
                  <span className={`tag ${g.kind}`}>
                    {g.kind === 'dnt' ? 'Do not translate' : 'Preferred'}
                  </span>
                </td>
                <td>
                  <span className="chip sq">{g.scope}</span>
                </td>
                <td className="notes">
                  {g.notes || <span style={{ color: 'var(--ink-4)' }}>—</span>}
                </td>
                <td>
                  {isUserEntry(g.src) ? (
                    <button
                      className="btn ghost icon"
                      title="Remove local entry"
                      onClick={() => onRemoveUserEntry(g.src)}
                    >
                      <IcX size={12} />
                    </button>
                  ) : (
                    <IcMore />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
