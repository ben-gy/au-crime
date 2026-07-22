#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Aggregates raw crime data into normalised JSON for the frontend
// Reads from pipeline/raw/, writes to public/data/

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_DIR = join(__dirname, 'raw');
const DATA_DIR = join(__dirname, '..', 'public', 'data');
mkdirSync(DATA_DIR, { recursive: true });

// ANZSOC category mapping for QLD offence columns
const QLD_CATEGORY_MAP = {
  homicide: ['Homicide (Murder)', 'Other Homicide', 'Attempted Murder', 'Conspiracy to Murder', 'Manslaughter (excl Motor Vehicle)', 'Manslaughter - Loss Control of M/Vehicle'],
  assault: ['Assault', 'Grievous Assault', 'Serious Assault', 'Serious Assault (Other)', 'Common Assault'],
  sexual_assault: ['Sexual Offences', 'Rape and Attempted Rape', 'Other Sexual Offences'],
  robbery: ['Robbery', 'Armed Robbery', 'Unarmed Robbery'],
  kidnapping: ['Kidnapping & Abduction etc', 'Kidnapping', 'Abduction'],
  blackmail: ['Extortion'],
  unlawful_entry: ['Unlawful Entry With Intent - Dwelling', 'Unlawful Entry With Intent - Shop', 'Unlawful Entry With Intent - Other', 'Unlawful Entry Without Violence - Dwelling', 'Unlawful Entry Without Violence - Shop', 'Unlawful Entry Without Violence - Other'],
  motor_vehicle_theft: ['Unlawful Use of Motor Vehicle'],
  other_theft: ['Other Theft (excl. Unlawful Entry)', 'Stealing from Dwellings', 'Shop Stealing', 'Other Stealing'],
  fraud: ['Fraud by Computer', 'Fraud by Cheque', 'Fraud by Credit Card', 'Identity Fraud', 'Other Fraud'],
  property_damage: ['Arson', 'Other Property Damage'],
  drug_offences: ['Drug Offences', 'Trafficking Drugs', 'Possess Drugs', 'Produce Drugs', 'Other Drug Offences'],
};

function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ''; });
    return obj;
  });
}

function aggregateQLD() {
  const csvPath = join(RAW_DIR, 'qld-divisions.csv');
  if (!existsSync(csvPath)) {
    console.log('[QLD] No raw data found, skipping aggregation');
    return null;
  }

  console.log('[QLD] Parsing CSV...');
  const text = readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(text);
  console.log(`[QLD] Parsed ${rows.length} rows`);

  // Aggregate by year
  const yearTotals = {};

  for (const row of rows) {
    const monthYear = row['Month Year'] || '';
    const yearMatch = monthYear.match(/(\d{2,4})$/);
    if (!yearMatch) continue;

    let year = parseInt(yearMatch[1]);
    if (year < 100) year += 2000;
    if (year < 2014 || year > 2026) continue;

    if (!yearTotals[year]) {
      yearTotals[year] = {};
      for (const cat of Object.keys(QLD_CATEGORY_MAP)) {
        yearTotals[year][cat] = 0;
      }
    }

    // Map QLD columns to ANZSOC categories
    for (const [cat, columns] of Object.entries(QLD_CATEGORY_MAP)) {
      for (const col of columns) {
        const val = parseInt(row[col] || '0');
        if (!isNaN(val)) yearTotals[year][cat] += val;
      }
    }
  }

  return yearTotals;
}

function aggregateSA() {
  const files = existsSync(RAW_DIR)
    ? readdirSync(RAW_DIR).filter(f => f.startsWith('sa-') && f.endsWith('.csv'))
    : [];

  if (files.length === 0) {
    console.log('[SA] No raw data found, skipping aggregation');
    return null;
  }

  console.log(`[SA] Processing ${files.length} CSV files...`);
  const yearTotals = {};

  for (const file of files) {
    const text = readFileSync(join(RAW_DIR, file), 'utf-8');
    const rows = parseCSV(text);

    for (const row of rows) {
      const dateStr = row['Reported Date'] || '';
      const dateParts = dateStr.split('/');
      if (dateParts.length < 3) continue;
      const year = parseInt(dateParts[2]);
      if (year < 2014 || year > 2026) continue;

      if (!yearTotals[year]) yearTotals[year] = {};

      const level2 = (row['Offence Level 2 Description'] || '').toUpperCase();
      const count = parseInt(row['Offence count'] || '0');
      if (isNaN(count)) continue;

      // Map SA categories to ANZSOC
      let cat = 'other_theft';
      if (level2.includes('ASSAULT') && !level2.includes('SEXUAL')) cat = 'assault';
      else if (level2.includes('SEXUAL')) cat = 'sexual_assault';
      else if (level2.includes('HOMICIDE') || level2.includes('MURDER')) cat = 'homicide';
      else if (level2.includes('ROBBERY')) cat = 'robbery';
      else if (level2.includes('THEFT') && level2.includes('MOTOR')) cat = 'motor_vehicle_theft';
      else if (level2.includes('THEFT') || level2.includes('STEAL')) cat = 'other_theft';
      else if (level2.includes('FRAUD') || level2.includes('DECEPTION')) cat = 'fraud';
      else if (level2.includes('DAMAGE') || level2.includes('ARSON')) cat = 'property_damage';
      else if (level2.includes('DRUG')) cat = 'drug_offences';
      else if (level2.includes('BREAK') || level2.includes('ENTRY')) cat = 'unlawful_entry';

      yearTotals[year][cat] = (yearTotals[year][cat] || 0) + count;
    }
  }

  return yearTotals;
}

function main() {
  console.log('=== Crime Statistics Data Aggregation ===');

  const output = {
    updated: new Date().toISOString(),
    states: {},
  };

  const qld = aggregateQLD();
  if (qld) {
    output.states.QLD = qld;
    console.log(`[QLD] Aggregated ${Object.keys(qld).length} years`);
  }

  const sa = aggregateSA();
  if (sa) {
    output.states.SA = sa;
    console.log(`[SA] Aggregated ${Object.keys(sa).length} years`);
  }

  writeFileSync(join(DATA_DIR, 'pipeline-data.json'), JSON.stringify(output, null, 2));
  console.log(`\nWrote pipeline-data.json to ${DATA_DIR}`);
}

main();
