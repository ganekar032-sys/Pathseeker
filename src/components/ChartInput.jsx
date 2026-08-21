import { useState } from 'react';
import { parseJHoraInput, validateChartData } from '../utils/parser';
import { saveChartData, saveRawInput, clearAllLocalData } from '../utils/storage';

// JHora copied text does not name its own chart (only a "(in D-9)" header hint),
// so each paste gets its own labeled slot. The parser cross-checks header hints
// against the slot and warns on mismatches.

const EMPTY_INPUT = {
  space: { rasi: '', d9: '', d10: '', d4: '', extraVargas: [] },
  time: {
    vimshottari: '',
    antardashas: '',
    pratyantardashas: '',
    tithiPravesha: { label: '', text: '' },
    tajaka: { label: '', text: '' }
  },
  transits: { label: '', text: '' }
};

function PasteBox({ label, hint, value, onChange, rows = 8 }) {
  return (
    <div className="paste-slot">
      <label className="slot-label">{label}</label>
      {hint && <p className="muted small">{hint}</p>}
      <textarea
        className="paste-area"
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Paste verbatim JHora copy here…"
      />
    </div>
  );
}

export default function ChartInput({ initialRaw, onParsed, onCleared }) {
  const [input, setInput] = useState(() => ({
    ...EMPTY_INPUT,
    ...(initialRaw || {}),
    space: { ...EMPTY_INPUT.space, ...(initialRaw?.space || {}) },
    time: { ...EMPTY_INPUT.time, ...(initialRaw?.time || {}) },
    transits: { ...EMPTY_INPUT.transits, ...(initialRaw?.transits || {}) }
  }));
  const [openSection, setOpenSection] = useState('space');
  const [warnings, setWarnings] = useState([]);
  const [savedAt, setSavedAt] = useState(null);

  function setSpace(key, value) {
    setInput((s) => ({ ...s, space: { ...s.space, [key]: value } }));
  }
  function setTime(key, value) {
    setInput((s) => ({ ...s, time: { ...s.time, [key]: value } }));
  }
  function setExtraVarga(i, patch) {
    setInput((s) => {
      const extraVargas = s.space.extraVargas.map((v, idx) => (idx === i ? { ...v, ...patch } : v));
      return { ...s, space: { ...s.space, extraVargas } };
    });
  }

  function handleParse() {
    const data = parseJHoraInput(input);
    setWarnings(validateChartData(data));
    saveChartData(data);
    saveRawInput(input);
    setSavedAt(new Date().toLocaleTimeString());
    onParsed(data);
  }

  function handleClear() {
    if (!window.confirm('Wipe all chart data from this browser (localStorage)?')) return;
    clearAllLocalData();
    setInput(EMPTY_INPUT);
    setWarnings([]);
    setSavedAt(null);
    onCleared();
  }

  const sections = [
    {
      id: 'space',
      title: 'Section A — Space (Charts)',
      body: (
        <>
          <PasteBox
            label="Rasi (D1) — mandatory"
            hint="JHora: right-click D1 chart → copy body positions."
            value={input.space.rasi}
            onChange={(v) => setSpace('rasi', v)}
          />
          <PasteBox
            label="Navamsa (D9) — mandatory"
            value={input.space.d9}
            onChange={(v) => setSpace('d9', v)}
          />
          <PasteBox
            label="Dasamsa (D10) — mandatory"
            value={input.space.d10}
            onChange={(v) => setSpace('d10', v)}
          />
          <PasteBox
            label="Chaturthamsa (D4) — optional"
            value={input.space.d4}
            onChange={(v) => setSpace('d4', v)}
          />
          {input.space.extraVargas.map((v, i) => (
            <div key={i} className="paste-slot">
              <input
                className="text-input compact"
                placeholder="Varga name, e.g. D7 Saptamsa"
                value={v.label}
                onChange={(e) => setExtraVarga(i, { label: e.target.value })}
              />
              <textarea
                className="paste-area"
                rows={8}
                value={v.text}
                onChange={(e) => setExtraVarga(i, { text: e.target.value })}
                spellCheck={false}
                placeholder="Paste verbatim JHora copy here…"
              />
            </div>
          ))}
          <button
            className="btn"
            onClick={() =>
              setInput((s) => ({
                ...s,
                space: { ...s.space, extraVargas: [...s.space.extraVargas, { label: '', text: '' }] }
              }))
            }
          >
            + Add another varga
          </button>
        </>
      )
    },
    {
      id: 'time',
      title: 'Section B — Time (Dashas & Annual Charts)',
      body: (
        <>
          <PasteBox
            label="Vimshottari Maha Dashas — mandatory"
            hint='JHora: dasha tab → copy the "Maha Dasas:" listing.'
            value={input.time.vimshottari}
            onChange={(v) => setTime('vimshottari', v)}
            rows={10}
          />
          <PasteBox
            label="Antardasha listings — optional"
            hint='Paste one or more "Antardasas in this MD:" blocks (concatenating several is fine).'
            value={input.time.antardashas}
            onChange={(v) => setTime('antardashas', v)}
          />
          <PasteBox
            label="Pratyantardasha listings — optional"
            hint='Paste one or more "Pratyantardasas in this AD:" blocks.'
            value={input.time.pratyantardashas}
            onChange={(v) => setTime('pratyantardashas', v)}
          />
          <div className="paste-slot">
            <label className="slot-label">Tithi Pravesha annual chart — optional</label>
            <input
              className="text-input compact"
              placeholder="Year label, e.g. 2026 Tithi Pravesha"
              value={input.time.tithiPravesha.label}
              onChange={(e) => setTime('tithiPravesha', { ...input.time.tithiPravesha, label: e.target.value })}
            />
            <textarea
              className="paste-area"
              rows={8}
              value={input.time.tithiPravesha.text}
              onChange={(e) => setTime('tithiPravesha', { ...input.time.tithiPravesha, text: e.target.value })}
              spellCheck={false}
              placeholder="Paste verbatim JHora copy here…"
            />
          </div>
          <div className="paste-slot">
            <label className="slot-label">Tajaka annual chart — optional</label>
            <input
              className="text-input compact"
              placeholder="Year label, e.g. 2026 Tajaka"
              value={input.time.tajaka.label}
              onChange={(e) => setTime('tajaka', { ...input.time.tajaka, label: e.target.value })}
            />
            <textarea
              className="paste-area"
              rows={8}
              value={input.time.tajaka.text}
              onChange={(e) => setTime('tajaka', { ...input.time.tajaka, text: e.target.value })}
              spellCheck={false}
              placeholder="Paste verbatim JHora copy here…"
            />
          </div>
        </>
      )
    },
    {
      id: 'transits',
      title: 'Section C — Transits (Optional)',
      body: (
        <div className="paste-slot">
          <label className="slot-label">Gochara positions</label>
          <input
            className="text-input compact"
            placeholder="Transit date label, e.g. Transits on 2026-01-15"
            value={input.transits.label}
            onChange={(e) => setInput((s) => ({ ...s, transits: { ...s.transits, label: e.target.value } }))}
          />
          <textarea
            className="paste-area"
            rows={8}
            value={input.transits.text}
            onChange={(e) => setInput((s) => ({ ...s, transits: { ...s.transits, text: e.target.value } }))}
            spellCheck={false}
            placeholder="Paste verbatim JHora copy here…"
          />
        </div>
      )
    }
  ];

  return (
    <section className="panel">
      <h2>Step 2 — Paste JHora Data</h2>
      <p className="muted">
        Parsing runs entirely in your browser (regex only — zero LLM tokens). Parsed JSON is
        saved to localStorage and survives reloads. Each chart gets its own labeled box because
        JHora's copied text doesn't name the chart internally.
      </p>
      <p className="muted small">
        📖 New to Jagannatha Hora? Follow the{' '}
        <a href="/docs/jhora-instructions.pdf" target="_blank" rel="noreferrer">
          step-by-step JHora instructions (PDF)
        </a>{' '}
        — how to copy chart positions, dasha tables and transits verbatim into the boxes below.
        Don't have JHora yet?{' '}
        <a href="https://www.vedicastrologer.org/jh/jh_full_install.zip" target="_blank" rel="noreferrer">
          ⬇️ Download it free (≈102 MB zip)
        </a>{' '}
        from vedicastrologer.org.
      </p>

      {sections.map((s) => (
        <div key={s.id} className="accordion">
          <button
            className={`accordion-header ${openSection === s.id ? 'open' : ''}`}
            onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
          >
            {s.title}
          </button>
          {openSection === s.id && <div className="accordion-body">{s.body}</div>}
        </div>
      ))}

      <div className="field-row">
        <button className="btn primary" onClick={handleParse}>
          Parse &amp; Save Locally
        </button>
        <button className="btn danger" onClick={handleClear}>
          Clear My Data
        </button>
        {savedAt && <span className="muted small">Saved at {savedAt}</span>}
      </div>

      {warnings.length > 0 && (
        <div className="warnings">
          <strong>Parser warnings:</strong>
          <ul>
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
