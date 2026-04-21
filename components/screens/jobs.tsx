'use client';

import { useEffect, useState } from 'react';
import { JOBS } from '@/lib/data';
import { IcFilter, IcHistory, IcMore, IcSearch } from '../icons';
import { LangChip, Seg, StatusPill } from '../primitives';

export const JobsScreen = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1200);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Jobs</h1>
          <div className="sub">Translation runs — recent & active</div>
        </div>
        <div className="spacer" />
        <div className="page-actions">
          <button className="btn">
            <IcHistory /> View all history
          </button>
          <button className="btn">
            <IcFilter /> Filter
          </button>
        </div>
      </div>

      <div className="toolbar">
        <div className="search">
          <IcSearch size={13} />
          <input placeholder="Filter jobs…" />
        </div>
        <Seg
          value="active"
          onChange={() => {}}
          options={[
            { v: 'active', label: 'Active' },
            { v: 'today', label: 'Today' },
            { v: 'week', label: 'This week' },
            { v: 'all', label: 'All' },
          ]}
        />
      </div>

      <div style={{ padding: '0 24px' }}>
        <table className="jobs-table">
          <thead>
            <tr>
              <th style={{ width: 28 }} />
              <th>Document</th>
              <th style={{ width: 80 }}>Source</th>
              <th style={{ width: 140 }}>Targets</th>
              <th style={{ width: 180 }}>Progress</th>
              <th style={{ width: 140 }}>Status</th>
              <th style={{ width: 140 }}>Started</th>
              <th style={{ width: 32 }} />
            </tr>
          </thead>
          <tbody>
            {JOBS.map((j) => {
              const pct = Math.round((j.done / j.fields) * 100);
              const livePct =
                j.status === 'progress' ? Math.min(100, pct + (tick % 4)) : pct;
              return (
                <tr key={j.id}>
                  <td>
                    {j.status === 'progress' && (
                      <span
                        className="dot progress"
                        style={{ animation: 'pulse 1.2s infinite' }}
                      />
                    )}
                    {j.status === 'approved' && <span className="dot approved" />}
                    {j.status === 'review' && <span className="dot review" />}
                    {j.status === 'error' && <span className="dot error" />}
                    {j.status === 'stale' && <span className="dot stale" />}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{j.docTitle}</div>
                    <div
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 10.5,
                        color: 'var(--ink-4)',
                      }}
                    >
                      {j.id}
                    </div>
                  </td>
                  <td>
                    <LangChip code="en" source />
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {j.targets.map((t) => (
                        <LangChip key={t} code={t} />
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        className={`progress-bar ${j.status === 'approved' ? 'done' : ''} ${
                          j.status === 'error' ? 'err' : ''
                        }`}
                      >
                        <div className="fill" style={{ width: `${livePct}%` }} />
                      </div>
                      <span
                        className="mono"
                        style={{
                          fontFamily: 'var(--mono)',
                          fontSize: 11,
                          color: 'var(--ink-3)',
                          minWidth: 54,
                        }}
                      >
                        {j.done}/{j.fields}
                      </span>
                    </div>
                  </td>
                  <td>
                    <StatusPill status={j.status} />
                  </td>
                  <td className="mono">
                    <div>{j.started}</div>
                    <div style={{ color: 'var(--ink-4)', fontSize: 10.5 }}>{j.eta}</div>
                  </td>
                  <td>
                    <IcMore />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
