import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';

export type DemoTab = {
  id: string;
  label: string;
  question: string;
  content: ReactNode;
};

type AppShellProps = { tabs: readonly DemoTab[] };

function readTabId(tabs: readonly DemoTab[]): { id: string; invalid: boolean } {
  const parameters = new URLSearchParams(window.location.search);
  const values = parameters.getAll('demo');
  const valid = values.length <= 1 && values[0] !== undefined && tabs.some((tab) => tab.id === values[0]);
  if (values.length === 0) return { id: tabs[0].id, invalid: false };
  return valid ? { id: values[0], invalid: false } : { id: tabs[0].id, invalid: true };
}

function replaceInvalidQuery(defaultId: string) {
  const url = new URL(window.location.href);
  url.searchParams.delete('demo');
  url.searchParams.set('demo', defaultId);
  window.history.replaceState(null, '', url);
}

export function AppShell({ tabs }: AppShellProps) {
  const initial = readTabId(tabs);
  const [activeId, setActiveId] = useState(initial.id);
  const [renderedIds, setRenderedIds] = useState(() => new Set([initial.id]));
  const [focusedIndex, setFocusedIndex] = useState(() => Math.max(0, tabs.findIndex((tab) => tab.id === initial.id)));
  const [notice, setNotice] = useState(initial.invalid ? 'Demo không hợp lệ; đang mở Weighted Inputs.' : '');
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    tabRefs.current[tabs.findIndex((tab) => tab.id === activeId)]?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }, [activeId, tabs]);

  useEffect(() => {
    if (initial.invalid) replaceInvalidQuery(tabs[0].id);

    const handlePopState = () => {
      const next = readTabId(tabs);
      if (next.invalid) replaceInvalidQuery(tabs[0].id);
      const nextId = next.invalid ? tabs[0].id : next.id;
      const nextIndex = tabs.findIndex((tab) => tab.id === nextId);
      const activePanel = document.getElementById(`panel-${activeId}`);
      const shouldRestoreFocus = activePanel?.contains(document.activeElement) ?? false;
      setActiveId(nextId);
      setRenderedIds((current) => new Set(current).add(nextId));
      setFocusedIndex(nextIndex);
      setNotice(next.invalid ? 'Demo không hợp lệ; đang mở Weighted Inputs.' : '');
      if (shouldRestoreFocus) requestAnimationFrame(() => tabRefs.current[nextIndex]?.focus());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeId, initial.invalid, tabs]);

  function activate(index: number) {
    const tab = tabs[index];
    setActiveId(tab.id);
    setRenderedIds((current) => new Set(current).add(tab.id));
    setFocusedIndex(index);
    setNotice('');
    const url = new URL(window.location.href);
    if (url.searchParams.get('demo') !== tab.id || url.searchParams.getAll('demo').length !== 1) {
      url.searchParams.delete('demo');
      url.searchParams.set('demo', tab.id);
      window.history.pushState(null, '', url);
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex !== null) {
      event.preventDefault();
      setFocusedIndex(nextIndex);
      tabRefs.current[nextIndex]?.focus();
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      activate(index);
    }
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">Đi tới nội dung chính</a>
      <header className="app-header">
        <div>
          <p className="eyebrow">Interactive ANN presentation companion</p>
          <h1>ML Geometry Playground</h1>
        </div>
        <p className="sequence-label">9 concepts · từ weighted inputs đến forward pass</p>
      </header>

      <nav className="tab-strip" aria-label="Các demo học tập">
        <div role="tablist" aria-label="ANN learning sequence">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeId === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => activate(index)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
            >
              <span aria-hidden="true">{index + 1}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {notice && <p className="app-notice" role="status">{notice}</p>}

      <main id="main-content">
        {tabs.map((tab) => (
          <section
            key={tab.id}
            id={`panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`tab-${tab.id}`}
            hidden={activeId !== tab.id}
            className="demo-panel"
          >
            <header className="demo-heading">
              <p className="demo-step">Concept {tabs.indexOf(tab) + 1} / {tabs.length}</p>
              <h2>{tab.label}</h2>
              <p>{tab.question}</p>
            </header>
            {renderedIds.has(tab.id) ? tab.content : null}
          </section>
        ))}
      </main>
    </div>
  );
}
