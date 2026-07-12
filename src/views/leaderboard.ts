import {
  STATE_NAMES, STATE_COLORS, CATEGORY_IDS, CATEGORY_MAP,
  getYearData, totalOffences, ratePer100k, NSW_LGA_DATA,
  LATEST_YEAR, PREV_YEAR, type StateCode,
} from '../data';
import { formatNumber, formatRate, formatPercent, percentChange, median } from '../utils';
import { glossarySpan } from '../tooltip';

type LeaderboardLevel = 'state' | 'lga';

let currentLevel: LeaderboardLevel = 'state';
let currentCategory = 'total';

export function renderLeaderboard(container: HTMLElement): void {
  container.innerHTML = `
    <div class="leaderboard-view">
      <div class="trends-controls">
        <div class="control-group">
          <label>Level:</label>
          <select id="lb-level">
            <option value="state" ${currentLevel === 'state' ? 'selected' : ''}>States & Territories</option>
            <option value="lga" ${currentLevel === 'lga' ? 'selected' : ''}>LGAs (NSW only)</option>
          </select>
        </div>
        <div class="control-group">
          <label>Category:</label>
          <select id="lb-category">
            <option value="total" ${currentCategory === 'total' ? 'selected' : ''}>All Offences</option>
            ${CATEGORY_IDS.map(cat => `<option value="${cat}" ${currentCategory === cat ? 'selected' : ''}>${CATEGORY_MAP[cat].label}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="panel" id="lb-content"></div>
    </div>
  `;

  renderContent();

  document.getElementById('lb-level')?.addEventListener('change', (e) => {
    currentLevel = (e.target as HTMLSelectElement).value as LeaderboardLevel;
    renderContent();
  });
  document.getElementById('lb-category')?.addEventListener('change', (e) => {
    currentCategory = (e.target as HTMLSelectElement).value;
    renderContent();
  });
}

function renderContent(): void {
  const el = document.getElementById('lb-content');
  if (!el) return;

  if (currentLevel === 'state') {
    renderStateLeaderboard(el);
  } else {
    renderLgaLeaderboard(el);
  }
}

function renderStateLeaderboard(el: HTMLElement): void {
  const latestData = getYearData(LATEST_YEAR);
  const prevData = getYearData(PREV_YEAR);

  const entries = latestData.map(record => {
    const prev = prevData.find(r => r.state === record.state);
    const count = currentCategory === 'total' ? totalOffences(record) : (record.offences[currentCategory] || 0);
    const prevCount = prev ? (currentCategory === 'total' ? totalOffences(prev) : (prev.offences[currentCategory] || 0)) : count;
    const rate = ratePer100k(count, record.population);
    const prevRate = prev ? ratePer100k(prevCount, prev.population) : rate;
    return {
      name: STATE_NAMES[record.state as StateCode],
      code: record.state as StateCode,
      population: record.population,
      count,
      rate,
      yoy: percentChange(prevRate, rate),
    };
  }).sort((a, b) => b.rate - a.rate);

  const medRate = median(entries.map(e => e.rate));
  const maxRate = entries[0]?.rate || 1;
  const catLabel = currentCategory === 'total' ? 'All Offences' : CATEGORY_MAP[currentCategory]?.label || currentCategory;

  el.innerHTML = `
    <h3 class="panel-title">${glossarySpan('Leaderboard')}: ${catLabel} by State (${LATEST_YEAR})</h3>
    <p class="panel-subtitle">Ranked by ${glossarySpan('rate per 100K')} — green = below ${glossarySpan('median')}, red = above median</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>State</th>
          <th>Population</th>
          <th>Offences</th>
          <th>${glossarySpan('Rate per 100K')}</th>
          <th>Bar</th>
          <th>${glossarySpan('YoY change')}</th>
          <th>vs ${glossarySpan('Median')}</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e, i) => {
          const pct = (e.rate / maxRate) * 100;
          const vsMed = medRate > 0 ? ((e.rate - medRate) / medRate) * 100 : 0;
          const band = e.rate > medRate * 1.2 ? 'band-high' : e.rate < medRate * 0.8 ? 'band-low' : 'band-mid';
          return `
            <tr class="${band} clickable-row" data-state="${e.code}">
              <td class="mono rank-cell">${i + 1}</td>
              <td><span class="state-dot" style="background:${STATE_COLORS[e.code]}"></span>${e.name}</td>
              <td class="mono">${formatNumber(e.population)}</td>
              <td class="mono">${formatNumber(e.count)}</td>
              <td class="mono"><strong>${formatRate(e.rate, 0)}</strong></td>
              <td class="bar-cell" data-tip="${e.name} — ${catLabel} (${LATEST_YEAR}): ${formatRate(e.rate, 0)} per 100K — ${formatNumber(e.count)} offences" aria-label="${e.name} — ${catLabel} (${LATEST_YEAR}): ${formatRate(e.rate, 0)} per 100K — ${formatNumber(e.count)} offences">
                <div class="mini-bar" style="width:${pct}%;background:${STATE_COLORS[e.code]}"></div>
              </td>
              <td class="mono ${e.yoy > 0 ? 'change-up' : 'change-down'}">${formatPercent(e.yoy)}</td>
              <td class="mono ${vsMed > 0 ? 'change-up' : 'change-down'}">${formatPercent(vsMed)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  el.querySelectorAll('.clickable-row[data-state]').forEach(row => {
    row.addEventListener('click', () => {
      const state = row.getAttribute('data-state');
      if (state) window.location.hash = `#by-state/${state}`;
    });
  });
}

