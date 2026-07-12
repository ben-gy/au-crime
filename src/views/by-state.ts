import {
  STATES, STATE_NAMES, STATE_COLORS, CATEGORY_IDS, CATEGORY_MAP,
  getStateData, totalOffences, ratePer100k, getYearData,
  NSW_LGA_DATA, LATEST_YEAR, YEARS,
  type StateCode,
} from '../data';
import { formatNumber, formatRate, formatPercent, percentChange, median } from '../utils';
import { glossarySpan } from '../tooltip';

export function renderByState(container: HTMLElement, stateCode?: string): void {
  const selected = (stateCode && STATES.includes(stateCode as StateCode) ? stateCode : 'NSW') as StateCode;
  const stateData = getStateData(selected);
  const latest = stateData[stateData.length - 1];
  const prev = stateData[stateData.length - 2];

  if (!latest || !prev) {
    container.innerHTML = '<div class="panel"><p>No data available for this state.</p></div>';
    return;
  }

  const total = totalOffences(latest);
  const rate = ratePer100k(total, latest.population);
  const prevRate = ratePer100k(totalOffences(prev), prev.population);
  const yoy = percentChange(prevRate, rate);

  // Category breakdown for this state
  const catBreakdown = CATEGORY_IDS.map(cat => ({
    id: cat,
    label: CATEGORY_MAP[cat].label,
    color: CATEGORY_MAP[cat].color,
    count: latest.offences[cat] || 0,
    rate: ratePer100k(latest.offences[cat] || 0, latest.population),
    prevRate: ratePer100k(prev.offences[cat] || 0, prev.population),
  })).sort((a, b) => b.count - a.count);

  const maxCatRate = Math.max(...catBreakdown.map(c => c.rate));

  // Trend sparklines data
  const trendData = stateData.map(r => ({
    year: r.year,
    total: totalOffences(r),
    rate: ratePer100k(totalOffences(r), r.population),
  }));

  // Compare to national median
  const allStateRates = getYearData(LATEST_YEAR).map(r => ratePer100k(totalOffences(r), r.population));
  const nationalMedian = median(allStateRates);
  const vsMedian = ((rate - nationalMedian) / nationalMedian) * 100;

  // Has LGA data?
  const hasLga = selected === 'NSW';
  const lgaData = hasLga ? NSW_LGA_DATA.sort((a, b) => {
    const rateA = ratePer100k(Object.values(a.offences).reduce((s, v) => s + v, 0), a.population);
    const rateB = ratePer100k(Object.values(b.offences).reduce((s, v) => s + v, 0), b.population);
    return rateB - rateA;
  }) : [];

  container.innerHTML = `
    <div class="state-detail">
      <div class="state-selector">
        <label>Select State:</label>
        <select id="state-select">
          ${STATES.map(s => `<option value="${s}" ${s === selected ? 'selected' : ''}>${STATE_NAMES[s]}</option>`).join('')}
        </select>
      </div>

      <div class="state-header" style="border-left:4px solid ${STATE_COLORS[selected]}">
        <h2>${STATE_NAMES[selected]}</h2>
        <div class="state-meta">
          <span>Population: <strong class="mono">${formatNumber(latest.population)}</strong></span>
          <span>Total Offences: <strong class="mono">${formatNumber(total)}</strong></span>
          <span>${glossarySpan('Rate per 100K')}: <strong class="mono">${formatRate(rate, 0)}</strong></span>
          <span class="${yoy > 0 ? 'change-up' : 'change-down'}">${formatPercent(yoy)} YoY</span>
          <span class="${vsMedian > 0 ? 'change-up' : 'change-down'}">${formatPercent(vsMedian)} vs ${glossarySpan('median')}</span>
        </div>
      </div>

      <div class="overview-grid">
        <div class="panel">
          <h3 class="panel-title">Offence Categories (${LATEST_YEAR})</h3>
          <p class="panel-subtitle">${glossarySpan('Rate per 100K')} by ${glossarySpan('ANZSOC')} category</p>
          <div class="category-list">
            ${catBreakdown.map(c => {
              const pct = (c.rate / maxCatRate) * 100;
              const catYoy = percentChange(c.prevRate, c.rate);
              const tip = `${c.label} (${LATEST_YEAR}): ${formatRate(c.rate, 0)} per 100K — ${formatNumber(c.count)} offences, ${formatPercent(catYoy)} YoY`;
              return `
                <div class="cat-row">
                  <div class="cat-label">${glossarySpan(c.label)}</div>
                  <div class="bar-track" data-tip="${tip}" aria-label="${tip}">
                    <div class="bar-fill" style="width:${pct}%;background:${c.color}"></div>
                  </div>
                  <div class="cat-values">
                    <span class="mono">${formatRate(c.rate, 0)}/100K</span>
                    <span class="mono ${catYoy > 0 ? 'change-up' : 'change-down'}">${formatPercent(catYoy)}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="panel">
          <h3 class="panel-title">10-Year Trend</h3>
          <p class="panel-subtitle">Total ${glossarySpan('rate per 100K')} from ${YEARS[0]} to ${YEARS[YEARS.length - 1]}</p>
          <div class="sparkline-large" id="state-trend-chart"></div>
        </div>
      </div>

      ${hasLga ? `
        <div class="panel">
          <h3 class="panel-title">${glossarySpan('LGA')} Breakdown (${selected}, ${LATEST_YEAR})</h3>
          <p class="panel-subtitle">Top ${lgaData.length} local government areas by ${glossarySpan('rate per 100K')} — data from ${glossarySpan('BOCSAR')}</p>
          <table class="data-table">
            <thead>
              <tr>
                <th>LGA</th>
                <th>Population</th>
                <th>Total Offences</th>
                <th>${glossarySpan('Rate per 100K')}</th>
                <th>Top Category</th>
              </tr>
            </thead>
            <tbody>
              ${lgaData.map(lga => {
                const lgaTotal = Object.values(lga.offences).reduce((s, v) => s + v, 0);
                const lgaRate = ratePer100k(lgaTotal, lga.population);
                const topCat = Object.entries(lga.offences).sort((a, b) => b[1] - a[1])[0];
                return `
                  <tr>
                    <td>${lga.lga}</td>
                    <td class="mono">${formatNumber(lga.population)}</td>
                    <td class="mono">${formatNumber(lgaTotal)}</td>
                    <td class="mono">${formatRate(lgaRate, 0)}</td>
                    <td>${topCat ? CATEGORY_MAP[topCat[0]]?.label || topCat[0] : '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="panel">
          <p class="text-secondary">${glossarySpan('LGA')}-level data is currently available for NSW only (via ${glossarySpan('BOCSAR')}). Other states will be added as data pipelines are built.</p>
        </div>
      `}
    </div>
  `;

  // Render trend chart
  renderTrendChart('state-trend-chart', trendData, STATE_COLORS[selected]);

  // State selector
  document.getElementById('state-select')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    window.location.hash = `#by-state/${val}`;
  });
}

