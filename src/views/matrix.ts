import {
  STATES, STATE_NAMES, CATEGORY_IDS, CATEGORY_MAP,
  getYearData, ratePer100k, LATEST_YEAR, type StateCode,
} from '../data';
import { formatRate } from '../utils';
import { glossarySpan } from '../tooltip';

export function renderMatrix(container: HTMLElement): void {
  const latestData = getYearData(LATEST_YEAR);

  // Build matrix: rows = states, cols = categories
  // Cell value = rate per 100k, normalized per column for color intensity
  const matrix: { state: StateCode; rates: { cat: string; rate: number; normalized: number }[] }[] = [];

  // First pass: compute all rates
  const rawRates: Record<string, number[]> = {};
  for (const cat of CATEGORY_IDS) {
    rawRates[cat] = latestData.map(r => ratePer100k(r.offences[cat] || 0, r.population));
  }

  // Normalize per column
  for (const record of latestData) {
    const rates = CATEGORY_IDS.map(cat => {
      const rate = ratePer100k(record.offences[cat] || 0, record.population);
      const colRates = rawRates[cat];
      const min = Math.min(...colRates);
      const max = Math.max(...colRates);
      const normalized = max === min ? 0.5 : (rate - min) / (max - min);
      return { cat, rate, normalized };
    });
    matrix.push({ state: record.state as StateCode, rates });
  }

  const cellW = 72;
  const cellH = 36;
  const labelW = 50;
  const headerH = 120;
  const svgW = labelW + CATEGORY_IDS.length * cellW + 10;
  const svgH = headerH + STATES.length * cellH + 10;

  container.innerHTML = `
    <div class="matrix-view">
      <div class="panel">
        <h3 class="panel-title">Crime Rate ${glossarySpan('Cross-Reference Matrix')} (${LATEST_YEAR})</h3>
        <p class="panel-subtitle">Rows = states, columns = offence categories. Colour intensity shows ${glossarySpan('rate per 100K')} relative to other states in the same category. Darker = higher rate. Hover cells for exact values.</p>
        <div class="matrix-scroll">
          <svg viewBox="0 0 ${svgW} ${svgH}" class="matrix-svg" id="matrix-svg"></svg>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">Reading the Matrix</h3>
        <ul class="info-list">
          <li><strong>Rows</strong> show one state's crime profile across all categories</li>
          <li><strong>Columns</strong> compare all states for one category</li>
          <li><strong>Dark cells</strong> indicate the highest rate in that column — the state with the most crime of that type relative to population</li>
          <li>The ${glossarySpan('NT')} typically shows the darkest cells for person offences (${glossarySpan('assault')}, ${glossarySpan('sexual assault')}) due to higher ${glossarySpan('per capita')} rates</li>
          <li>Use this view to identify which states are outliers in which categories</li>
        </ul>
      </div>
    </div>
  `;

  const svg = document.getElementById('matrix-svg');
  if (!svg) return;

  let svgContent = '';

  // Column headers (rotated category labels)
  for (let ci = 0; ci < CATEGORY_IDS.length; ci++) {
    const x = labelW + ci * cellW + cellW / 2;
    svgContent += `
      <text x="${x}" y="${headerH - 8}" text-anchor="start" transform="rotate(-45, ${x}, ${headerH - 8})" class="matrix-header">${CATEGORY_MAP[CATEGORY_IDS[ci]].label}</text>
    `;
  }

  // Rows
  for (let ri = 0; ri < matrix.length; ri++) {
    const row = matrix[ri];
    const y = headerH + ri * cellH;

    // Row label
    svgContent += `<text x="${labelW - 6}" y="${y + cellH / 2 + 4}" text-anchor="end" class="matrix-label">${row.state}</text>`;

    // Cells
    for (let ci = 0; ci < row.rates.length; ci++) {
      const cell = row.rates[ci];
      const x = labelW + ci * cellW;
      const catColor = CATEGORY_MAP[cell.cat].color;

      // Interpolate opacity based on normalized value
      const opacity = 0.15 + cell.normalized * 0.75;

      svgContent += `
        <rect x="${x}" y="${y}" width="${cellW - 1}" height="${cellH - 1}" rx="3" fill="${catColor}" opacity="${opacity.toFixed(2)}" class="matrix-cell">
          <title>${STATE_NAMES[row.state]}: ${CATEGORY_MAP[cell.cat].label} — ${formatRate(cell.rate)} per 100K</title>
        </rect>
        <text x="${x + cellW / 2}" y="${y + cellH / 2 + 4}" text-anchor="middle" class="matrix-value">${formatRate(cell.rate, 0)}</text>
      `;
    }
  }

  svg.innerHTML = svgContent;
}
