import { generateInsights } from '../utils';
import { glossarySpan } from '../tooltip';

export function renderInsights(container: HTMLElement): void {
  const insights = generateInsights();

  const alertCount = insights.filter(i => i.severity === 'alert').length;
  const warningCount = insights.filter(i => i.severity === 'warning').length;
  const infoCount = insights.filter(i => i.severity === 'info').length;

  container.innerHTML = `
    <div class="insights-view">
      <div class="panel">
        <h3 class="panel-title">Automated ${glossarySpan('Anomaly')} Detection</h3>
        <p class="panel-subtitle">Statistical outliers and notable patterns detected across all states and categories. These insights are generated automatically by scanning for ${glossarySpan('YoY change')}s >15%, rates >2× the ${glossarySpan('median')}, and 10-year trend extremes.</p>
        <div class="insight-summary">
          <span class="insight-badge alert">${alertCount} Alert${alertCount !== 1 ? 's' : ''}</span>
          <span class="insight-badge warning">${warningCount} Warning${warningCount !== 1 ? 's' : ''}</span>
          <span class="insight-badge info">${infoCount} Insight${infoCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div class="insight-grid">
        ${insights.map(insight => `
          <div class="insight-card ${insight.severity}">
            <div class="insight-header">
              <span class="insight-icon">${severityIcon(insight.severity)}</span>
              <span class="insight-severity">${insight.severity.toUpperCase()}</span>
              <span class="insight-metric">${insight.metric}: <strong class="mono">${insight.value}</strong></span>
            </div>
            <h4 class="insight-title">${insight.title}</h4>
            <p class="insight-desc">${insight.description}</p>
          </div>
        `).join('')}
      </div>

      ${insights.length === 0 ? '<div class="panel"><p class="text-secondary">No significant anomalies detected in the current dataset.</p></div>' : ''}
    </div>
  `;
}

function severityIcon(severity: string): string {
  switch (severity) {
    case 'alert': return '&#9888;';    // ⚠
    case 'warning': return '&#9679;';  // ●
    case 'info': return '&#8505;';     // ℹ
    default: return '&#8226;';
  }
}
