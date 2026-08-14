import { useState } from 'react';
import { testApiKey } from '../utils/openrouter';
import { saveSessionApiKey, clearSessionApiKey } from '../utils/storage';

/**
 * Step 1 — Secure API key entry.
 * Key lives in React memory (lifted to App). Optional checkbox mirrors it to
 * sessionStorage only (cleared when the browser closes). Never localStorage.
 */
export default function ApiKeySetup({ apiKey, setApiKey, rememberSession, setRememberSession }) {
  const [status, setStatus] = useState(null); // { ok, message }
  const [testing, setTesting] = useState(false);

  function handleKeyChange(e) {
    const value = e.target.value.trim();
    setApiKey(value);
    setStatus(null);
    if (rememberSession && value) saveSessionApiKey(value);
  }

  function handleRememberToggle(e) {
    const checked = e.target.checked;
    setRememberSession(checked);
    if (checked && apiKey) saveSessionApiKey(apiKey);
    else clearSessionApiKey();
  }

  async function handleTest() {
    if (!apiKey) {
      setStatus({ ok: false, message: 'Enter an API key first.' });
      return;
    }
    setTesting(true);
    setStatus(null);
    const result = await testApiKey(apiKey);
    setStatus(result);
    setTesting(false);
  }

  return (
    <section className="panel">
      <h2>Step 1 — OpenRouter API Key</h2>
      <p className="muted">
        Your key is held in memory only. It is never written to localStorage or cookies.
        Optionally, it can be kept in <code>sessionStorage</code> until you close the browser.
      </p>

      <div className="field-row">
        <input
          type="password"
          className="text-input"
          placeholder="sk-or-v1-…"
          value={apiKey}
          onChange={handleKeyChange}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="btn" onClick={handleTest} disabled={testing}>
          {testing ? 'Testing…' : 'Test API Key'}
        </button>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={rememberSession} onChange={handleRememberToggle} />
        Remember key for this session (sessionStorage — clears when the browser closes)
      </label>

      {status && (
        <p className={status.ok ? 'status ok' : 'status err'}>{status.message}</p>
      )}

      <p className="muted small">
        Get a key at{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
          openrouter.ai/keys
        </a>
        . Reloading the tab wipes the key unless the session checkbox is ticked.
      </p>
    </section>
  );
}