function renderTrendChart(containerId: string, data: { year: number; rate: number }[], color: string): void {
  const el = document.getElementById(containerId);
  if (!el) return;

  const w = 500;
  const h = 200;
  const pad = { top: 20, right: 40, bottom: 30, left: 50 };
  const cw = w - pad.left - pad.right;
  const ch = h - pad.top - pad.bottom;

  const rates = data.map(d => d.rate);
  const minR = Math.min(...rates) * 0.9;
  const maxR = Math.max(...rates) * 1.1;

  const x = (i: number) => pad.left + (i / (data.length - 1)) * cw;
  const y = (v: number) => pad.top + ch - ((v - minR) / (maxR - minR)) * ch;

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.rate).toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${x(data.length - 1).toFixed(1)},${(pad.top + ch).toFixed(1)} L${x(0).toFixed(1)},${(pad.top + ch).toFixed(1)} Z`;

  el.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" class="trend-svg">
      <defs>
        <linearGradient id="areaGrad-${containerId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <path d="${areaPath}" fill="url(#areaGrad-${containerId})"/>
      <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2.5"/>
      ${data.map((d, i) => {
        const tip = `${d.year}: ${formatRate(d.rate, 0)} per 100K`;
        return `<circle cx="${x(i).toFixed(1)}" cy="${y(d.rate).toFixed(1)}" r="3.5" fill="${color}" stroke="var(--bg-panel)" stroke-width="1.5" data-tip="${tip}" aria-label="${tip}"/>`;
      }).join('')}
      ${data.filter((_, i) => i % 2 === 0 || i === data.length - 1).map((d) => {
        const i = data.indexOf(d);
        return `<text x="${x(i).toFixed(1)}" y="${h - 5}" text-anchor="middle" class="axis-label">${d.year}</text>`;
      }).join('')}
      <text x="${pad.left - 8}" y="${y(maxR).toFixed(1)}" text-anchor="end" class="axis-label">${formatRate(maxR, 0)}</text>
      <text x="${pad.left - 8}" y="${y(minR).toFixed(1)}" text-anchor="end" class="axis-label">${formatRate(minR, 0)}</text>
    </svg>
  `;
}
