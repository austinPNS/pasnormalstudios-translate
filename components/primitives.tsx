'use client';

import type { MouseEvent, ReactNode } from 'react';
import { STATUS_LABELS, TYPE_LABELS } from '@/lib/data';
import type { Status } from '@/lib/types';
import { DOC_ICONS, IcCheck, IcDocs } from './icons';

export const LangChip = ({ code, source }: { code: string; source?: boolean }) => (
  <span className={`lang-chip ${source ? 'source' : ''}`}>{code.toUpperCase()}</span>
);

export const StatusPill = ({ status }: { status: Status }) => (
  <span className={`status-pill ${status}`}>
    <span className={`dot ${status}`} />
    {STATUS_LABELS[status]}
  </span>
);

export const StatusDot = ({ status, pct }: { status: Status; pct: number }) => {
  if (status === 'none') {
    return <span className="dot none" title="Not translated" />;
  }
  return (
    <span className="cell">
      <span className={`dot ${status}`} title={STATUS_LABELS[status]} />
      {pct < 100 && status === 'progress' && <span className="pct">{pct}%</span>}
      {pct === 100 && status !== 'progress' && (
        <span className="pct">
          {status === 'approved'
            ? '✓'
            : status === 'review'
            ? '·'
            : status === 'stale'
            ? '↺'
            : status === 'error'
            ? '!'
            : ''}
        </span>
      )}
    </span>
  );
};

export const Check = ({
  on,
  indeterminate,
  onClick,
}: {
  on?: boolean;
  indeterminate?: boolean;
  onClick?: (e: MouseEvent) => void;
}) => (
  <button
    type="button"
    className={`check ${on ? 'on' : ''} ${indeterminate ? 'indeterminate' : ''}`}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    aria-checked={!!on}
    role="checkbox"
  >
    {on && !indeterminate && <IcCheck size={11} sw={2} />}
  </button>
);

export const Kbd = ({ children }: { children: ReactNode }) => <span className="kbd">{children}</span>;

export const FieldType = ({ t }: { t: string }) => <span className="type">{t}</span>;

export const DocTypeBadge = ({ type }: { type: string }) => {
  const I = DOC_ICONS[type] || IcDocs;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-3)' }}>
      <I size={13} />
      <span style={{ fontSize: 12 }}>{TYPE_LABELS[type]}</span>
    </span>
  );
};

export const Switch = ({
  on,
  onChange,
}: {
  on?: boolean;
  onChange?: (v: boolean) => void;
}) => (
  <div
    className={`switch ${on ? 'on' : ''}`}
    onClick={() => onChange?.(!on)}
    role="switch"
    aria-checked={!!on}
  />
);

export const Seg = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { v: T; label: string }[];
}) => (
  <div
    className="seg"
    style={{
      border: '1px solid var(--line)',
      borderRadius: 6,
      padding: 2,
      background: 'var(--bg-1)',
      display: 'inline-flex',
      gap: 2,
    }}
  >
    {options.map((o) => (
      <button
        key={o.v}
        className={value === o.v ? 'on' : ''}
        onClick={() => onChange(o.v)}
        style={{
          padding: '3px 10px',
          borderRadius: 4,
          fontSize: 12,
          color: value === o.v ? 'var(--ink)' : 'var(--ink-3)',
          background: value === o.v ? 'var(--bg)' : 'transparent',
          fontWeight: value === o.v ? 500 : 400,
          boxShadow: value === o.v ? 'var(--shadow-1)' : 'none',
        }}
      >
        {o.label}
      </button>
    ))}
  </div>
);
