// OpenRouter model IDs offered in the model selector dropdown.
// The "custom" sentinel lets the user type any OpenRouter model ID.

export const MODEL_OPTIONS = [
  { id: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
  { id: 'openai/gpt-4o', label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'deepseek/deepseek-chat', label: 'DeepSeek V3' },
  { id: 'deepseek/deepseek-r1', label: 'DeepSeek R1' },
  { id: 'google/gemini-flash-1.5', label: 'Gemini 1.5 Flash' },
  { id: 'meta-llama/llama-3.1-70b-instruct', label: 'Llama 3.1 70B' },
  { id: '__custom__', label: 'Custom model ID…' }
];

export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

// Cheap model used only by the "Test API Key" validation call.
export const TEST_MODEL = 'openai/gpt-4o-mini';
