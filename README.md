# Pathseeker

A conversational, web-based **Jyotish (Vedic Astrology) interpretation engine** for research and personal use.

- **Interpretation only** — strictly classical Parasara (BPHS), Jaimini Sutras, and core Vedic tenets. No KP, Lal Kitab, or BNN.
- **Zero AI-side calculations** — the LLM is forbidden from deriving varga positions, dasha dates, or transits. If data is missing, it asks you to paste it.
- **Works out of the box** — visitors get shared demo access through a small rate-limited proxy; no key or signup needed. Power users can paste their own OpenRouter key for direct browser-to-OpenRouter calls.
- **No database** — static SPA on Vercel plus two tiny serverless functions.

## Architecture at a Glance

| Data | Where it lives |
| --- | --- |
| Your own OpenRouter API key | React memory (optionally `sessionStorage` via checkbox — clears when browser closes). Never `localStorage`/cookies. |
| Shared demo-access key | Server-side only: `OPENROUTER_API_KEY` env var of the `/api/chat` function. Never in the client bundle. |
| Parsed JHora chart data | `localStorage` (survives reloads) + visible **Clear My Data** button |
| Chat log | React state, exportable as `.txt` |

JHora raw text is parsed **locally in the browser** with pure JavaScript/regex — zero LLM tokens are spent on parsing. Raw text is always preserved verbatim alongside the parsed JSON, so the LLM never loses information even when a line fails to parse.

Every chat request uses **Pinned Context + Last N Messages**: the system prompt (guardrails + zero-calculation enforcer + full chart JSON + category focus) always sits at the top, followed by only the last 5 user/assistant pairs.

## The /api Proxy (shared access)

Two serverless functions (`api/`), no other backend:

| Endpoint | Purpose |
| --- | --- |
| `POST /api/chat` | Validates the request, enforces rate limits and a free-tier model allowlist, injects `OPENROUTER_API_KEY`, forwards to OpenRouter. |
| `GET /api/key-status` | Reports whether shared access is configured and how much of today's pool remains — without exposing the key or burning quota. |

Throttling defaults (tunable via env vars): **6 requests/hour and 24/day per IP**, plus a **global 45/day** cap that keeps total usage under OpenRouter's own account-wide free-tier limit. Limits are in-memory per function instance — best-effort, not a fortress; the hard ceiling is OpenRouter's account cap, so abuse can degrade availability but can never cost money ($0-spend-limit key).

## Running Locally

```bash
npm install
cp .env.example .env.local        # then paste a dedicated OpenRouter key into it
node scripts/dev-proxy.mjs        # terminal 1 — serves /api on :8787
npm run dev                       # terminal 2 — Vite proxies /api there
```

Open http://localhost:5173. Without `.env.local`, shared mode reports "not configured" but your own pasted key still works.

## Deploying to Vercel

1. Push this folder to GitHub; import in Vercel (auto-detects Vite).
2. Create a **dedicated** OpenRouter key at [openrouter.ai/keys](https://openrouter.ai/keys) with a $0 spend limit. Rotate any key that ever shipped in source — treat it as burned.
3. In Vercel → Project → Settings → Environment Variables, add `OPENROUTER_API_KEY` (+ optionally the `RATE_LIMIT_*` overrides from `.env.example`) for Production and Preview.
4. Deploy. Verify: chat works with no key entered, and the deployed bundle contains no `sk-or-v1-` string (`curl -s https://<your-site>/assets/<bundle>.js | grep sk-or-v1` should find nothing).

## Usage Flow

1. **Setup** *(optional)* — paste your own OpenRouter key ([openrouter.ai/keys](https://openrouter.ai/keys)) and click **Test API Key**, or click **Test Shared Access** to check the shared pool. Skip this tab entirely to just use shared access.
2. **Chart Input** — paste verbatim JHora output into the three sections (Space / Time / Transits). Click **Parse & Save Locally**.
3. **Data Inspector** — verify exactly what the LLM will see.
4. **Chat** — pick a model and a Category of Enquiry, ask questions, and **Export .txt** anytime. Custom model IDs require your own key.

## Improving the Parser

`src/utils/parser.js` is deliberately tolerant/best-effort because JHora output varies by version. To tighten it, paste real JHora samples into the file's regexes (see comments at the top of the file). The app remains fully usable meanwhile because raw text is always sent verbatim.
