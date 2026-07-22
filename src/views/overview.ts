// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
import {
  STATE_NAMES, STATE_COLORS, CATEGORY_IDS, CATEGORY_MAP,
  getYearData, ratePer100k, getNationalTotals,
  LATEST_YEAR, PREV_YEAR,
} from '../data';
import { formatNumber, formatRate, formatPercent, getStateSummaries } from '../utils';
import { glossarySpan } from '../tooltip';

export function renderOverview(container: HTMLElement): void {
  const summaries = getStateSummaries();
  const natLatest = getNationalTotals(LATEST_YEAR);
  const natPrev = getNationalTotals(PREV_YEAR);
  const natPopLatest = getYearData(LATEST_YEAR).reduce((s, r) => s + r.population, 0);
  const natPopPrev = getYearData(PREV_YEAR).reduce((s, r) => s + r.population, 0);
  const natTotalLatest = Object.values(natLatest.offences).reduce((s, v) => s + v, 0);
  const natTotalPrev = Object.values(natPrev.offences).reduce((s, v) => s + v, 0);
  const natRateLatest = ratePer100k(natTotalLatest, natPopLatest);
  const natRatePrev = ratePer100k(natTotalPrev, natPopPrev);
  const natYoy = natRatePrev > 0 ? ((natRateLatest - natRatePrev) / natRatePrev) * 100 : 0;

  // National category breakdown
  const catBreakdown = CATEGORY_IDS.map(cat => ({
    id: cat,
    label: CATEGORY_MAP[cat].label,
    color: CATEGORY_MAP[cat].color,
    count: natLatest.offences[cat] || 0,
    rate: ratePer100k(natLatest.offences[cat] || 0, natPopLatest),
  })).sort((a, b) => b.count - a.count);

  const maxStateRate = Math.max(...summaries.map(s => s.ratePer100k));

  container.innerHTML = `
    <div class="overview">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-label">Total Recorded Offences (${LATEST_YEAR})</div>
          <div class="card-value">${formatNumber(natTotalLatest)}</div>
          <div class="card-sub">Across all states and territories</div>
        </div>
        <div class="summary-card">
          <div class="card-label">${glossarySpan('Rate per 100K')} (National)</div>
          <div class="card-value">${formatRate(natRateLatest, 0)}</div>
          <div class="card-change ${natYoy > 0 ? 'change-up' : 'change-down'}">${formatPercent(natYoy)} ${glossarySpan('YoY change')}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Population</div>
          <div class="card-value">${formatNumber(natPopLatest)}</div>
          <div class="card-sub">${glossarySpan('ERP')} ${LATEST_YEAR}</div>
        </div>
        <div class="summary-card">
          <div class="card-label">Most Common Offence</div>
          <div class="card-value" style="font-size:var(--font-size-lg)">${catBreakdown[0].label}</div>
          <div class="card-sub">${formatNumber(catBreakdown[0].count)} offences (${formatRate(catBreakdown[0].rate, 0)} per 100K)</div>
        </div>
      </div>

      <div class="overview-grid">
        <div class="panel">
          <h3 class="panel-title">Crime Rate by State (${LATEST_YEAR}) ${glossarySpan('Rate per 100K')}</h3>
          <p class="panel-subtitle">Total ${glossarySpan('recorded crime')} ${glossarySpan('rate per 100K')} population — higher bars indicate more crime relative to population</p>
          <div class="bar-chart" id="state-bars"></div>
        </div>

        <div class="panel">
          <h3 class="panel-title">Offence Categories (National, ${LATEST_YEAR})</h3>
          <p class="panel-subtitle">Breakdown of all ${glossarySpan('recorded crime')} by ${glossarySpan('ANZSOC')} category</p>
          <div class="category-list" id="cat-list"></div>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">State Comparison Table</h3>
        <p class="panel-subtitle">Click a state to see its detailed breakdown</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Population</th>
              <th>Total Offences</th>
              <th>${glossarySpan('Rate per 100K')}</th>
              <th>${glossarySpan('YoY change')}</th>
              <th>Top Category</th>
            </tr>
          </thead>
          <tbody>
            ${summaries.map(s => `
              <tr class="clickable-row" data-state="${s.state}">
                <td><span class="state-dot" style="background:${STATE_COLORS[s.state]}"></span>${STATE_NAMES[s.state]}</td>
                <td class="mono">${formatNumber(s.population)}</td>
                <td class="mono">${formatNumber(s.totalOffences)}</td>
                <td class="mono">${formatRate(s.ratePer100k, 0)}</td>
                <td class="mono ${s.yoyChange > 0 ? 'change-up' : 'change-down'}">${formatPercent(s.yoyChange)}</td>
                <td>${s.topCategory}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;

  // Render state bar chart
  const barsContainer = document.getElementById('state-bars');
  if (barsContainer) {
    barsContainer.innerHTML = summaries.map(s => {
      const pct = (s.ratePer100k / maxStateRate) * 100;
      const tip = `${STATE_NAMES[s.state]} (${LATEST_YEAR}): ${formatRate(s.ratePer100k, 0)} per 100K — ${formatNumber(s.totalOffences)} offences, ${formatPercent(s.yoyChange)} YoY`;
      return `
        <div class="bar-row clickable-row" data-state="${s.state}">
          <div class="bar-label">${s.state}</div>
          <div class="bar-track" data-tip="${tip}" aria-label="${tip}">
            <div class="bar-fill" style="width:${pct}%;background:${STATE_COLORS[s.state]}"></div>
          </div>
          <div class="bar-value">${formatRate(s.ratePer100k, 0)}</div>
        </div>
      `;
    }).join('');
  }

  // Render category list
  const catList = document.getElementById('cat-list');
  if (catList) {
    const maxCatCount = catBreakdown[0].count;
    catList.innerHTML = catBreakdown.map(c => {
      const pct = (c.count / maxCatCount) * 100;
      const tip = `${c.label} (${LATEST_YEAR}): ${formatNumber(c.count)} offences — ${formatRate(c.rate, 0)} per 100K`;
      return `
        <div class="cat-row">
          <div class="cat-label">${glossarySpan(c.label)}</div>
          <div class="bar-track" data-tip="${tip}" aria-label="${tip}">
            <div class="bar-fill" style="width:${pct}%;background:${c.color}"></div>
          </div>
          <div class="cat-values">
            <span class="mono">${formatNumber(c.count)}</span>
            <span class="mono text-secondary">${formatRate(c.rate, 0)}/100K</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Click handlers for state navigation
  container.querySelectorAll('.clickable-row[data-state]').forEach(row => {
    row.addEventListener('click', () => {
      const state = row.getAttribute('data-state');
      if (state) {
        window.location.hash = `#by-state/${state}`;
      }
    });
  });
}
