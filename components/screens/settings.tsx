'use client';

import { useState } from 'react';
import { LANGS } from '@/lib/data';
import { IcPlus, IcX } from '../icons';
import { LangChip, Switch } from '../primitives';

export const SettingsScreen = () => {
  const [autoSync, setAutoSync] = useState(false);
  const [requireReview, setRequireReview] = useState(true);
  const [staleAlert, setStaleAlert] = useState(true);
  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="h1">Settings</h1>
          <div className="sub">Model, tone, brand voice, and sync rules</div>
        </div>
      </div>

      <div className="settings-wrap">
        <div className="setting-card">
          <div className="hd">
            <h3>Sanity connection</h3>
            <div className="sub">Dataset the translator reads from and writes back to.</div>
          </div>
          <div className="setting-row">
            <div className="label">
              Project<div className="sub">Read & write scope</div>
            </div>
            <div className="control">
              <div className="field wide">
                <span style={{ fontFamily: 'var(--mono)' }}>pns-production</span>
              </div>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">Dataset</div>
            <div className="control">
              <div className="field wide">
                <select>
                  <option>production</option>
                  <option>staging</option>
                </select>
              </div>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">API version</div>
            <div className="control">
              <div className="field wide">
                <span style={{ fontFamily: 'var(--mono)' }}>2024-10-15</span>
              </div>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">
              Auto-sync approved
              <div className="sub">
                Automatically write approved translations back to Sanity
              </div>
            </div>
            <div className="control">
              <Switch on={autoSync} onChange={setAutoSync} />
            </div>
          </div>
        </div>

        <div className="setting-card">
          <div className="hd">
            <h3>Model & provider</h3>
            <div className="sub">
              Used for all languages unless overridden per-language in the Prompts tab.
            </div>
          </div>
          <div className="setting-row">
            <div className="label">Default model</div>
            <div className="control">
              <div className="field wide">
                <select defaultValue="gpt-4.1-mini">
                  <option>gpt-4.1-mini</option>
                  <option>gpt-4.1</option>
                  <option>claude-sonnet-4-5</option>
                </select>
              </div>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">
              Temperature
              <div className="sub">Lower = more literal, higher = more liberal</div>
            </div>
            <div className="control" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input type="range" min="0" max="100" defaultValue="20" style={{ flex: 1 }} />
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12 }}>0.20</span>
            </div>
          </div>
          <div className="setting-row">
            <div className="label">Max tokens per field</div>
            <div className="control">
              <div className="field">
                <input defaultValue="1200" />
              </div>
            </div>
          </div>
        </div>

        <div className="setting-card">
          <div className="hd">
            <h3>Workflow</h3>
          </div>
          <div className="setting-row">
            <div className="label">
              Require review before sync
              <div className="sub">
                Translations must be approved by an editor before writing back
              </div>
            </div>
            <div className="control">
              <Switch on={requireReview} onChange={setRequireReview} />
            </div>
          </div>
          <div className="setting-row">
            <div className="label">
              Mark stale on source edit
              <div className="sub">Flag translations when the source document changes</div>
            </div>
            <div className="control">
              <Switch on={staleAlert} onChange={setStaleAlert} />
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
                English — cannot be changed
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
                  <IcX size={11} />
                </span>
              ))}
              <button className="btn sm">
                <IcPlus size={11} /> Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
