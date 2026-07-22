// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// feedback:begin (managed by hub/scripts/feedback/backfill.mjs)
import { mountFeedback } from './feedback';
mountFeedback();
// feedback:end

import { initTooltips, showAboutModal } from './tooltip';
import { initTooltip } from './hoverTip';
import { renderOverview } from './views/overview';
import { renderByState } from './views/by-state';
import { renderByCategory } from './views/by-category';
import { renderTrends } from './views/trends';
import { renderMap } from './views/map';
import { renderMatrix } from './views/matrix';
import { renderLeaderboard } from './views/leaderboard';
import { renderInsights } from './views/insights';
import { LATEST_YEAR } from './data';

// ── Styles ──
const style = document.createElement('style');
style.textContent = `
:root {
  --bg-base: #f8fafc;
  --bg-surface: #ffffff;
  --bg-elevated: #f1f5f9;
  --bg-panel: #ffffff;
  --bg-hover: #f1f5f9;
  --bg-active: #e2e8f0;

  --border-subtle: #e2e8f0;
  --border-default: #cbd5e1;
  --border-strong: #94a3b8;

  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  --text-muted: #cbd5e1;

  --accent-primary: #1e3a5f;
  --accent-primary-hover: #15304f;
  --accent-secondary: #0ea5e9;

  --status-good: #16a34a;
  --status-warn: #d97706;
  --status-bad: #dc2626;
  --status-info: #0284c7;

  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
  --font-size-xs: 0.6875rem;
  --font-size-sm: 0.75rem;
  --font-size-base: 0.875rem;
  --font-size-lg: 1rem;
  --font-size-xl: 1.125rem;
  --font-size-2xl: 1.5rem;

  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 0.75rem;
  --space-lg: 1rem;
  --space-xl: 1.5rem;
  --space-2xl: 2rem;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html, body { height: 100%; }
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-base);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1 0 auto;
  max-width: 1600px;
  margin: 0 auto;
  padding: var(--space-xl);
  width: 100%;
}

/* Header */
.site-header {
  background: var(--accent-primary);
  color: #fff;
  padding: 0 var(--space-xl);
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}
.site-header h1 {
  font-size: var(--font-size-lg);
  font-weight: 600;
  letter-spacing: -0.01em;
}
.site-header h1 span {
  font-weight: 400;
  opacity: 0.7;
  font-size: var(--font-size-sm);
  margin-left: var(--space-sm);
}
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.about-btn {
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--transition-fast);
}
.about-btn:hover { background: rgba(255,255,255,0.25); }

/* Nav */
.nav-tabs {
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  overflow-x: auto;
  padding: 0 var(--space-xl);
  -webkit-overflow-scrolling: touch;
}
.nav-tab {
  padding: var(--space-md) var(--space-lg);
  color: var(--text-secondary);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 500;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  cursor: pointer;
  background: none;
  border-top: none;
  border-left: none;
  border-right: none;
  font-family: var(--font-sans);
}
.nav-tab:hover { color: var(--text-primary); }
.nav-tab.active {
  color: var(--accent-primary);
  border-bottom-color: var(--accent-primary);
  font-weight: 600;
}

/* Footer */
.site-footer {
  flex-shrink: 0;
  background: var(--bg-surface);
  border-top: 1px solid var(--border-subtle);
  padding: var(--space-lg) var(--space-xl);
  text-align: center;
  color: var(--text-tertiary);
  font-size: var(--font-size-xs);
}
.site-footer a {
  color: var(--accent-primary);
  text-decoration: none;
}
.site-footer a:hover { text-decoration: underline; }

/* Panels */
.panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
}
.panel-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  margin-bottom: var(--space-xs);
}
.panel-subtitle {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-lg);
}

/* Summary cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-xl);
}
.summary-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-xl);
}
.card-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-xs);
}
.card-value {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  font-family: var(--font-mono);
  color: var(--text-primary);
}
.card-sub {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  margin-top: var(--space-xs);
}
.card-change {
  font-size: var(--font-size-sm);
  margin-top: var(--space-xs);
  font-family: var(--font-mono);
}

/* Grid */
.overview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}
@media (max-width: 900px) {
  .overview-grid { grid-template-columns: 1fr; }
}

/* Bar charts */
.bar-chart { display: flex; flex-direction: column; gap: var(--space-sm); }
.bar-row {
  display: grid;
  grid-template-columns: 48px 1fr 80px;
  align-items: center;
  gap: var(--space-sm);
  cursor: pointer;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  transition: background var(--transition-fast);
}
.bar-row:hover { background: var(--bg-hover); }
.bar-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  font-family: var(--font-mono);
}
.bar-track {
  height: 20px;
  background: var(--bg-elevated);
  border-radius: var(--radius-sm);
  overflow: hidden;
  position: relative;
}
.bar-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width var(--transition-normal);
}
.bar-value {
  font-size: var(--font-size-sm);
  font-family: var(--font-mono);
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.median-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  border-left: 2px dashed var(--text-tertiary);
}

/* Category list */
.category-list { display: flex; flex-direction: column; gap: var(--space-sm); }
.cat-row {
  display: grid;
  grid-template-columns: 140px 1fr 160px;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}
.cat-label { font-size: var(--font-size-sm); }
.cat-values {
  display: flex;
  gap: var(--space-md);
  font-size: var(--font-size-sm);
  justify-content: flex-end;
}

/* Tables */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}
.data-table th {
  text-align: left;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 2px solid var(--border-default);
  font-weight: 600;
  color: var(--text-secondary);
  position: sticky;
  top: 0;
  background: var(--bg-panel);
  white-space: nowrap;
}
.data-table td {
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--border-subtle);
}
.data-table tbody tr:nth-child(even) { background: var(--bg-elevated); }
.data-table tbody tr.clickable-row { cursor: pointer; }
.data-table tbody tr.clickable-row:hover { background: var(--bg-hover); }

/* Utilities */
.mono { font-family: var(--font-mono); }
.text-secondary { color: var(--text-secondary); }
.change-up { color: var(--status-bad); }
.change-down { color: var(--status-good); }
.state-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: var(--space-sm);
}

/* State detail */
.state-detail, .category-detail { }
.state-selector {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}
.state-selector label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}
.state-selector select, .trends-controls select {
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  font-size: var(--font-size-sm);
  font-family: var(--font-sans);
  cursor: pointer;
}
.state-header {
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  background: var(--bg-panel);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-subtle);
}
.state-header h2 { font-size: var(--font-size-xl); margin-bottom: var(--space-sm); }
.state-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

/* Trends */
.trends-controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  align-items: center;
  margin-bottom: var(--space-lg);
}
.control-group {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.control-group label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}
.state-toggles {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
.state-toggle {
  padding: var(--space-xs) var(--space-sm);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  cursor: pointer;
  font-size: var(--font-size-xs);
  font-family: var(--font-mono);
  font-weight: 600;
  transition: all var(--transition-fast);
}
.state-toggle.active {
  background: var(--toggle-color, var(--accent-primary));
  color: #fff;
  border-color: var(--toggle-color, var(--accent-primary));
}

/* SVG charts */
.trend-svg, .matrix-svg {
  width: 100%;
  height: auto;
}
.trend-chart-container { overflow-x: auto; }
.axis-label {
  font-size: 10px;
  fill: var(--text-tertiary);
  font-family: var(--font-mono);
}
.line-label {
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-mono);
}
.sparkline-large { overflow-x: auto; }

/* Matrix */
.matrix-scroll { overflow-x: auto; }
.matrix-header {
  font-size: 10px;
  fill: var(--text-secondary);
  font-family: var(--font-sans);
  font-weight: 600;
}
.matrix-label {
  font-size: 11px;
  fill: var(--text-primary);
  font-family: var(--font-mono);
  font-weight: 600;
}
.matrix-value {
  font-size: 9px;
  fill: var(--text-primary);
  font-family: var(--font-mono);
  pointer-events: none;
}
.matrix-cell { cursor: pointer; }
.matrix-cell:hover { stroke: var(--text-primary); stroke-width: 1.5; }

/* Map */
.map-legend { padding: var(--space-md) 0; }
.legend-scale { max-width: 300px; }
.legend-gradient {
  height: 12px;
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-xs);
}
.legend-labels {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

/* Leaderboard */
.rank-cell { font-weight: 700; color: var(--text-tertiary); }
.bar-cell { width: 120px; }
.mini-bar {
  height: 14px;
  border-radius: var(--radius-sm);
  transition: width var(--transition-normal);
}
.band-high td:first-child { border-left: 3px solid var(--status-bad); }
.band-low td:first-child { border-left: 3px solid var(--status-good); }
.band-mid td:first-child { border-left: 3px solid var(--status-warn); }

/* Insights */
.insight-summary {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
}
.insight-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
.insight-badge.alert { background: #fef2f2; color: var(--status-bad); }
.insight-badge.warning { background: #fffbeb; color: var(--status-warn); }
.insight-badge.info { background: #eff6ff; color: var(--status-info); }

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: var(--space-lg);
}
.insight-card {
  background: var(--bg-panel);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  border-left: 4px solid var(--border-default);
}
.insight-card.alert { border-left-color: var(--status-bad); background: #fef2f2; }
.insight-card.warning { border-left-color: var(--status-warn); background: #fffbeb; }
.insight-card.info { border-left-color: var(--status-info); background: #eff6ff; }
.insight-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}
.insight-icon { font-size: var(--font-size-lg); }
.insight-severity { font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
.insight-metric { margin-left: auto; }
.insight-title { font-size: var(--font-size-base); margin-bottom: var(--space-sm); }
.insight-desc { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; }

/* Glossary tooltips */
.glossary-link {
  cursor: help;
  border-bottom: 1px dotted var(--text-tertiary);
  position: relative;
}
.info-icon {
  font-size: 9px;
  vertical-align: super;
  color: var(--accent-secondary);
  font-style: normal;
}
.glossary-tooltip {
  position: fixed;
  background: var(--text-primary);
  color: #fff;
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  max-width: 320px;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  line-height: 1.5;
}

/* Hover tooltips ([data-tip]) */
.hover-tip {
  position: fixed;
  z-index: 2000;
  max-width: 300px;
  background: var(--text-primary);
  color: #fff;
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  font-size: var(--font-size-sm);
  line-height: 1.4;
  pointer-events: none;
  opacity: 0;
  transition: opacity 100ms;
}
.hover-tip.visible { opacity: 1; }

/* About modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: var(--space-xl);
}
.modal-content {
  background: var(--bg-panel);
  border-radius: var(--radius-lg);
  padding: var(--space-2xl);
  max-width: 640px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}
.modal-content h2 { margin-bottom: var(--space-lg); }
.modal-content h3 {
  font-size: var(--font-size-base);
  margin-top: var(--space-xl);
  margin-bottom: var(--space-sm);
  color: var(--accent-primary);
}
.modal-content p, .modal-content li {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
  line-height: 1.6;
}
.modal-content ul { padding-left: var(--space-xl); }
.modal-content a { color: var(--accent-primary); }
.modal-close {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: var(--text-secondary);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
}
.modal-close:hover { background: var(--bg-hover); }

/* Chart legend */
.chart-legend {
  display: flex;
  gap: var(--space-lg);
  margin-top: var(--space-md);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}
.legend-item { display: flex; align-items: center; gap: var(--space-xs); }
.legend-line { display: inline-block; height: 14px; }

/* Info list */
.info-list {
  padding-left: var(--space-xl);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}
.info-list li { margin-bottom: var(--space-sm); line-height: 1.6; }

/* Focus */
*:focus-visible {
  outline: 2px solid var(--accent-secondary);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .summary-cards { grid-template-columns: 1fr 1fr; }
  .main-content { padding: var(--space-md); }
  .site-header { padding: 0 var(--space-md); }
  .nav-tabs { padding: 0 var(--space-md); }
  .cat-row { grid-template-columns: 100px 1fr 120px; }
  .insight-grid { grid-template-columns: 1fr; }
  .state-meta { flex-direction: column; gap: var(--space-sm); }
}
@media (max-width: 480px) {
  .summary-cards { grid-template-columns: 1fr; }
  .cat-row { grid-template-columns: 1fr; gap: var(--space-xs); }
  .cat-values { justify-content: flex-start; }
}
`;
document.head.appendChild(style);

