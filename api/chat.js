// Vercel serverless endpoint: POST /api/chat
// Proxies chat completions to OpenRouter using the server-side shared key.
// See _handler.js for validation, model allowlist and rate limiting.

import { handleChat } from './_handler.js';
import { nodeHandler } from './_nodeAdapter.js';

// Long LLM generations need more than the default 10s window.
export const maxDuration = 60;

export default nodeHandler(handleChat);
