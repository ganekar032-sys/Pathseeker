import { useState } from 'react';
import ApiKeySetup from './components/ApiKeySetup';
import ChartInput from './components/ChartInput';
import DataInspector from './components/DataInspector';
import ChatPanel from './components/ChatPanel';
import { loadChartData, loadRawInput, loadSessionApiKey } from './utils/storage';

const TABS = [
  { id: 'setup', label: '1 · Setup' },
  { id: 'input', label: '2 · Chart Input' },
  { id: 'inspect', label: '3 · Data Inspector' },
  { id: 'chat', label: '4 · Chat' }
];

// API access model: an empty key means "shared demo access" — chat requests
// go through this deployment's rate-limited /api/chat proxy, which holds the
// shared OpenRouter key server-side. Users can paste their own key in Setup
// for direct browser -> OpenRouter calls (never persisted beyond the session).
export default function App() {
  // API key: in-memory by default; hydrated from sessionStorage only if the
  // user previously opted in via the "remember for this session" checkbox.
  const sessionKey = loadSessionApiKey();
  const [apiKey, setApiKey] = useState(sessionKey || '');
  const [rememberSession, setRememberSession] = useState(Boolean(sessionKey));

  // Chart data: hydrated from localStorage (survives reloads).
  const [chartData, setChartData] = useState(() => loadChartData());
  const [initialRaw] = useState(() => loadRawInput());

  const [tab, setTab] = useState(chartData ? 'chat' : 'input');

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Pathseeker</h1>
          <p className="tagline">
            Classical Jyotish interpretation · Parasara &amp; Jaimini only · zero AI-side calculation
          </p>
        </div>
        <div className="header-status">
          <span className={`chip ${apiKey ? 'ok' : ''}`}>
            {apiKey ? 'Own API key (memory)' : 'Shared demo access'}
          </span>
          <span className={`chip ${chartData ? 'ok' : 'warn'}`}>
            {chartData ? 'Chart data loaded' : 'No chart data'}
          </span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'setup' && (
          <ApiKeySetup
            apiKey={apiKey}
            setApiKey={setApiKey}
            rememberSession={rememberSession}
            setRememberSession={setRememberSession}
          />
        )}
        {tab === 'input' && (
          <ChartInput
            initialRaw={initialRaw}
            onParsed={(data) => setChartData(data)}
            onCleared={() => setChartData(null)}
          />
        )}
        {tab === 'inspect' && <DataInspector chartData={chartData} />}
        {tab === 'chat' && <ChatPanel apiKey={apiKey} chartData={chartData} />}
      </main>

      <footer className="app-footer">
        <p className="muted small">
          100% client-side. Chart data stays in your browser's localStorage; your own API key is
          never persisted beyond this session. Without a key, requests use this site's shared,
          rate-limited free pool. For research and personal study only.
        </p>
        <p className="muted small">
          📖{' '}
          <a href="/docs/jhora-instructions.pdf" target="_blank" rel="noreferrer">
            JHora usage instructions (PDF)
          </a>
          {' · '}
          <a href="https://www.vedicastrologer.org/jh/jh_full_install.zip" target="_blank" rel="noreferrer">
            ⬇️ Download JHora free
          </a>
        </p>
      </footer>
    </div>
  );
}
