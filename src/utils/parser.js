// ---------------------------------------------------------------------------
// Pathseeker — Local JHora Text Parser (v2)
// Runs 100% in the browser. Pure JavaScript string manipulation / Regex.
// ZERO LLM calls, ZERO tokens spent on parsing.
//
// Regexes are written against VERIFIED real JHora copy-paste samples:
//
//  Chart body line:
//    "Sun - AmK               22 Li 08' 32.56\" Visa      1    Li   Ar"
//    "Jupiter (R) - MK        18 Ge 09' 10.60\" Ardr      4    Ge   Pi"
//    "Lagna                    2 Sg 20' 26.19\" Mool      1    Sg   Ar"
//    "AL                       3 Cp 57' 55.02\" USha      3    Cp   Aq"
//  Chart header line (reveals the varga, when present):
//    "Body   Longitude (in D-9)   Nakshatra Pada Rasi Navamsa"
//    "Body   Longitude (in D-10 (5-8))   ..."  (D1/Tajaka/TP say just "Longitude")
//
//  Dasha lines:
//    "Vimsottari Dasa:"  /  " Maha Dasas:"
//    " Mars: 1986-10-15 (22:15:55) - 1993-10-15 (14:45:33)"
//    " Jup MD: 2011-10-15 (23:33:15) - 2027-10-15 (20:31:39)"
//    "  Antardasas in this MD:"  /  "   Pratyantardasas in this AD:"
// ---------------------------------------------------------------------------

const SIGNS = {
  Ar: 'Aries', Ta: 'Taurus', Ge: 'Gemini', Cn: 'Cancer', Le: 'Leo',
  Vi: 'Virgo', Li: 'Libra', Sc: 'Scorpio', Sg: 'Sagittarius',
  Cp: 'Capricorn', Aq: 'Aquarius', Pi: 'Pisces'
};
const SIGN_ABBR = Object.keys(SIGNS).join('|');

// "22 Li 08' 32.56\"" + trailing "Nakshatra Pada Rasi Navamsa" columns
const BODY_LINE_RE = new RegExp(
  `^(.+?)\\s+(\\d{1,2})\\s+(${SIGN_ABBR})\\s+(\\d{1,2})'\\s+(\\d{1,2}(?:\\.\\d+)?)"` +
    `\\s+(\\S+)\\s+([1-4])\\s+(${SIGN_ABBR})\\s+(${SIGN_ABBR})\\s*$`
);

// Header line: "Body   Longitude (in D-9)  ..." — captures varga number if present
const HEADER_RE = /^\s*Body\s+Longitude(?:\s*\(in\s+D-(\d+)[^)]*\))?/i;

// Name-part decorations: "(R)" retrograde flag and "- AmK" / "- PiK/PK" karakas
const KARAKA_RE = /\s*-\s*([A-Za-z]{2,4}(?:\/[A-Za-z]{2,4})*)\s*$/;
const RETRO_RE = /\s*\((R|SR)\)\s*/;

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const UPAGRAHAS = [
  'Maandi', 'Gulika', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indra Chapa',
  'Upaketu', 'Kaala', 'Mrityu', 'Artha Prahara', 'Yama Ghantaka'
];

function classifyBody(name) {
  if (name === 'Lagna') return 'lagna';
  if (GRAHAS.includes(name)) return 'grahas';
  if (/^A(L|\d{1,2})$/.test(name) || name === 'UL') return 'arudhaPadas';
  if (/^V\d{1,2}$/.test(name)) return 'varnadaPadas';
  if (/Lagna$/.test(name) || name === 'Bhrigu Bindu') return 'specialLagnas';
  if (UPAGRAHAS.includes(name)) return 'upagrahas';
  if (name === 'Muntha') return 'tajakaPoints';
  return 'sphutasAndOthers';
}

/**
 * Parses one verbatim JHora chart paste (D1/varga/Tajaka/Tithi Pravesha).
 * Returns { vargaHint, bodies: {grouped}, bodyCount, unparsedLines }.
 */
