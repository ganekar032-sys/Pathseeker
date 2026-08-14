// ---------------------------------------------------------------------------
// Pathseeker — OpenRouter client (single-pipe inference)
// All calls originate from the browser; the API key never leaves memory
// except as the Authorization header on requests to openrouter.ai.
// ---------------------------------------------------------------------------

import { TEST_MODEL } from '../constants/models';

const API_BASE = 'https://openrouter.ai/api/v1';

function headers(apiKey) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : '',
    'X-Title': 'Pathseeker'
  };
}

/**
 * Cheap API key validation.
 * 1. GET /auth/key — free, verifies the key itself.
 * 2. Tiny 1-token completion on a cheap model — verifies inference access.
 * Returns { ok, message }.
 */
export async function testApiKey(apiKey) {
  try {
    const res = await fetch(`${API_BASE}/auth/key`, { headers: headers(apiKey) });
    if (!res.ok) {
      return { ok: false, message: `Key rejected (HTTP ${res.status}). Check the key and try again.` };
    }

    const ping = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: headers(apiKey),
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

/**
 * Sends the pinned-context chat completion.
 * @param {string} apiKey
 * @param {string} model - OpenRouter model ID
 * @param {Array<{role, content}>} messages - system + trimmed history + user msg
 * @returns {Promise<string>} assistant reply text
 */
export async function sendChatCompletion(apiKey, model, messages) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: headers(apiKey),
    body: JSON.stringify({ model, messages, temperature: 0.7 })
  });

  if (!res.ok) {
    const detail = await safeErrorDetail(res);
    throw new Error(`OpenRouter error (HTTP ${res.status}): ${detail}`);
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
