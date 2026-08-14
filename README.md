# Pathseeker

A conversational, web-based **Jyotish (Vedic Astrology) interpretation engine** for research and personal use.

- **Interpretation only** — strictly classical Parasara (BPHS), Jaimini Sutras, and core Vedic tenets. No KP, Lal Kitab, or BNN.
- **Zero AI-side calculations** — the LLM is forbidden from deriving varga positions, dasha dates, or transits. If data is missing, it asks you to paste it.
- **100% client-side** — no backend, no database. Deployable to Vercel free tier as a static site.

## Architecture at a Glance

| Data | Where it lives |
| --- | --- |
| OpenRouter API key | React memory (optionally `sessionStorage` via checkbox — clears when browser closes). Never `localStorage`/cookies. |
| Parsed JHora chart data | `localStorage` (survives reloads) + visible **Clear My Data** button |
| Chat log | React state, exportable as `.txt` |

JHora raw text is parsed **locally in the browser** with pure JavaScript/regex — zero LLM tokens are spent on parsing. Raw text is always preserved verbatim alongside the parsed JSON, so the LLM never loses information even when a line fails to parse.

Every chat request uses **Pinned Context + Last N Messages**: the system prompt (guardrails + zero-calculation enforcer + full chart JSON + category focus) always sits at the top, followed by only the last 5 user/assistant pairs.

## Running Locally

```bash
npm install
npm run dev
```

Open http://localhost:5173.

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. Import it in Vercel — it auto-detects Vite. Build command `npm run build`, output `dist`.
3. Done. No environment variables or servers needed.

## Usage Flow

1. **Setup** — paste your OpenRouter API key ([openrouter.ai/keys](https://openrouter.ai/keys)). Click **Test API Key** for a cheap validation call. Optionally tick "Remember for this session".
2. **Chart Input** — paste verbatim JHora output into the three sections (Space / Time / Transits). Click **Parse & Save Locally**.
3. **Data Inspector** — verify exactly what the LLM will see.
4. **Chat** — pick a model and a Category of Enquiry, ask questions, and **Export .txt** anytime.

## Improving the Parser

`src/utils/parser.js` is deliberately tolerant/best-effort because JHora output varies by version. To tighten it, paste real JHora samples into the file's regexes (see comments at the top of the file). The app remains fully usable meanwhile because raw text is always sent verbatim.