// ── App Shell ──
type ViewId = 'overview' | 'by-state' | 'by-category' | 'trends' | 'map' | 'matrix' | 'leaderboard' | 'insights';

const TABS: { id: ViewId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'by-state', label: 'By State' },
  { id: 'by-category', label: 'By Category' },
  { id: 'trends', label: 'Trends' },
  { id: 'map', label: 'Map' },
  { id: 'matrix', label: 'Matrix' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'insights', label: 'Insights' },
];

function createApp(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="site-header">
      <h1>Crime Statistics (AU) <span>${LATEST_YEAR} data</span></h1>
      <div class="header-right">
        <button class="about-btn" id="about-btn" aria-label="About this site" data-tip="About this site">?</button>
      </div>
    </header>
    <nav class="nav-tabs" id="nav-tabs">
      ${TABS.map(tab => `<button class="nav-tab" data-view="${tab.id}">${tab.label}</button>`).join('')}
    </nav>
    <main class="main-content" id="main-content"></main>
    <footer class="site-footer">
      Data: ABS Recorded Crime, BOCSAR, state police agencies &middot; Rates per 100,000 ERP &middot;
      Built by <a href="https://benrichardson.dev/">benrichardson.dev</a> · <a href="https://hub.benrichardson.dev" target="_blank" rel="noopener">more tools &amp; sites</a>
    </footer>
  `;

  initTooltips();
  initTooltip();

  document.getElementById('about-btn')?.addEventListener('click', showAboutModal);

  document.getElementById('nav-tabs')?.addEventListener('click', (e) => {
    const tab = (e.target as HTMLElement).closest('.nav-tab') as HTMLElement | null;
    if (!tab) return;
    const view = tab.dataset.view;
    if (view) window.location.hash = `#${view}`;
  });

  window.addEventListener('hashchange', () => route());
  route();
}

function route(): void {
  const hash = window.location.hash.slice(1) || 'overview';
  const parts = hash.split('/');
  const viewId = parts[0] as ViewId;
  const param = parts[1];

  const content = document.getElementById('main-content');
  if (!content) return;

  // Update active tab
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-view') === viewId);
  });

  content.innerHTML = '';

  switch (viewId) {
    case 'overview':
      renderOverview(content);
      break;
    case 'by-state':
      renderByState(content, param);
      break;
    case 'by-category':
      renderByCategory(content, param);
      break;
    case 'trends':
      renderTrends(content);
      break;
    case 'map':
      renderMap(content);
      break;
    case 'matrix':
      renderMatrix(content);
      break;
    case 'leaderboard':
      renderLeaderboard(content);
      break;
    case 'insights':
      renderInsights(content);
      break;
    default:
      renderOverview(content);
  }
}

createApp();
