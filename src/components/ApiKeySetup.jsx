import { useState } from 'react';
import { testApiKey } from '../utils/openrouter';
import { saveSessionApiKey, clearSessionApiKey } from '../utils/storage';

/**
 * Step 1 — API access.
 * Two modes: shared demo access (no key — requests go through this
 * deployment's rate-limited /api proxy), or the user's own OpenRouter key,
 * which lives in React memory (lifted to App) and is optionally mirrored to
 * sessionStorage only. Never localStorage.
 */
export default function ApiKeySetup({ apiKey, setApiKey, rememberSession, setRememberSession }) {
  const [status, setStatus] = useState(null); // { ok, message }
  const [testing, setTesting] = useState(false);

  function handleKeyChange(e) {
    const value = e.target.value.trim();
    setApiKey(value);
    setStatus(null);
    if (rememberSession && value) saveSessionApiKey(value);
    if (!value) clearSessionApiKey();
  }

  function handleRememberToggle(e) {
    const checked = e.target.checked;
    setRememberSession(checked);
    if (checked && apiKey) saveSessionApiKey(apiKey);
    else clearSessionApiKey();
  }

  async function handleTest() {
    setTesting(true);
    setStatus(null);
    const result = await testApiKey(apiKey); // empty key -> tests shared access
    setStatus(result);
    setTesting(false);
  }

  return (
    <section className="panel">
      <h2>Step 1 — API Access</h2>
      <p className="muted">
        <strong>No key needed to start:</strong> the app ships with shared demo access — a
        rate-limited free-model pool served by this site (a handful of requests per hour per
        visitor, with a shared daily cap). For heavier use or guaranteed availability, paste your
        own OpenRouter key below.
      </p>

      <div className="field-row">
        <input
          type="password"
          className="text-input"
          placeholder="Your own key: sk-or-v1-… (optional)"
          value={apiKey}
          onChange={handleKeyChange}
          autoComplete="off"
          spellCheck={false}
        />
        <button className="btn" onClick={handleTest} disabled={testing}>
          {testing ? 'Testing…' : apiKey ? 'Test API Key' : 'Test Shared Access'}
        </button>
      </div>

      <label className="checkbox-row">
        <input type="checkbox" checked={rememberSession} onChange={handleRememberToggle} />
        Remember my own key for this session (sessionStorage — clears when the browser closes)
      </label>

      {status && (
        <p className={status.ok ? 'status ok' : 'status err'}>{status.message}</p>
      )}

      <p className="muted small">
        An own key is held in memory only — never written to localStorage or cookies. Get one at{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer">
          openrouter.ai/keys
        </a>
        . Clearing the field switches back to shared access.
      </p>
    </section>
  );
}
