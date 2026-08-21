// Sanity test: runs the local parser against real JHora sample files.
// Usage: node scripts/test-parser.mjs
//
// Samples live OUTSIDE the repo at <workspace>/jhora-samples/ because they
// contain real birth data and must never be committed to the public GitHub
// repo. The path is resolved relative to this script, so it keeps working
// no matter where the workspace folder lives or what the app folder is named.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJHoraInput, validateChartData } from '../src/utils/parser.js';

const SAMPLES_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../../jhora-samples');
const read = (f) => {
  const p = resolve(SAMPLES_DIR, f);
  if (!existsSync(p)) {
    console.error(
      `\nMissing sample file: ${p}\n` +
        'The jhora-samples/ folder is private (real birth data) and not part of the repo.\n' +
        'Run this test only on machines that have that folder.'
    );
    process.exit(1);
  }
  return readFileSync(p, 'utf8');
};

const data = parseJHoraInput({
  space: {
    rasi: read('d1-rasi-chart.txt'),
    d9: read('d9-navamsa-chart.txt'),
    d10: read('d10-dasamsa-chart.txt')
  },
  time: {
    vimshottari: read('vimshottari-mahadashas.txt'),
    antardashas: read('antardashas-within-md.txt'),
    pratyantardashas: read('pratyantardashas-within-ad.txt'),
    tithiPravesha: { label: '2026 Tithi Pravesha', text: read('2026-tithi-pravesha-chart.txt') },
    tajaka: { label: '2026 Tajaka', text: read('2026-tajaka-chart.txt') }
  },
  transits: { label: '', text: '' }
});

const summary = {};
for (const [k, c] of Object.entries(data.space.charts)) {
  summary[k] = {
    vargaHint: c.vargaHint,
    bodies: c.bodyCount,
    grahas: Object.keys(c.bodies.grahas).length,
    arudhas: Object.keys(c.bodies.arudhaPadas).length,
    unparsed: c.unparsedLines
  };
}
console.log('CHARTS:', JSON.stringify(summary, null, 2));

console.log('\nSAMPLE Rasi Sun:', JSON.stringify(data.space.charts.rasi.bodies.grahas.Sun));
console.log('SAMPLE Rasi Jupiter (retro+karaka):', JSON.stringify(data.space.charts.rasi.bodies.grahas.Jupiter));
console.log('SAMPLE Rasi Lagna:', JSON.stringify(data.space.charts.rasi.bodies.lagna));
console.log('SAMPLE D10 AL:', JSON.stringify(data.space.charts.d10.bodies.arudhaPadas.AL));
console.log('SAMPLE Tajaka Muntha:', JSON.stringify(data.time.tajaka.bodies.tajakaPoints.Muntha));

const v = data.time.vimshottari;
console.log('\nDASHA system:', v.system);
console.log('Mahadashas:', v.mahadashas.length, '| first:', JSON.stringify(v.mahadashas[0]), '| last:', JSON.stringify(v.mahadashas.at(-1)));
console.log('Antardasha blocks:', v.antardashas.map((b) => `${b.mahadasha} MD -> ${b.periods.length} ADs`));
console.log('Pratyantar blocks:', v.pratyantardashas.map((b) => `${b.mahadasha}-${b.antardasha} -> ${b.periods.length} PDs`));
console.log('Dasha unparsed lines:', v.unparsedLines);

console.log('\nVALIDATION WARNINGS:', validateChartData(data));
