'use client';

import { useCallback, useEffect, useState } from 'react';
import { BulkModal } from '@/components/bulk-modal';
import { IcSearch } from '@/components/icons';
import { Kbd } from '@/components/primitives';
import { DocumentsScreen, type DocsFilter } from '@/components/screens/documents';
import { FreeTextScreen } from '@/components/screens/free-text';
import { GlossaryScreen } from '@/components/screens/glossary';
import { PromptsScreen } from '@/components/screens/prompts';
import { SettingsScreen } from '@/components/screens/settings';
import { ViewerScreen } from '@/components/screens/viewer';
import { Sidebar, TopNav, type Route } from '@/components/sidebar';
import { TweaksPanel } from '@/components/tweaks-panel';
import { fetchDocuments } from '@/lib/client-storage';
import { GLOSSARY, TWEAK_DEFAULTS } from '@/lib/data';
import type { DocRecord, LangCode, Tweaks } from '@/lib/types';

const isRoute = (v: string): v is Route =>
  ['documents', 'viewer', 'free-text', 'prompts', 'glossary', 'settings'].includes(v);

interface RouteState {
  route: Route;
  docId: string | null;
}

const parseHash = (hash: string): RouteState => {
  const raw = hash.replace(/^#\/?/, '');
  if (!raw) return { route: 'documents', docId: null };
  const [first, ...rest] = raw.split('/');
  if (first === 'viewer' && rest[0]) {
    return { route: 'viewer', docId: decodeURIComponent(rest[0]) };
  }
  if (isRoute(first) && first !== 'viewer') {
    return { route: first, docId: null };
  }
  return { route: 'documents', docId: null };
};

const formatHash = (route: Route, docId: string | null): string => {
  if (route === 'viewer' && docId) return `#viewer/${encodeURIComponent(docId)}`;
  if (route === 'documents' || (route === 'viewer' && !docId)) return '';
  return `#${route}`;
};

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

  // Sync route ↔ URL hash. Source of truth is `window.location.hash` so reload,
  // back/forward, and shareable links all behave correctly. State is updated on
  // mount and on every hashchange (which fires for back/forward navigation).
  useEffect(() => {
    const sync = () => {
      const next = parseHash(window.location.hash);
      setRoute(next.route);
      setDocId(next.docId);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  // Tweaks still persist to localStorage — separate concern from routing.
  useEffect(() => {
    try {
      const t = localStorage.getItem('pns.tweaks');
      if (t) setTweaks((s) => ({ ...s, ...JSON.parse(t) }));
    } catch {
      /* ignore */
    }
  }, []);

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
    docs: docs.length,
    glossary: GLOSSARY.length,
  };

  const navigate = useCallback((r: Route, id: string | null = null) => {
    setRoute(r);
    setDocId(id);
    const next = formatHash(r, id);
    const cur = window.location.hash;
    if (next === cur) return;
    const url = next || window.location.pathname + window.location.search;
    window.history.pushState(null, '', url);
  }, []);

  const openDoc = (id: string) => navigate('viewer', id);
  const back = () => {
    // If there's a previous entry, let the browser go back so back/forward
    // history stays intact. Otherwise fall back to the documents list.
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('documents');
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
    if (route === 'glossary') return <GlossaryScreen />;
    if (route === 'settings') return <SettingsScreen />;
    return null;
  };

  const crumbs: Record<Route, { label: string }> = {
    documents: { label: 'Documents' },
    viewer: { label: docId ? `Documents / ${docId}` : 'Documents' },
    'free-text': { label: 'Free Text' },
    prompts: { label: 'Prompts' },
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
          setRoute={(r) => navigate(r)}
          counts={counts}
        />
      )}
      {tweaks.nav === 'topbar' && (
        <TopNav
          route={route === 'viewer' ? 'documents' : route}
          setRoute={(r) => navigate(r)}
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
          onDone={() => {
            setBulkOpen(false);
            // Refresh docs so the new translations show as filled.
            fetchDocuments()
              .then((d) => setDocs(d))
              .catch((e: unknown) =>
                setDocsError(e instanceof Error ? e.message : 'Unknown error')
              );
          }}
        />
      )}

      <TweaksPanel tweaks={tweaks} setTweaks={setTweaks} active={editActive} />
    </div>
  );
}
