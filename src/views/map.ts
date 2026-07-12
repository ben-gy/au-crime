import {
  STATES, STATE_NAMES, CATEGORY_IDS, CATEGORY_MAP,
  getYearData, totalOffences, ratePer100k,
  LATEST_YEAR, type StateCode,
} from '../data';
import { formatNumber, formatRate, median } from '../utils';
import { glossarySpan } from '../tooltip';

// Simplified Australian state centroids for marker placement
const STATE_CENTROIDS: Record<StateCode, [number, number]> = {
  NSW: [-32.8, 147.5],
  VIC: [-37.0, 144.5],
  QLD: [-22.5, 144.5],
  WA: [-25.5, 122.0],
  SA: [-30.5, 135.5],
  TAS: [-42.0, 146.5],
  ACT: [-35.3, 149.1],
  NT: [-19.5, 133.5],
};

let mapInstance: L.Map | null = null;
let selectedCategory = 'total';

export async function renderMap(container: HTMLElement): Promise<void> {
  container.innerHTML = `
    <div class="map-view">
      <div class="trends-controls">
        <div class="control-group">
          <label>Metric:</label>
          <select id="map-category">
            <option value="total" selected>All Offences (Total)</option>
            ${CATEGORY_IDS.map(cat => `<option value="${cat}">${CATEGORY_MAP[cat].label}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="panel" style="padding:0;overflow:hidden">
        <div id="crime-map" style="height:550px;width:100%;background:var(--bg-surface)"></div>
      </div>
      <div class="panel">
        <h3 class="panel-title">Map Legend</h3>
        <p class="panel-subtitle">${glossarySpan('Rate per 100K')} — circle size and colour intensity indicate crime rate relative to other states</p>
        <div class="map-legend" id="map-legend"></div>
      </div>
    </div>
  `;

  await loadLeaflet();
  initMap();

  document.getElementById('map-category')?.addEventListener('change', (e) => {
    selectedCategory = (e.target as HTMLSelectElement).value;
    updateMapMarkers();
  });
}

async function loadLeaflet(): Promise<void> {
  if (document.querySelector('link[href*="leaflet"]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  await new Promise<void>((resolve) => {
    if (window.L) { resolve(); return; }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

function getStateRate(state: StateCode): number {
  const data = getYearData(LATEST_YEAR);
  const record = data.find(r => r.state === state);
  if (!record) return 0;
  if (selectedCategory === 'total') {
    return ratePer100k(totalOffences(record), record.population);
  }
  return ratePer100k(record.offences[selectedCategory] || 0, record.population);
}

function rateToColor(rate: number, minRate: number, maxRate: number): string {
  const t = maxRate === minRate ? 0.5 : (rate - minRate) / (maxRate - minRate);
  // Blue (low) to Red (high)
  const r = Math.round(30 + t * 195);
  const g = Math.round(100 - t * 60);
  const b = Math.round(180 - t * 150);
  return `rgb(${r},${g},${b})`;
}

function rateToRadius(rate: number, minRate: number, maxRate: number): number {
  const t = maxRate === minRate ? 0.5 : (rate - minRate) / (maxRate - minRate);
  return 15 + t * 30;
}

let markers: L.CircleMarker[] = [];

function initMap(): void {
  const el = document.getElementById('crime-map');
  if (!el || !window.L) return;

  mapInstance = window.L.map(el, {
    center: [-28, 135],
    zoom: 4,
    zoomControl: true,
    attributionControl: true,
  });

  window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 10,
  }).addTo(mapInstance);

  updateMapMarkers();
}

function updateMapMarkers(): void {
  if (!mapInstance || !window.L) return;

  markers.forEach(m => mapInstance!.removeLayer(m));
  markers = [];

  const rates = STATES.map(s => ({ state: s, rate: getStateRate(s) }));
  const minRate = Math.min(...rates.map(r => r.rate));
  const maxRate = Math.max(...rates.map(r => r.rate));
  const medRate = median(rates.map(r => r.rate));

  for (const { state, rate } of rates) {
    const [lat, lng] = STATE_CENTROIDS[state];
    const color = rateToColor(rate, minRate, maxRate);
    const radius = rateToRadius(rate, minRate, maxRate);

    const data = getYearData(LATEST_YEAR).find(r => r.state === state);
    const count = data ? (selectedCategory === 'total' ? totalOffences(data) : (data.offences[selectedCategory] || 0)) : 0;

    const marker = window.L.circleMarker([lat, lng], {
      radius,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.7,
    }).addTo(mapInstance!);

    const catLabel = selectedCategory === 'total' ? 'All Offences' : CATEGORY_MAP[selectedCategory]?.label || selectedCategory;
    marker.bindTooltip(
      `${STATE_NAMES[state]} — ${catLabel} (${LATEST_YEAR}): ${formatRate(rate, 0)} per 100K — ${formatNumber(count)} offences`,
      { sticky: true }
    );
    marker.bindPopup(`
      <div style="font-family:var(--font-sans);min-width:160px">
        <strong>${STATE_NAMES[state]}</strong><br/>
        <span style="color:#666">${catLabel} (${LATEST_YEAR})</span><br/>
        <strong style="font-family:var(--font-mono)">${formatRate(rate, 0)}</strong> per 100K<br/>
        <span style="font-family:var(--font-mono)">${formatNumber(count)}</span> offences<br/>
        <span style="font-family:var(--font-mono)">${formatNumber(data?.population || 0)}</span> population
      </div>
    `);

    markers.push(marker);
  }

  // Update legend
  const legend = document.getElementById('map-legend');
  if (legend) {
    legend.innerHTML = `
      <div class="legend-scale">
        <div class="legend-gradient" style="background:linear-gradient(90deg, ${rateToColor(minRate, minRate, maxRate)}, ${rateToColor(medRate, minRate, maxRate)}, ${rateToColor(maxRate, minRate, maxRate)})"></div>
        <div class="legend-labels">
          <span class="mono">${formatRate(minRate, 0)}</span>
          <span class="mono">${formatRate(medRate, 0)}</span>
          <span class="mono">${formatRate(maxRate, 0)}</span>
        </div>
        <div class="legend-labels">
          <span>Low</span>
          <span>Median</span>
          <span>High</span>
        </div>
      </div>
    `;
  }
}

// Leaflet type augmentation
declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}
