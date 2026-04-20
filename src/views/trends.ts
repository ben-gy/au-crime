import {
  STATES, STATE_NAMES, STATE_COLORS, CATEGORY_IDS, CATEGORY_MAP,
  NATIONAL_DATA, totalOffences, ratePer100k, YEARS,
  type StateCode,
} from '../data';
import { formatRate } from '../utils';
import { glossarySpan } from '../tooltip';

interface TrendConfig {
  selectedStates: Set<string>;
  selectedCategory: string; // 'total' or a category id
}

let config: TrendConfig = {
  selectedStates: new Set(['NSW', 'VIC', 'QLD', 'WA']),
  selectedCategory: 'total',
};

export function renderTrends(container: HTMLElement): void {
  container.innerHTML = `
    <div class="trends-view">
      <div class="trends-controls">
        <div class="control-group">
          <label>Category:</label>
          <select id="trend-category">
            <option value="total" ${config.selectedCategory === 'total' ? 'selected' : ''}>All Offences (Total)</option>
            ${CATEGORY_IDS.map(cat => `<option value="${cat}" ${config.selectedCategory === cat ? 'selected' : ''}>${CATEGORY_MAP[cat].label}</option>`).join('')}
          </select>
        </div>
        <div class="control-group">
          <label>States:</label>
          <div class="state-toggles" id="state-toggles">
            ${STATES.map(s => `
              <button class="state-toggle ${config.selectedStates.has(s) ? 'active' : ''}" data-state="${s}" style="--toggle-color:${STATE_COLORS[s]}">
                ${s}
              </button>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">${glossarySpan('Rate per 100K')} Over Time</h3>
        <p class="panel-subtitle">10-year trend for selected states and category — hover points for exact values</p>
        <div class="trend-chart-container" id="trend-chart"></div>
      </div>

      <div class="panel">
        <h3 class="panel-title">Year-by-Year Data</h3>
        <table class="data-table" id="trend-table"></table>
      </div>
    </div>
  `;

  renderChart();
  renderTable();
  attachHandlers(container);
}

function getRate(state: StateCode, year: number, category: string): number {
  const record = NATIONAL_DATA.find(r => r.state === state && r.year === year);
  if (!record) return 0;
  if (category === 'total') {
    return ratePer100k(totalOffences(record), record.population);
  }
  return ratePer100k(record.offences[category] || 0, record.population);
}

function renderChart(): void {
  const el = document.getElementById('trend-chart');
  if (!el) return;

  const states = [...config.selectedStates] as StateCode[];
  if (states.length === 0) {
    el.innerHTML = '<p class="text-secondary" style="padding:var(--space-xl)">Select at least one state to see trends.</p>';
    return;
  }

  const w = 700;
  const h = 300;
  const pad = { top: 20, right: 100, bottom: 35, left: 55 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  // Get all rates for scale
  const allRates: number[] = [];
  for (const state of states) {
    for (const year of YEARS) {
      allRates.push(getRate(state, year, config.selectedCategory));
    }
  }
  const minR = Math.min(...allRates) * 0.9;
  const maxR = Math.max(...allRates) * 1.1;

  const x = (i: number) => pad.left + (i / (YEARS.length - 1)) * cw;
  const y = (v: number) => maxR === minR ? pad.top + ch / 2 : pad.top + ch - ((v - minR) / (maxR - minR)) * ch;

  // Grid lines
  const gridCount = 5;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minR + (maxR - minR) * (i / gridCount);
    return { val, y: y(val) };
  });

  const lines = states.map(state => {
    const path = YEARS.map((yr, i) => {
      const rate = getRate(state, yr, config.selectedCategory);
      return `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(rate).toFixed(1)}`;
    }).join(' ');

    const dots = YEARS.map((yr, i) => {
      const rate = getRate(state, yr, config.selectedCategory);
      return `<circle cx="${x(i).toFixed(1)}" cy="${y(rate).toFixed(1)}" r="3" fill="${STATE_COLORS[state]}" stroke="var(--bg-panel)" stroke-width="1.5"><title>${state} ${yr}: ${formatRate(rate, 0)} per 100K</title></circle>`;
    }).join('');

    const lastRate = getRate(state, YEARS[YEARS.length - 1], config.selectedCategory);
    const labelY = y(lastRate);

    return `
      <path d="${path}" fill="none" stroke="${STATE_COLORS[state]}" stroke-width="2"/>
      ${dots}
      <text x="${w - pad.right + 8}" y="${labelY + 4}" fill="${STATE_COLORS[state]}" class="line-label">${state}</text>
    `;
  });

  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="trend-svg">
      ${gridLines.map(g => `
        <line x1="${pad.left}" y1="${g.y.toFixed(1)}" x2="${w - pad.right}" y2="${g.y.toFixed(1)}" stroke="var(--border-subtle)" stroke-dasharray="3,3"/>
        <text x="${pad.left - 8}" y="${g.y.toFixed(1) + 4}" text-anchor="end" class="axis-label">${formatRate(g.val, 0)}</text>
      `).join('')}
      ${YEARS.map((yr, i) => `
        <text x="${x(i).toFixed(1)}" y="${h - 8}" text-anchor="middle" class="axis-label">${yr}</text>
      `).join('')}
      ${lines.join('')}
    </svg>
  `;
}

function renderTable(): void {
  const el = document.getElementById('trend-table');
  if (!el) return;

  const states = [...config.selectedStates] as StateCode[];
  el.innerHTML = `
    <thead>
      <tr>
        <th>Year</th>
        ${states.map(s => `<th><span class="state-dot" style="background:${STATE_COLORS[s]}"></span>${STATE_NAMES[s]}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${YEARS.map(yr => `
        <tr>
          <td class="mono">${yr}</td>
          ${states.map(s => `<td class="mono">${formatRate(getRate(s, yr, config.selectedCategory), 0)}</td>`).join('')}
        </tr>
      `).join('')}
    </tbody>
  `;
}

function attachHandlers(container: HTMLElement): void {
  document.getElementById('trend-category')?.addEventListener('change', (e) => {
    config.selectedCategory = (e.target as HTMLSelectElement).value;
    renderChart();
    renderTable();
  });

  container.querySelectorAll('.state-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const state = btn.getAttribute('data-state');
      if (!state) return;
      if (config.selectedStates.has(state)) {
        config.selectedStates.delete(state);
        btn.classList.remove('active');
      } else {
        config.selectedStates.add(state);
        btn.classList.add('active');
      }
      renderChart();
      renderTable();
    });
  });
}