function renderLgaLeaderboard(el: HTMLElement): void {
  const entries = NSW_LGA_DATA.map(lga => {
    const count = currentCategory === 'total'
      ? Object.values(lga.offences).reduce((s, v) => s + v, 0)
      : (lga.offences[currentCategory] || 0);
    const rate = ratePer100k(count, lga.population);
    return { name: lga.lga, population: lga.population, count, rate };
  }).sort((a, b) => b.rate - a.rate);

  const medRate = median(entries.map(e => e.rate));
  const maxRate = entries[0]?.rate || 1;
  const catLabel = currentCategory === 'total' ? 'All Offences' : CATEGORY_MAP[currentCategory]?.label || currentCategory;

  el.innerHTML = `
    <h3 class="panel-title">${glossarySpan('Leaderboard')}: ${catLabel} by ${glossarySpan('LGA')} — NSW (${LATEST_YEAR})</h3>
    <p class="panel-subtitle">Top ${entries.length} NSW ${glossarySpan('LGA')}s ranked by ${glossarySpan('rate per 100K')} — data from ${glossarySpan('BOCSAR')}</p>
    <table class="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>${glossarySpan('LGA')}</th>
          <th>Population</th>
          <th>Offences</th>
          <th>${glossarySpan('Rate per 100K')}</th>
          <th>Bar</th>
          <th>vs ${glossarySpan('Median')}</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e, i) => {
          const pct = (e.rate / maxRate) * 100;
          const vsMed = medRate > 0 ? ((e.rate - medRate) / medRate) * 100 : 0;
          const band = e.rate > medRate * 1.2 ? 'band-high' : e.rate < medRate * 0.8 ? 'band-low' : 'band-mid';
          return `
            <tr class="${band}">
              <td class="mono rank-cell">${i + 1}</td>
              <td>${e.name}</td>
              <td class="mono">${formatNumber(e.population)}</td>
              <td class="mono">${formatNumber(e.count)}</td>
              <td class="mono"><strong>${formatRate(e.rate, 0)}</strong></td>
              <td class="bar-cell" data-tip="${e.name} — ${catLabel} (${LATEST_YEAR}): ${formatRate(e.rate, 0)} per 100K — ${formatNumber(e.count)} offences" aria-label="${e.name} — ${catLabel} (${LATEST_YEAR}): ${formatRate(e.rate, 0)} per 100K — ${formatNumber(e.count)} offences">
                <div class="mini-bar" style="width:${pct}%;background:var(--accent-primary)"></div>
              </td>
              <td class="mono ${vsMed > 0 ? 'change-up' : 'change-down'}">${formatPercent(vsMed)}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}