export function parseChart(text) {
  const bodies = {
    lagna: {}, grahas: {}, arudhaPadas: {}, specialLagnas: {},
    upagrahas: {}, varnadaPadas: {}, tajakaPoints: {}, sphutasAndOthers: {}
  };
  let vargaHint = null;
  let bodyCount = 0;
  const unparsedLines = [];

  if (!text || !text.trim()) return { vargaHint, bodies, bodyCount, unparsedLines };

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;

    const header = line.match(HEADER_RE);
    if (header) {
      vargaHint = header[1] ? `D-${header[1]}` : 'D-1 or annual chart (plain Longitude header)';
      continue;
    }

    const m = line.match(BODY_LINE_RE);
    if (!m) {
      unparsedLines.push(line.trim());
      continue;
    }

    let namePart = m[1].trim();
    const retrograde = RETRO_RE.test(namePart);
    namePart = namePart.replace(RETRO_RE, ' ').trim();
    const karakaMatch = namePart.match(KARAKA_RE);
    const karaka = karakaMatch ? karakaMatch[1] : undefined;
    const name = namePart.replace(KARAKA_RE, '').trim();

    const entry = {
      longitude: `${m[2]} ${m[3]} ${m[4]}' ${m[5]}"`,
      sign: SIGNS[m[3]],
      degrees: Number(m[2]),
      minutes: Number(m[4]),
      nakshatra: m[6],
      pada: Number(m[7])
    };
    if (retrograde) entry.retrograde = true;
    if (karaka) entry.jaiminiKaraka = karaka;

    const group = classifyBody(name);
    if (group === 'lagna') bodies.lagna = { ...entry, body: 'Lagna' };
    else bodies[group][name] = entry;
    bodyCount++;
  }

  return { vargaHint, bodies, bodyCount, unparsedLines };
}

// --- Dashas -----------------------------------------------------------------

const DASHA_PERIOD_RE =
  /^\s*(Sun|Moon|Mars|Merc|Jup|Ven|Sat|Rah|Ket)(?:\s+(MD|AD))?:\s*(\d{4}-\d{2}-\d{2})\s*\(([\d:]+)\)\s*-\s*(\d{4}-\d{2}-\d{2})\s*\(([\d:]+)\)\s*$/;

const LORD_FULL = {
  Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Merc: 'Mercury', Jup: 'Jupiter',
  Ven: 'Venus', Sat: 'Saturn', Rah: 'Rahu', Ket: 'Ketu'
};

/**
 * Parses JHora Vimshottari output. Handles all three verified shapes:
 *  - "Maha Dasas:" listing (period lines are mahadashas)
 *  - "X MD:" + "Antardasas in this MD:" (period lines are antardashas of X)
 *  - "X MD:" + "Y AD:" + "Pratyantardasas in this AD:" (lines are PDs of X-Y)
 * Multiple blocks concatenated in one paste are fine.
 */
export function parseDashas(text) {
  const mahadashas = [];
  const antardashas = [];        // { mahadasha, periods: [] }
  const pratyantardashas = [];   // { mahadasha, antardasha, periods: [] }
  const unparsedLines = [];

  if (!text || !text.trim()) {
    return { system: null, mahadashas, antardashas, pratyantardashas, unparsedLines };
  }

  let system = null;
  let mode = 'MD';               // what plain "Lord: dates" lines mean right now
  let currentMD = null;
  let currentAD = null;
  let adBucket = null;
  let pdBucket = null;

  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;

    if (/Dasa\s*:\s*$/i.test(t)) {
      system = t.replace(/\s*:\s*$/, '');
      continue;
    }
    if (/^Maha\s*Dasas\s*:/i.test(t)) {
      mode = 'MD';
      currentMD = null;
      currentAD = null;
      continue;
    }
    if (/^Antardasas in this MD\s*:/i.test(t)) {
      mode = 'AD';
      adBucket = { mahadasha: currentMD, periods: [] };
      antardashas.push(adBucket);
      continue;
    }
    if (/^Pratyantardasas in this AD\s*:/i.test(t)) {
      mode = 'PD';
      pdBucket = { mahadasha: currentMD, antardasha: currentAD, periods: [] };
      pratyantardashas.push(pdBucket);
      continue;
    }

    const m = line.match(DASHA_PERIOD_RE);
    if (!m) {
      unparsedLines.push(t);
      continue;
    }

    const period = {
      lord: LORD_FULL[m[1]],
      start: `${m[3]} (${m[4]})`,
      end: `${m[5]} (${m[6]})`
    };

    if (m[2] === 'MD') {
      currentMD = period.lord;
      currentAD = null;
      continue; // context line, not a listing entry
    }
    if (m[2] === 'AD') {
      currentAD = period.lord;
      continue; // context line
    }

    if (mode === 'AD' && adBucket) adBucket.periods.push(period);
    else if (mode === 'PD' && pdBucket) pdBucket.periods.push(period);
    else mahadashas.push(period);
  }

  return { system: system || 'Vimsottari Dasa', mahadashas, antardashas, pratyantardashas, unparsedLines };
}

