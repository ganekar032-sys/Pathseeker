// ---------------------------------------------------------------------------
// Pathseeker — shared logic for the /api serverless endpoints.
// Files prefixed with "_" inside /api are NOT exposed as HTTP endpoints;
// chat.js and key-status.js import from here.
//
// Purpose: let visitors use the app with zero setup while keeping the shared
// OpenRouter key OUT of the client bundle. The key lives only in this
// function's environment (OPENROUTER_API_KEY, set in the Vercel dashboard).
//
// Throttling model (defense in depth):
//   1. Per-IP hourly + daily caps  -> stops scripted hammering from one host.
//   2. Global daily cap            -> keeps total usage under OpenRouter's
//                                     account-wide free-tier daily limit.
//   3. Model allowlist             -> shared access serves the app's known
//                                     free-tier models only; custom/paid
//                                     models require the user's own key.
// NOTE: serverless instances are ephemeral and independent, so the in-memory
// buckets are best-effort (each warm instance enforces its own view). The hard
// ceiling is OpenRouter's own account-wide cap — bypassing this limiter can
// degrade availability but can never cost money (the shared key has a $0
// spend limit).
// ---------------------------------------------------------------------------

const UPSTREAM = 'https://openrouter.ai/api/v1';
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

// --- Configuration (env-overridable) ---------------------------------------

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const LIMITS = {
  perIpPerHour: positiveNumber(process.env.RATE_LIMIT_IP_PER_HOUR, 6),
  perIpPerDay: positiveNumber(process.env.RATE_LIMIT_IP_PER_DAY, 24),
  globalPerDay: positiveNumber(process.env.RATE_LIMIT_GLOBAL_PER_DAY, 45)
};

// Models usable through shared access: everything in the app's dropdown plus
// any explicit ":free" variant. Custom or paid model IDs require BYOK.
const SHARED_ALLOWED_MODELS = new Set([
  'openrouter/free',
  'google/gemini-3.7-flash',
  '~deepseek/deepseek-v4-flash-latest',
  '~moonshotai/kimi-latest',
  'anthropic/claude-opus-5-fast'
]);

function modelAllowedForShared(model) {
  return SHARED_ALLOWED_MODELS.has(model) || model.endsWith(':free');
}

// --- Best-effort in-memory sliding-window limiter ---------------------------

const buckets = new Map(); // bucketKey -> number[] of hit timestamps (ms)
let lastSweep = Date.now();

function sweep(now) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, hits] of buckets) {
    if (!hits.length || now - hits[hits.length - 1] > DAY_MS) buckets.delete(key);
  }
}

/** Registers one hit unless `limit` hits already fell inside `windowMs`. */
function allow(bucketKey, limit, windowMs, now = Date.now()) {
  sweep(now);
  const hits = (buckets.get(bucketKey) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(bucketKey, hits);
    return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - hits[0])) / 1000), used: hits.length };
  }
  hits.push(now);
  buckets.set(bucketKey, hits);
  return { allowed: true, retryAfterSec: 0, used: hits.length };
}

/** Read-only peek — used by /api/key-status so status checks never burn quota. */
function usedInWindow(bucketKey, windowMs, now = Date.now()) {
  return (buckets.get(bucketKey) || []).filter((t) => now - t < windowMs).length;
}

// --- Helpers -----------------------------------------------------------------

function json(obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders }
  });
}

function clientIp(req) {
  const forwarded = req.headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',')[0].trim();
  return first || req.headers.get('x-real-ip') || 'unknown';
}

/**
 * Validates the chat request body. Returns { ok, model, messages, temperature }
 * or { ok: false, message }.
 */
async function parseChatBody(req) {
  let raw;
  try {
    raw = await req.json();
  } catch {
    return { ok: false, message: 'Invalid JSON body.' };
  }

  const model = typeof raw?.model === 'string' ? raw.model.trim() : '';
  if (!/^[A-Za-z0-9._~/: -]{1,120}$/.test(model)) {
    return { ok: false, message: 'Missing or invalid "model".' };
  }

  const messages = Array.isArray(raw?.messages) ? raw.messages : null;
  if (!messages?.length || messages.length > 80) {
    return { ok: false, message: '"messages" must be a non-empty array (max 80).' };
  }
  for (const m of messages) {
    if (!m || !['system', 'user', 'assistant'].includes(m.role) || typeof m.content !== 'string') {
      return { ok: false, message: 'Each message needs role (system|user|assistant) and string content.' };
    }
    if (m.content.length > 150_000) {
      return { ok: false, message: 'Message content too large.' };
    }
  }

  const temperature = typeof raw.temperature === 'number' ? Math.min(Math.max(raw.temperature, 0), 2) : undefined;
  return { ok: true, model, messages, temperature };
}

