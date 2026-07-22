// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import {
  STATE_NAMES, STATE_COLORS, CATEGORIES, CATEGORY_IDS, CATEGORY_MAP,
  getYearData, ratePer100k, LATEST_YEAR, PREV_YEAR,
  type StateCode,
} from '../data';
import { formatNumber, formatRate, formatPercent, percentChange, median } from '../utils';
import { glossarySpan } from '../tooltip';

export function renderByCategory(container: HTMLElement, categoryId?: string): void {
  const selected = categoryId && CATEGORY_IDS.includes(categoryId) ? categoryId : CATEGORY_IDS[0];
  const cat = CATEGORY_MAP[selected];

  const latestData = getYearData(LATEST_YEAR);
  const prevData = getYearData(PREV_YEAR);

  const stateRates = latestData.map(record => {
    const prev = prevData.find(r => r.state === record.state);
    const rate = ratePer100k(record.offences[selected] || 0, record.population);
    const prevRate = prev ? ratePer100k(prev.offences[selected] || 0, prev.population) : rate;
    return {
      state: record.state as StateCode,
      count: record.offences[selected] || 0,
      rate,
      prevRate,
      yoy: percentChange(prevRate, rate),
    };
  }).sort((a, b) => b.rate - a.rate);

  const maxRate = Math.max(...stateRates.map(s => s.rate));
  const medianRate = median(stateRates.map(s => s.rate));
  const totalCount = stateRates.reduce((s, r) => s + r.count, 0);
  const totalPop = latestData.reduce((s, r) => s + r.population, 0);
  const nationalRate = ratePer100k(totalCount, totalPop);

  container.innerHTML = `
    <div class="category-detail">
      <div class="state-selector">
        <label>Select Category:</label>
        <select id="cat-select">
          ${CATEGORIES.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.label}</option>`).join('')}
        </select>
      </div>

      <div class="state-header" style="border-left:4px solid ${cat.color}">
        <h2>${glossarySpan(cat.label)}</h2>
        <p class="text-secondary">${cat.description}</p>
        <div class="state-meta">
          <span>National Total: <strong class="mono">${formatNumber(totalCount)}</strong></span>
          <span>National ${glossarySpan('Rate per 100K')}: <strong class="mono">${formatRate(nationalRate)}</strong></span>
          <span>State ${glossarySpan('Median')}: <strong class="mono">${formatRate(medianRate)}</strong></span>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">${cat.label} Rate by State (${LATEST_YEAR})</h3>
        <p class="panel-subtitle">Offences ${glossarySpan('per capita')} — ${glossarySpan('rate per 100K')} population</p>
        <div class="bar-chart">
          ${stateRates.map(s => {
            const pct = maxRate > 0 ? (s.rate / maxRate) * 100 : 0;
            const medPct = maxRate > 0 ? (medianRate / maxRate) * 100 : 0;
            const tip = `${STATE_NAMES[s.state]} — ${cat.label} (${LATEST_YEAR}): ${formatRate(s.rate)} per 100K — ${formatNumber(s.count)} offences, ${formatPercent(s.yoy)} YoY`;
            return `
              <div class="bar-row clickable-row" data-state="${s.state}">
                <div class="bar-label">${s.state}</div>
                <div class="bar-track" style="position:relative" data-tip="${tip}" aria-label="${tip}">
                  <div class="bar-fill" style="width:${pct}%;background:${STATE_COLORS[s.state]}"></div>
                  <div class="median-line" style="left:${medPct}%" data-tip="Median: ${formatRate(medianRate)} per 100K" aria-label="Median: ${formatRate(medianRate)} per 100K"></div>
                </div>
                <div class="bar-value">
                  <span class="mono">${formatRate(s.rate)}</span>
                  <span class="mono ${s.yoy > 0 ? 'change-up' : 'change-down'}" style="font-size:var(--font-size-xs)">${formatPercent(s.yoy)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-line" style="border-left:2px dashed var(--text-tertiary)"></span> ${glossarySpan('Median')} rate</span>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">Detailed Comparison</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Offences</th>
              <th>Population</th>
              <th>${glossarySpan('Rate per 100K')}</th>
              <th>${glossarySpan('YoY change')}</th>
              <th>vs ${glossarySpan('Median')}</th>
            </tr>
          </thead>
          <tbody>
            ${stateRates.map(s => {
              const vsMed = medianRate > 0 ? ((s.rate - medianRate) / medianRate) * 100 : 0;
              const latestRec = latestData.find(r => r.state === s.state);
              return `
                <tr class="clickable-row" data-state="${s.state}">
                  <td><span class="state-dot" style="background:${STATE_COLORS[s.state]}"></span>${STATE_NAMES[s.state]}</td>
                  <td class="mono">${formatNumber(s.count)}</td>
                  <td class="mono">${formatNumber(latestRec?.population || 0)}</td>
                  <td class="mono">${formatRate(s.rate)}</td>
                  <td class="mono ${s.yoy > 0 ? 'change-up' : 'change-down'}">${formatPercent(s.yoy)}</td>
                  <td class="mono ${vsMed > 0 ? 'change-up' : 'change-down'}">${formatPercent(vsMed)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Category selector
  document.getElementById('cat-select')?.addEventListener('change', (e) => {
    const val = (e.target as HTMLSelectElement).value;
    window.location.hash = `#by-category/${val}`;
  });

  // State click navigation
  container.querySelectorAll('.clickable-row[data-state]').forEach(row => {
    row.addEventListener('click', () => {
      const state = row.getAttribute('data-state');
      if (state) window.location.hash = `#by-state/${state}`;
    });
  });
}
