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

export default function App() {
  // API key: in-memory by default; hydrated from sessionStorage only if the
  // user previously opted in via the "remember for this session" checkbox.
  const sessionKey = loadSessionApiKey();
  const [apiKey, setApiKey] = useState(sessionKey);
  const [rememberSession, setRememberSession] = useState(Boolean(sessionKey));

  // Chart data: hydrated from localStorage (survives reloads).
  const [chartData, setChartData] = useState(() => loadChartData());
  const [initialRaw] = useState(() => loadRawInput());

  const [tab, setTab] = useState(apiKey ? (chartData ? 'chat' : 'input') : 'setup');

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
          <span className={`chip ${apiKey ? 'ok' : 'warn'}`}>
            {apiKey ? 'Key loaded (memory)' : 'No API key'}
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
          100% client-side. Chart data stays in your browser's localStorage; your API key is
          never persisted beyond this session. For research and personal study only.
        </p>
      </footer>
    </div>
  );
}
