#!/usr/bin/env node
// Collects crime statistics data from Australian state sources
// Outputs raw data to pipeline/raw/

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, 'raw');
mkdirSync(RAW_DIR, { recursive: true });

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

async function fetchText(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.text();
}

async function collectQLD() {
  console.log('[QLD] Fetching offence numbers by division...');
  try {
    // QLD Crime data from data.qld.gov.au CKAN API
    const meta = await fetchJSON('https://www.data.qld.gov.au/api/3/action/package_show?id=offence-numbers-police-divisions-monthly-from-july-2001');
    const csvResource = meta.result.resources.find(r => r.format === 'CSV' && r.name.includes('Reported'));
    if (!csvResource) {
      console.log('[QLD] No CSV resource found, skipping');
      return;
    }
    console.log(`[QLD] Downloading from ${csvResource.url} ...`);
    const csv = await fetchText(csvResource.url);
    writeFileSync(join(RAW_DIR, 'qld-divisions.csv'), csv);
    console.log(`[QLD] Saved ${(csv.length / 1024 / 1024).toFixed(1)} MB`);
  } catch (err) {
    console.error('[QLD] Error:', err.message);
  }
}

async function collectSA() {
  console.log('[SA] Fetching crime statistics...');
  try {
    const meta = await fetchJSON('https://data.sa.gov.au/data/api/3/action/package_show?id=crime-statistics');
    // Get the latest CSV resource
    const csvResources = meta.result.resources
      .filter(r => r.format === 'CSV' && r.name.includes('crime'))
      .sort((a, b) => new Date(b.last_modified).getTime() - new Date(a.last_modified).getTime());

    for (const resource of csvResources.slice(0, 3)) {
      console.log(`[SA] Downloading ${resource.name}...`);
      const csv = await fetchText(resource.url);
      const safeName = resource.name.replace(/[^a-zA-Z0-9.-]/g, '_').toLowerCase();
      writeFileSync(join(RAW_DIR, `sa-${safeName}.csv`), csv);
      console.log(`[SA] Saved ${(csv.length / 1024).toFixed(0)} KB`);
    }
  } catch (err) {
    console.error('[SA] Error:', err.message);
  }
}

async function collectNSW() {
  console.log('[NSW] Fetching BOCSAR LGA trends...');
  try {
    const url = 'https://bocsar.nsw.gov.au/content/dam/dcj/bocsar/documents/open-datasets/LGA_trends.xlsx';
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(join(RAW_DIR, 'nsw-lga-trends.xlsx'), buffer);
    console.log(`[NSW] Saved ${(buffer.length / 1024).toFixed(0)} KB`);
  } catch (err) {
    console.error('[NSW] Error:', err.message);
  }
}

async function main() {
  console.log('=== Crime Statistics Data Collection ===');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log();

  await Promise.allSettled([
    collectQLD(),
    collectSA(),
    collectNSW(),
  ]);

  console.log();
  console.log('Collection complete.');
}

main().catch(console.error);
