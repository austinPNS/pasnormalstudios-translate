'use client';

import type { ComponentType } from 'react';
import {
  IcDocs,
  IcGlossary,
  IcJobs,
  IcPrompt,
  IcSearch,
  IcSettings,
} from './icons';
import { Kbd } from './primitives';

type Route = 'documents' | 'viewer' | 'prompts' | 'jobs' | 'glossary' | 'settings';

interface SidebarProps {
  route: Route;
  setRoute: (r: Route) => void;
  counts: { docs: number; jobs: number; glossary: number };
}

export const Sidebar = ({ route, setRoute, counts }: SidebarProps) => {
  const nav = (
    id: Route,
    label: string,
    Icon: ComponentType<{ size?: number }>,
    count?: number | string
  ) => (
    <button
      key={id}
      className={`nav-item ${route === id ? 'active' : ''}`}
      onClick={() => setRoute(id)}
    >
      <Icon />
      <span>{label}</span>
      {count != null && <span className="count">{count}</span>}
    </button>
  );

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="logo">P</div>
        <div className="title">Translate</div>
        <div className="tag">v2.4</div>
      </div>
      <div className="group">
        <div className="hd">Workspace</div>
        {nav('documents', 'Documents', IcDocs, counts.docs)}
        {nav('jobs', 'Jobs', IcJobs, counts.jobs)}
      </div>
      <div className="group">
        <div className="hd">Configure</div>
        {nav('prompts', 'Prompts', IcPrompt, '3')}
        {nav('glossary', 'Glossary', IcGlossary, counts.glossary)}
        {nav('settings', 'Settings', IcSettings)}
      </div>
      <div className="foot">
        <div className="avatar">IW</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: 'var(--ink)', fontWeight: 500 }}>Ida Weibel</div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10.5, color: 'var(--ink-4)' }}>
            pns-prod · editor
          </div>
        </div>
      </div>
    </aside>
  );
};

export const TopNav = ({
  route,
  setRoute,
}: {
  route: Route;
  setRoute: (r: Route) => void;
}) => {
  const tab = (id: Route, label: string) => (
    <button
      key={id}
      className={`tab ${route === id ? 'active' : ''}`}
      onClick={() => setRoute(id)}
    >
      {label}
    </button>
  );
  return (
    <header className="topnav">
      <div className="brand">
        <div className="logo">P</div>
        <div style={{ fontWeight: 600, letterSpacing: '-0.01em' }}>Translate</div>
      </div>
      <div className="tabs">
        {tab('documents', 'Documents')}
        {tab('jobs', 'Jobs')}
        {tab('prompts', 'Prompts')}
        {tab('glossary', 'Glossary')}
        {tab('settings', 'Settings')}
      </div>
      <div style={{ flex: 1 }} />
      <div
        className="topbar cmdk"
        style={{ border: '1px solid var(--line)', padding: '5px 10px' }}
      >
        <IcSearch size={13} />
        <span style={{ flex: 1, fontSize: 12.5 }}>Find document, language, prompt…</span>
        <Kbd>⌘K</Kbd>
      </div>
      <div
        className="avatar"
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, oklch(0.7 0.12 230), oklch(0.55 0.14 300))',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        IW
      </div>
    </header>
  );
};

export type { Route };
