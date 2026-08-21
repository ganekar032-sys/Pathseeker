// Local development stand-in for Vercel's serverless functions.
//
//   node scripts/dev-proxy.mjs        # listens on http://127.0.0.1:8787
//
// `npm run dev` (Vite) proxies /api/* here, so shared-access mode works
// locally exactly like it does in production. Secrets are read from
// .env.local in the app root — that file is gitignored; never commit it.
// Copy .env.example to .env.local to get started.

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleChat, handleKeyStatus } from '../api/_handler.js';

const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ENV_FILE = resolve(APP_ROOT, '.env.local');
const PORT = Number(process.env.DEV_PROXY_PORT) || 8787;

// Minimal .env loader: KEY=VALUE lines, # comments, no quoting gymnastics.
if (existsSync(ENV_FILE)) {
  for (const line of readFileSync(ENV_FILE, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    const value = t.slice(eq + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
  console.log(`[dev-proxy] loaded ${ENV_FILE}`);
} else {
  console.warn('[dev-proxy] no .env.local found — /api/chat will return "not configured". See .env.example.');
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolveBody(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function route(req) {
  // req is a Web Request here, so .url is absolute — extract the pathname.
  const path = new URL(req.url).pathname;
  if (path === '/api/key-status') return handleKeyStatus(req);
  if (path === '/api/chat') return handleChat(req);
  return new Response(JSON.stringify({ error: { message: 'Not found.' } }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' }
  });
}

createServer(async (req, res) => {
  try {
    const bodyBuffer = await readBody(req);
    const request = new Request(`http://127.0.0.1:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: req.method === 'GET' || req.method === 'HEAD' ? undefined : bodyBuffer
    });
    const response = await route(request);
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: `dev-proxy crash: ${e.message}` } }));
  }
}).listen(PORT, () => {
  console.log(`[dev-proxy] listening on http://127.0.0.1:${PORT} (/api/chat, /api/key-status)`);
});
