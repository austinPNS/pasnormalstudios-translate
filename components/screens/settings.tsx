'use client';

import { LANGS } from '@/lib/data';
import { LangChip } from '../primitives';

export const SettingsScreen = () => {
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Settings</h1>
          <div className="sub">Model and active languages</div>
        </div>
      </div>

      <div className="settings-wrap">
        <div className="setting-card">
          <div className="hd">
            <h3>Model</h3>
            <div className="sub">
              Used for all languages. Per-language rules live in the Prompts tab.
            </div>
          </div>
          <div className="setting-row">
            <div className="label">Default model</div>
            <div className="control">
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>
                claude-opus-4-7
              </span>
            </div>
          </div>
        </div>

        <div className="setting-card">
          <div className="hd">
            <h3>Languages</h3>
          </div>
          <div className="setting-row">
            <div className="label">Source</div>
            <div className="control">
              <LangChip code="en" source />{' '}
              <span style={{ marginLeft: 8, color: 'var(--ink-3)', fontSize: 12 }}>
                English
              </span>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">Active targets</div>
            <div
              className="control"
              style={{
                display: 'flex',
                gap: 6,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {LANGS.filter((l) => !l.source).map((l) => (
                <span key={l.code} className="chip" style={{ gap: 6 }}>
                  <LangChip code={l.code} />
                  {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
