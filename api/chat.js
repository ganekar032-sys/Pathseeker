// Vercel serverless endpoint: POST /api/chat
// Proxies chat completions to OpenRouter using the server-side shared key.
// See _handler.js for validation, model allowlist and rate limiting.

import { handleChat } from './_handler.js';

// Long LLM generations need more than the default 10s window.
export const maxDuration = 60;

export default function handler(request) {
  return handleChat(request);
}