async function upstreamErrorDetail(res) {
  try {
    const j = await res.json();
    return j?.error?.message || JSON.stringify(j).slice(0, 300);
  } catch {
    return `HTTP ${res.status}`;
  }
}

// --- Endpoint handlers --------------------------------------------------------

export async function handleChat(req) {
  if (req.method !== 'POST') return json({ error: { message: 'Method not allowed.' } }, 405);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(
      { error: { message: 'Shared demo access is not configured on this deployment. Paste your own OpenRouter API key in Setup instead.' } },
      503
    );
  }

  const parsed = await parseChatBody(req);
  if (!parsed.ok) return json({ error: { message: parsed.message } }, 400);
  if (!modelAllowedForShared(parsed.model)) {
    return json(
      { error: { message: `"${parsed.model}" is not available through shared access (free-tier models only). Paste your own API key to use it.` } },
      403
    );
  }

  // Rate limiting runs AFTER validation so malformed junk never burns quota.
  const ip = clientIp(req);
  const hourly = allow(`ip:${ip}:hourly`, LIMITS.perIpPerHour, HOUR_MS);
  if (!hourly.allowed) {
    return json(
      { error: { message: `Shared-access hourly limit reached (${LIMITS.perIpPerHour}/hour). Try again later, or paste your own OpenRouter key in Setup.` } },
      429,
      { 'Retry-After': String(hourly.retryAfterSec) }
    );
  }
  const ipDaily = allow(`ip:${ip}:daily`, LIMITS.perIpPerDay, DAY_MS);
  if (!ipDaily.allowed) {
    return json(
      { error: { message: `Shared-access daily limit reached for your network (${LIMITS.perIpPerDay}/day). Paste your own OpenRouter key in Setup to continue.` } },
      429,
      { 'Retry-After': String(ipDaily.retryAfterSec) }
    );
  }
  const globalDaily = allow('global:daily', LIMITS.globalPerDay, DAY_MS);
  if (!globalDaily.allowed) {
    return json(
      { error: { message: "Today's shared free pool is exhausted. It resets within 24h — or paste your own OpenRouter key in Setup for unlimited use." } },
      429,
      { 'Retry-After': String(globalDaily.retryAfterSec) }
    );
  }

  const upstreamBody = {
    model: parsed.model,
    messages: parsed.messages,
    temperature: parsed.temperature ?? 0.7
  };

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.get('origin') || 'https://pathseeker-two.vercel.app',
        'X-Title': 'Pathseeker'
      },
      body: JSON.stringify(upstreamBody),
      signal: AbortSignal.timeout(55_000)
    });
  } catch (e) {
    const timedOut = e?.name === 'TimeoutError' || e?.name === 'AbortError';
    return json({ error: { message: timedOut ? 'The model took too long to respond. Try again or pick a faster model.' : `Upstream network error: ${e.message}` } }, 504);
  }

  if (!upstream.ok) {
    // Forward upstream errors verbatim (e.g. 402 insufficient credits, 429).
    const detail = await upstreamErrorDetail(upstream);
    return json({ error: { message: `OpenRouter error (HTTP ${upstream.status}): ${detail}` } }, upstream.status === 429 ? 429 : 502);
  }

  // Pass the completion JSON through untouched — the client parses choices[0].
  const payload = await upstream.text();
  return new Response(payload, { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function handleKeyStatus(req) {
  if (req.method !== 'GET') return json({ error: { message: 'Method not allowed.' } }, 405);

  const configured = Boolean(process.env.OPENROUTER_API_KEY);
  const now = Date.now();
  const used = usedInWindow('global:daily', DAY_MS, now);
  const globalHits = buckets.get('global:daily') || [];
  const oldestRelevant = globalHits.length ? globalHits[0] : now;
  const resetsWithinHours = Math.max(1, Math.ceil((DAY_MS - (now - oldestRelevant)) / HOUR_MS));

  return json({
    configured,
    remainingToday: Math.max(0, LIMITS.globalPerDay - used),
    resetsWithinHours,
    limits: LIMITS
  });
}
