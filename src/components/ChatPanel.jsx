import { useEffect, useRef, useState } from 'react';
import { MODEL_OPTIONS, DEFAULT_MODEL } from '../constants/models';
import { ENQUIRY_CATEGORIES } from '../constants/categories';
import { buildApiMessages, MAX_HISTORY_PAIRS } from '../constants/prompts';
import { sendChatCompletion } from '../utils/openrouter';
import { exportChatAsTxt } from '../utils/exportChat';

/**
 * Step 5 & 6 — Chat interface, single-pipe inference, export.
 * Pinned Context strategy: every request = system prompt (guardrails +
 * category focus + full chart JSON) + only the last N message pairs.
 */
export default function ChatPanel({ apiKey, chartData }) {
  const [messages, setMessages] = useState([]); // { role, content }
  const [input, setInput] = useState('');
  const [modelChoice, setModelChoice] = useState(DEFAULT_MODEL);
  const [customModel, setCustomModel] = useState('');
  const [categoryId, setCategoryId] = useState(ENQUIRY_CATEGORIES[0].id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const category = ENQUIRY_CATEGORIES.find((c) => c.id === categoryId);
  const effectiveModel = modelChoice === '__custom__' ? customModel.trim() : modelChoice;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function handleSend() {
    const question = input.trim();
    if (!question || busy) return;
    if (!effectiveModel) {
      setError('Select a model (or enter a custom model ID).');
      return;
    }
    // No apiKey means shared demo access: the request goes through this
    // deployment's /api/chat proxy. Errors (rate limits, exhausted pool,
    // non-free models) surface verbatim below so the user can react.

    setError(null);
    const nextMessages = [...messages, { role: 'user', content: question }];
    setMessages(nextMessages);
    setInput('');
    setBusy(true);

    try {
      const apiMessages = buildApiMessages(chartData, category, nextMessages);
      const reply = await sendChatCompletion(apiKey, effectiveModel, apiMessages);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e.message);
      // Roll the failed user message back into the input box for retry.
      setMessages(messages);
      setInput(question);
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <section className="panel chat-panel">
      <div className="chat-toolbar">
        <label>
          Model{' '}
          <select value={modelChoice} onChange={(e) => setModelChoice(e.target.value)}>
            {MODEL_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        {modelChoice === '__custom__' && (
          <input
            className="text-input compact"
            placeholder="vendor/model-id"
            value={customModel}
            onChange={(e) => setCustomModel(e.target.value)}
            spellCheck={false}
          />
        )}
        <label>
          Category of Enquiry{' '}
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {ENQUIRY_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="btn"
          onClick={() => exportChatAsTxt(messages, { model: effectiveModel, categoryLabel: category?.label })}
          disabled={messages.length === 0}
        >
          Export .txt
        </button>
      </div>

      {!chartData && (
        <p className="status err">
          No chart data loaded — the model will ask you to paste JHora data before interpreting.
        </p>
      )}

      <div className="chat-window">
        {messages.length === 0 && (
          <p className="muted center">
            Ask a question. The full chart data, classical Parasara/Jaimini guardrails and the
            zero-calculation rule are attached invisibly to every request.
            Only the last {MAX_HISTORY_PAIRS} exchanges are kept in context.
            {!apiKey && ' You are on shared demo access (rate-limited free models) — paste your own key in Setup for unlimited use.'}
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div className="bubble-role">{m.role === 'user' ? 'You' : 'Pathseeker'}</div>
            <div className="bubble-content">{m.content}</div>
          </div>
        ))}
        {busy && <div className="bubble assistant"><div className="bubble-content muted">Interpreting…</div></div>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="status err">{error}</p>}

      <div className="chat-input-row">
        <textarea
          className="chat-input"
          rows={2}
          placeholder="e.g., What does my D10 indicate about career direction during the current mahadasha?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="btn primary" onClick={handleSend} disabled={busy || !input.trim()}>
          Send
        </button>
      </div>
    </section>
  );
}
