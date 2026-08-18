// Sanity test: runs the local parser against the real JHora example files.
// Usage: node scripts/test-parser.mjs
import { readFileSync } from 'node:fs';
import { parseJHoraInput, validateChartData } from '../src/utils/parser.js';

const DIR = '/home/gaurav/Desktop/Pathseeker/example charts';
const read = (f) => readFileSync(`${DIR}/${f}`, 'utf8');

const data = parseJHoraInput({
  space: {
    rasi: read('d1 chart copied example.txt'),
    d9: read('d9 chart copied example.txt'),
    d10: read('d10 chart copied example.txt')
  },
  time: {
    vimshottari: read('complete vimshottari mahadasha copied example.txt'),
    antardashas: read('Antardasha list within MD example.txt'),
    pratyantardashas: read('pratyantardasha list within AD example.txt'),
    tithiPravesha: { label: '2026 Tithi Pravesha', text: read('2026 thithi pravesha chart example.txt') },
    tajaka: { label: '2026 Tajaka', text: read('2026 tajaka chart example.txt') }
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
