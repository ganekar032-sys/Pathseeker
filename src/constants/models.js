// OpenRouter model IDs offered in the model selector dropdown.
// The "custom" sentinel lets the user type any OpenRouter model ID.
// NOTE: the first five IDs are also the shared-access allowlist enforced by
// /api/_handler.js — keep the two lists in sync. Shared access serves these
// known free-tier models only; custom IDs require the user's own key.

export const MODEL_OPTIONS = [
  { id: 'openrouter/free', label: 'Free Models Router (default — no credits needed)' },
  { id: 'google/gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: '~deepseek/deepseek-v4-flash-latest', label: 'DeepSeek V4 Flash (latest)' },
  { id: '~moonshotai/kimi-latest', label: 'Kimi (latest)' },
  { id: 'anthropic/claude-opus-5-fast', label: 'Claude Opus 5 (Fast)' },
  { id: '__custom__', label: 'Custom model ID…' }
];

export const DEFAULT_MODEL = 'openrouter/free';

// Used only when validating a user's OWN key ("Test API Key" does a tiny
// completion). Must be a free model so a $0-credit key passes the check.
export const TEST_MODEL = 'openrouter/free';
