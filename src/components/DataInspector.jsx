/**
 * Step 4 — Read-only inspection tab.
 * Shows exactly the structured JSON the LLM will receive, so the user can
 * verify the parse before chatting.
 */
export default function DataInspector({ chartData }) {
  if (!chartData) {
    return (
      <section className="panel">
        <h2>Data Inspector</h2>
        <p className="muted">
          No chart data parsed yet. Go to the <strong>Chart Input</strong> tab, paste your
          JHora output and click <em>Parse &amp; Save Locally</em>.
        </p>
      </section>
    );
  }

  const charts = chartData.space?.charts || {};
  const chartKeys = Object.keys(charts);
  const v = chartData.time?.vimshottari || {};

  return (
    <section className="panel">
      <h2>Data Inspector (read-only)</h2>
      <p className="muted">
        This is the exact JSON injected into every LLM request. Raw pasted text is kept
        locally under <code>rawText</code> (not sent to the LLM — the parsed structure is
        complete; any unparsed lines are listed under <code>unparsedLines</code> and ARE sent).
      </p>

      <div className="inspector-summary">
        <span className="chip">Charts: {chartKeys.length ? chartKeys.join(', ') : 'none'}</span>
        <span className="chip">Mahadashas: {v.mahadashas?.length || 0}</span>
        <span className="chip">Antardasha blocks: {v.antardashas?.length || 0}</span>
        <span className="chip">Pratyantar blocks: {v.pratyantardashas?.length || 0}</span>
        <span className="chip">Annual charts: {[chartData.time?.tithiPravesha, chartData.time?.tajaka].filter(Boolean).length}</span>
        <span className="chip">Transits: {chartData.transits ? 'yes' : 'no'}</span>
        <span className="chip">Parsed: {chartData.meta?.parsedAt}</span>
      </div>

      <pre className="json-view">{JSON.stringify(chartData, null, 2)}</pre>
    </section>
  );
}

