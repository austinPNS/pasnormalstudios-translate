'use client';

import { useState } from 'react';
import { GLOSSARY, LANGS } from '@/lib/data';
import { IcMore, IcOpen, IcPlus, IcSearch } from '../icons';
import { Seg } from '../primitives';

type Kind = 'all' | 'dnt' | 'brand';

export const GlossaryScreen = () => {
  const [kind, setKind] = useState<Kind>('all');
  const rows = GLOSSARY.filter((g) => kind === 'all' || g.kind === kind);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Glossary</h1>
          <div className="sub">{GLOSSARY.length} terms · shared across all languages</div>
        </div>
        <div className="spacer" />
        <div className="page-actions">
          <button className="btn">
            <IcOpen /> Import CSV
          </button>
          <button className="btn primary">
            <IcPlus /> Add term
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <IcSearch size={13} />
          <input placeholder="Search terms…" />
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
      </div>

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
              <tr key={i}>
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
                  <IcMore />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
