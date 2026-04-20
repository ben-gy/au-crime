import { GLOSSARY_MAP } from './glossary';

let tooltipEl: HTMLDivElement | null = null;
let aboutModalEl: HTMLDivElement | null = null;

export function glossarySpan(term: string): string {
  const entry = GLOSSARY_MAP.get(term.toLowerCase());
  if (!entry) return term;
  return `<span class="glossary-link" data-term="${term.toLowerCase()}">${term} <span class="info-icon">ℹ</span></span>`;
}

export function initTooltips(): void {
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'glossary-tooltip';
  tooltipEl.style.display = 'none';
  document.body.appendChild(tooltipEl);

  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('.glossary-link') as HTMLElement | null;

    if (link && tooltipEl) {
      e.stopPropagation();
      const term = link.dataset.term;
      if (!term) return;
      const entry = GLOSSARY_MAP.get(term);
      if (!entry) return;

      tooltipEl.innerHTML = `<strong>${entry.term}</strong><br/>${entry.definition}`;
      tooltipEl.style.display = 'block';

      const rect = link.getBoundingClientRect();
      const tipRect = tooltipEl.getBoundingClientRect();

      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      let top = rect.bottom + 8;

      if (left < 8) left = 8;
      if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
      if (top + tipRect.height > window.innerHeight - 8) {
        top = rect.top - tipRect.height - 8;
      }

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    } else if (tooltipEl) {
      tooltipEl.style.display = 'none';
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (tooltipEl) tooltipEl.style.display = 'none';
      closeAboutModal();
    }
  });
}

export function showAboutModal(): void {
  if (aboutModalEl) {
    aboutModalEl.style.display = 'flex';
    return;
  }

  aboutModalEl = document.createElement('div');
  aboutModalEl.className = 'modal-overlay';
  aboutModalEl.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" aria-label="Close">&times;</button>
      <h2>About Crime Statistics (AU)</h2>

      <h3>What is this?</h3>
      <p>This site provides a unified view of recorded crime statistics across all Australian states and territories. Each state reports crime data differently — different time periods, terminology, geographic units, and file formats. This site normalises everything into a single consistent interface using ANZSOC (Australian and New Zealand Standard Offence Classification) categories.</p>

      <h3>Data Sources</h3>
      <ul>
        <li><strong>ABS Recorded Crime – Victims</strong> (Cat. 4510.0) — National standardised victim counts by offence type, published annually. Currently showing 2014–2024 data.</li>
        <li><strong>NSW BOCSAR</strong> — LGA-level breakdown for New South Wales, the most granular state-level dataset available.</li>
        <li><strong>State police agencies</strong> — Queensland (QPS via data.qld.gov.au), South Australia (SAPOL via data.sa.gov.au), Victoria (CSA), and others provide additional detail.</li>
      </ul>

      <h3>How rates are calculated</h3>
      <p>All rates are expressed as offences per 100,000 Estimated Resident Population (ERP). Population figures come from the ABS. This allows fair comparison between areas with very different populations.</p>

      <h3>Important caveats</h3>
      <ul>
        <li><strong>Recorded crime ≠ actual crime.</strong> These statistics only include offences reported to and recorded by police. The "dark figure" of unreported crime varies by offence type — sexual assault is significantly underreported, while motor vehicle theft is well-reported (due to insurance requirements).</li>
        <li><strong>Changes in reporting.</strong> Increases in sexual assault statistics often reflect improved reporting practices and policing responses, not necessarily increases in actual offending.</li>
        <li><strong>State comparisons.</strong> While ANZSOC provides a standard framework, states still have different policing practices, recording rules, and legislative definitions. Direct state comparisons should be interpreted with caution.</li>
        <li><strong>Small populations.</strong> Rates for the NT, ACT, and TAS can be volatile due to small population bases — a few incidents can swing rates significantly.</li>
      </ul>

      <h3>Update frequency</h3>
      <p>The ABS national dataset is updated annually. State-level data from BOCSAR (NSW) is updated quarterly. A data pipeline refreshes this site weekly when new data is available.</p>

      <p class="text-secondary" style="margin-top:var(--space-xl)">Built by <a href="https://benrichardson.dev/" target="_blank" rel="noopener">benrichardson.dev</a></p>
    </div>
  `;
  document.body.appendChild(aboutModalEl);

  aboutModalEl.querySelector('.modal-close')?.addEventListener('click', closeAboutModal);
  aboutModalEl.addEventListener('click', (e) => {
    if (e.target === aboutModalEl) closeAboutModal();
  });
}

function closeAboutModal(): void {
  if (aboutModalEl) aboutModalEl.style.display = 'none';
}
