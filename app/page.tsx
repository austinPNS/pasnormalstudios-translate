'use client';

import { useEffect, useState } from 'react';
import { BulkModal } from '@/components/bulk-modal';
import { IcSearch } from '@/components/icons';
import { Kbd } from '@/components/primitives';
import { DocumentsScreen } from '@/components/screens/documents';
import { GlossaryScreen } from '@/components/screens/glossary';
import { JobsScreen } from '@/components/screens/jobs';
import { PromptsScreen } from '@/components/screens/prompts';
import { SettingsScreen } from '@/components/screens/settings';
import { ViewerScreen } from '@/components/screens/viewer';
import { Sidebar, TopNav, type Route } from '@/components/sidebar';
import { TweaksPanel } from '@/components/tweaks-panel';
import { DOCS, GLOSSARY, JOBS, SAMPLE_DOC, TWEAK_DEFAULTS } from '@/lib/data';
import type { LangCode, Tweaks } from '@/lib/types';

const isRoute = (v: string): v is Route =>
  ['documents', 'viewer', 'prompts', 'jobs', 'glossary', 'settings'].includes(v);

export default function App() {
  const [route, setRoute] = useState<Route>('documents');
  const [docId, setDocId] = useState<string | null>(null);
  const [target, setTarget] = useState<LangCode>('de');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInitial, setBulkInitial] = useState<string[]>([]);
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS);
  const [editActive, setEditActive] = useState(false);

  // Restore persisted state from localStorage after mount (avoid SSR mismatch).
  useEffect(() => {
    try {
      const r = localStorage.getItem('pns.route');
      if (r && isRoute(r)) setRoute(r);
      const t = localStorage.getItem('pns.tweaks');
      if (t) setTweaks((s) => ({ ...s, ...JSON.parse(t) }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('pns.route', route);
  }, [route]);

  useEffect(() => {
    localStorage.setItem('pns.tweaks', JSON.stringify(tweaks));
  }, [tweaks]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || !e.data.type) return;
      if (e.data.type === '__activate_edit_mode') setEditActive(true);
      if (e.data.type === '__deactivate_edit_mode') setEditActive(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);

  useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  const counts = {
    docs: DOCS.length,
    jobs: JOBS.filter((j) => j.status === 'progress' || j.status === 'review').length,
    glossary: GLOSSARY.length,
  };

  const openDoc = (id: string) => {
    setDocId(id);
    setRoute('viewer');
  };
  const back = () => {
    setDocId(null);
    setRoute('documents');
  };
  const bulk = (ids: string[]) => {
    setBulkInitial(ids);
    setBulkOpen(true);
  };

  const renderMain = () => {
    if (route === 'documents')
      return (
        <DocumentsScreen layout={tweaks.layout} onOpenDoc={openDoc} onBulk={bulk} />
      );
    if (route === 'viewer')
      return (
        <ViewerScreen
          docId={docId}
          target={target}
          setTarget={setTarget}
          diffMode={tweaks.diffMode}
          setDiffMode={(v) => setTweaks((s) => ({ ...s, diffMode: v }))}
          onBack={back}
        />
      );
    if (route === 'prompts') return <PromptsScreen />;
    if (route === 'jobs') return <JobsScreen />;
    if (route === 'glossary') return <GlossaryScreen />;
    if (route === 'settings') return <SettingsScreen />;
    return null;
  };

  const crumbs: Record<Route, { label: string }> = {
    documents: { label: 'Documents' },
    viewer: { label: 'Documents / ' + SAMPLE_DOC.title },
    prompts: { label: 'Prompts' },
    jobs: { label: 'Jobs' },
    glossary: { label: 'Glossary' },
    settings: { label: 'Settings' },
  };
  const cur = crumbs[route];

  const shellClass = tweaks.nav === 'topbar' ? 'shell nav-top' : 'shell';

  return (
    <div className={shellClass} data-density={tweaks.density}>
      {tweaks.nav === 'sidebar' && (
        <Sidebar
          route={route}
          setRoute={(r) => {
            setRoute(r);
            if (r !== 'viewer') setDocId(null);
          }}
          counts={counts}
        />
      )}
      {tweaks.nav === 'topbar' && (
        <TopNav
          route={route === 'viewer' ? 'documents' : route}
          setRoute={(r) => {
            setRoute(r);
            setDocId(null);
          }}
        />
      )}
      <div className="main">
        <div className="topbar">
          <div className="breadcrumbs">
            <span>pns-production</span>
            <span className="sep">/</span>
            <span className="current">{cur.label}</span>
          </div>
          <div style={{ flex: 1 }} />
          {tweaks.nav === 'sidebar' && (
            <div className="cmdk">
              <IcSearch size={13} />
              <span style={{ flex: 1 }}>Find document, language, prompt…</span>
              <Kbd>⌘K</Kbd>
            </div>
          )}
          <button className="btn ghost icon" title="Notifications">
            <svg
              className="ico"
              width={14}
              height={14}
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 7a4 4 0 0 1 8 0v2l1.5 2.5h-11L4 9V7Z" />
              <path d="M6.5 13a1.5 1.5 0 0 0 3 0" />
            </svg>
          </button>
        </div>
        <div className="content">{renderMain()}</div>
      </div>

      {bulkOpen && (
        <BulkModal
          initialSel={bulkInitial}
          onClose={() => setBulkOpen(false)}
          onSubmit={() => {
            setBulkOpen(false);
            setRoute('jobs');
          }}
        />
      )}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} active={editActive} />
    </div>
  );
}
