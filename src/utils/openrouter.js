// ---------------------------------------------------------------------------
// Pathseeker — inference client, two paths:
//
//   1. Own key  -> browser calls OpenRouter directly; the key never leaves
//                  memory except as the Authorization header to openrouter.ai.
//   2. Shared   -> empty key means "shared demo access": the browser calls the
//                  same-origin /api/chat proxy, which injects a server-side
//                  key (rate-limited, free-tier models only). The shared key
//                  is never present in client code or the JS bundle.
// ---------------------------------------------------------------------------

import { TEST_MODEL } from '../constants/models';

const API_BASE = 'https://openrouter.ai/api/v1';

function directHeaders(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'Pathseeker'
  };
}

/**
 * Validates API access.
 * - With a key: GET /auth/key (free) + tiny completion on TEST_MODEL.
 * - Without: pings /api/key-status to check the deployment's shared pool.
 * Returns { ok, message }.
 */
export async function testApiKey(apiKey) {
  if (!apiKey) return testSharedAccess();
  try {
    const res = await fetch(`${API_BASE}/auth/key`, { headers: directHeaders(apiKey) });
    if (!res.ok) {
      return { ok: false, message: `Key rejected (HTTP ${res.status}). Check the key and try again.` };
    }

    const ping = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: directHeaders(apiKey),
      body: JSON.stringify({
        model: TEST_MODEL,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 1
      })
    });
    if (!ping.ok) {
      const detail = await safeErrorDetail(ping);
      return { ok: false, message: `Key is valid but inference failed: ${detail}` };
    }
    return { ok: true, message: 'API key verified — inference call succeeded.' };
  } catch (e) {
    return { ok: false, message: `Network error: ${e.message}` };
  }
}

/** Checks this deployment's shared demo access without consuming quota. */
export async function testSharedAccess() {
  try {
    const res = await fetch('/api/key-status');
    const status = await res.json().catch(() => null);
    if (!res.ok || !status?.configured) {
      return { ok: false, message: 'Shared demo access is not configured on this deployment. Paste your own OpenRouter key instead.' };
    }
    if (!(status.remainingToday > 0)) {
      return { ok: false, message: `Today's shared free pool is used up (resets in ~${status.resetsWithinHours}h). Paste your own OpenRouter key to keep going.` };
    }
    return { ok: true, message: `Shared demo access working — about ${status.remainingToday} request(s) left in today's free pool.` };
  } catch (e) {
    return { ok: false, message: `Network error: ${e.message}` };
  }
}

/**
 * Sends the pinned-context chat completion.
 * @param {string} apiKey - user's own key, or '' for shared proxy mode
 * @param {string} model - OpenRouter model ID
 * @param {Array<{role, content}>} messages - system + trimmed history + user msg
 * @returns {Promise<string>} assistant reply text
 */
export async function sendChatCompletion(apiKey, model, messages) {
  let res;
  if (apiKey) {
    res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: directHeaders(apiKey),
      body: JSON.stringify({ model, messages, temperature: 0.7 })
    });
  } else {
    res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, temperature: 0.7 })
    });
  }

  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(detail || `Request failed (HTTP ${res.status}).`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from model.');
  return content;
}

async function safeErrorDetail(res) {
  try {
    const j = await res.json();
    return j?.error?.message || JSON.stringify(j).slice(0, 300);
  } catch {
    return `HTTP ${res.status}`;
  }
}