// --- Master assembly ---------------------------------------------------------

/**
 * @param {object} input
 *   space:    { rasi, d9, d10, d4, extraVargas: [{ label, text }] }  (raw texts)
 *   time:     { vimshottari, antardashas, pratyantardashas,
 *               tithiPravesha: { label, text }, tajaka: { label, text } }
 *   transits: { label, text }
 */
export function parseJHoraInput(input) {
  const charts = {};

  const fixedSlots = [
    ['rasi', input.space?.rasi],
    ['d9', input.space?.d9],
    ['d10', input.space?.d10],
    ['d4', input.space?.d4]
  ];
  for (const [key, text] of fixedSlots) {
    if (text && text.trim()) charts[key] = { ...parseChart(text), rawText: text.trim() };
  }
  for (const extra of input.space?.extraVargas || []) {
    if (extra.text && extra.text.trim()) {
      const key = (extra.label || 'varga').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      charts[key] = { label: extra.label, ...parseChart(extra.text), rawText: extra.text.trim() };
    }
  }

  // All dasha pastes go through the same hierarchical parser; concatenation is safe.
  const dashaText = [input.time?.vimshottari, input.time?.antardashas, input.time?.pratyantardashas]
    .filter(Boolean)
    .join('\n');
  const vimshottari = { ...parseDashas(dashaText), rawText: dashaText.trim() };

  const time = { vimshottari };
  if (input.time?.tithiPravesha?.text?.trim()) {
    time.tithiPravesha = {
      label: input.time.tithiPravesha.label || 'Tithi Pravesha annual chart',
      ...parseChart(input.time.tithiPravesha.text),
      rawText: input.time.tithiPravesha.text.trim()
    };
  }
  if (input.time?.tajaka?.text?.trim()) {
    time.tajaka = {
      label: input.time.tajaka.label || 'Tajaka annual chart',
      ...parseChart(input.time.tajaka.text),
      rawText: input.time.tajaka.text.trim()
    };
  }

  let transits = null;
  if (input.transits?.text?.trim()) {
    transits = {
      label: input.transits.label || 'Transit (Gochara) positions',
      ...parseChart(input.transits.text),
      rawText: input.transits.text.trim()
    };
  }

  return {
    meta: {
      parsedAt: new Date().toISOString(),
      parser: 'pathseeker-jhora-regex-v2',
      source: 'Jagannatha Hora verbatim copy, parsed locally in browser'
    },
    space: { charts },
    time,
    transits
  };
}

/**
 * Validation warnings: mandatory sections + varga-header mismatches
 * (e.g., a "(in D-9)" paste dropped into the D10 box).
 */
export function validateChartData(data) {
  const warnings = [];
  const charts = data?.space?.charts || {};

  const mandatory = [
    ['rasi', 'Rasi (D1)'],
    ['d9', 'Navamsa (D9)'],
    ['d10', 'Dasamsa (D10)']
  ];
  for (const [key, label] of mandatory) {
    const c = charts[key];
    if (!c || c.bodyCount === 0) {
      warnings.push(`${label} chart missing or unparsed — this is mandatory.`);
    } else if (Object.keys(c.bodies.grahas).length < 9) {
      warnings.push(`${label}: only ${Object.keys(c.bodies.grahas).length}/9 grahas detected — check the paste.`);
    }
  }

  const expectedHint = { d9: 'D-9', d10: 'D-10', d4: 'D-4' };
  for (const [key, expected] of Object.entries(expectedHint)) {
    const hint = charts[key]?.vargaHint;
    if (hint && /^D-\d+$/.test(hint) && hint !== expected) {
      warnings.push(`The ${expected} box contains a chart whose header says "${hint}" — possible wrong paste.`);
    }
  }
  const rasiHint = charts.rasi?.vargaHint;
  if (rasiHint && /^D-\d+$/.test(rasiHint)) {
    warnings.push(`The Rasi box contains a chart whose header says "${rasiHint}" — possible wrong paste.`);
  }

  if (!data?.time?.vimshottari?.mahadashas?.length && !data?.time?.vimshottari?.antardashas?.length) {
    warnings.push('Vimshottari dasha periods not detected — the mahadasha listing is mandatory.');
  }

  for (const [key, c] of Object.entries(charts)) {
    if (c.unparsedLines?.length) {
      warnings.push(`${key}: ${c.unparsedLines.length} line(s) did not parse (kept verbatim in rawText).`);
    }
  }
  return warnings;
}

