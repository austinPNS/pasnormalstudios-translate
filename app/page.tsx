'use client';

import { useEffect, useState } from 'react';
import { BulkModal } from '@/components/bulk-modal';
import { IcSearch } from '@/components/icons';
import { Kbd } from '@/components/primitives';
import { DocumentsScreen, type DocsFilter } from '@/components/screens/documents';
import { FreeTextScreen } from '@/components/screens/free-text';
import { GlossaryScreen } from '@/components/screens/glossary';
import { JobsScreen } from '@/components/screens/jobs';
import { PromptsScreen } from '@/components/screens/prompts';
import { SettingsScreen } from '@/components/screens/settings';
import { ViewerScreen } from '@/components/screens/viewer';
import { Sidebar, TopNav, type Route } from '@/components/sidebar';
import { TweaksPanel } from '@/components/tweaks-panel';
import { fetchDocuments } from '@/lib/client-storage';
import { GLOSSARY, JOBS, TWEAK_DEFAULTS } from '@/lib/data';
import type { DocRecord, LangCode, Tweaks } from '@/lib/types';

const isRoute = (v: string): v is Route =>
  ['documents', 'viewer', 'free-text', 'prompts', 'jobs', 'glossary', 'settings'].includes(v);

export default function App() {
  const [route, setRoute] = useState<Route>('documents');
  const [docId, setDocId] = useState<string | null>(null);
  const [target, setTarget] = useState<LangCode>('de');
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkInitial, setBulkInitial] = useState<string[]>([]);
  const [tweaks, setTweaks] = useState<Tweaks>(TWEAK_DEFAULTS);
  const [editActive, setEditActive] = useState(false);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsFilter, setDocsFilter] = useState<DocsFilter>('product');
  const [docsSearch, setDocsSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchDocuments()
      .then((d) => {
        if (cancelled) return;
        setDocs(d);
        setDocsError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setDocsError(e instanceof Error ? e.message : 'Unknown error');
      })
      .finally(() => {
        if (!cancelled) setDocsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    const onPop = (e: PopStateEvent) => {
      const s = e.state as { pnsViewerDoc?: string } | null;
      if (s?.pnsViewerDoc) {
        setDocId(s.pnsViewerDoc);
        setRoute('viewer');
      } else {
        setDocId(null);
        setRoute('documents');
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    window.parent.postMessage({ type: '__edit_mode_set_keys', edits: tweaks }, '*');
  }, [tweaks]);

  const counts = {
    docs: docs.length,
    jobs: JOBS.filter((j) => j.status === 'progress' || j.status === 'review').length,
    glossary: GLOSSARY.length,
  };

  const openDoc = (id: string) => {
    setDocId(id);
    setRoute('viewer');
    window.history.pushState({ pnsViewerDoc: id }, '');
  };
  const back = () => {
    if (window.history.state?.pnsViewerDoc) {
      window.history.back();
    } else {
      setDocId(null);
      setRoute('documents');
    }
  };
  const bulk = (ids: string[]) => {
    setBulkInitial(ids);
    setBulkOpen(true);
  };

  const renderMain = () => {
    if (route === 'documents')
      return (
        <DocumentsScreen
          layout={tweaks.layout}
          docs={docs}
          loading={docsLoading}
          error={docsError}
          onOpenDoc={openDoc}
          onBulk={bulk}
          filter={docsFilter}
          setFilter={setDocsFilter}
          search={docsSearch}
          setSearch={setDocsSearch}
        />
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
    if (route === 'free-text') return <FreeTextScreen />;
    if (route === 'prompts') return <PromptsScreen docs={docs} />;
    if (route === 'jobs') return <JobsScreen />;
    if (route === 'glossary') return <GlossaryScreen />;
    if (route === 'settings') return <SettingsScreen />;
    return null;
  };

  const crumbs: Record<Route, { label: string }> = {
    documents: { label: 'Documents' },
    viewer: { label: docId ? `Documents / ${docId}` : 'Documents' },
    'free-text': { label: 'Free Text' },
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
          docs={docs}
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
