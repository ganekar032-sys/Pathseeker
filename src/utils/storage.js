// ---------------------------------------------------------------------------
// Pathseeker — Persistence Split Strategy
//
//   • OpenRouter API key  -> React in-memory state by default.
//                            Optional "Remember for this session" checkbox
//                            stores it in sessionStorage (cleared when the
//                            browser closes). NEVER localStorage/cookies.
//   • Parsed JHora data   -> localStorage (survives reloads), with a visible
//                            "Clear My Data" wipe.
//   • Chat log            -> React state only; exportable as .txt.
// ---------------------------------------------------------------------------

const CHART_DATA_KEY = 'pathseeker.chartData.v1';
const RAW_INPUT_KEY = 'pathseeker.rawInput.v1';
const SESSION_API_KEY = 'pathseeker.apiKey.session';

// --- Chart data (localStorage) ---

export function saveChartData(data) {
  try {
    localStorage.setItem(CHART_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save chart data', e);
  }
}

export function loadChartData() {
  try {
    const raw = localStorage.getItem(CHART_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Raw textarea contents so the user can re-edit after a reload.
export function saveRawInput(sections) {
  try {
    localStorage.setItem(RAW_INPUT_KEY, JSON.stringify(sections));
  } catch (e) {
    console.error('Failed to save raw input', e);
  }
}

export function loadRawInput() {
  try {
    const raw = localStorage.getItem(RAW_INPUT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAllLocalData() {
  localStorage.removeItem(CHART_DATA_KEY);
  localStorage.removeItem(RAW_INPUT_KEY);
}

// --- API key (sessionStorage, opt-in only) ---

export function saveSessionApiKey(key) {
  try {
    sessionStorage.setItem(SESSION_API_KEY, key);
  } catch (e) {
    console.error('Failed to save session key', e);
  }
}

export function loadSessionApiKey() {
  try {
    return sessionStorage.getItem(SESSION_API_KEY) || '';
  } catch {
    return '';
  }
}

export function clearSessionApiKey() {
  try {
    sessionStorage.removeItem(SESSION_API_KEY);
  } catch {
    /* ignore */
  }
}
