// OpenRouter model IDs offered in the model selector dropdown.
// The "custom" sentinel lets the user type any OpenRouter model ID.

export const MODEL_OPTIONS = [
  { id: 'openrouter/free', label: 'Free Models Router (default — no credits needed)' },
  { id: 'google/gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: '~deepseek/deepseek-v4-flash-latest', label: 'DeepSeek V4 Flash (latest)' },
  { id: '~moonshotai/kimi-latest', label: 'Kimi (latest)' },
  { id: 'anthropic/claude-opus-5-fast', label: 'Claude Opus 5 (Fast)' },
  { id: '__custom__', label: 'Custom model ID…' }
];

export const DEFAULT_MODEL = 'openrouter/free';

// Used only by the "Test API Key" validation call. Must be a free model so
// the bundled $0-credit default key passes its own inference check.
export const TEST_MODEL = 'openrouter/free';
