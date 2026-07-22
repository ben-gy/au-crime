// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Ben Richardson — https://benrichardson.dev
// Additional terms under AGPL-3.0 section 7(b) apply; see ADDITIONAL-TERMS.md.
// Utility functions: formatting, statistics, analysis

import {
  NATIONAL_DATA, CATEGORY_IDS, CATEGORY_MAP, STATES,
  getYearData, totalOffences, ratePer100k, getNationalTotals,
  LATEST_YEAR, PREV_YEAR,
  type StateCode,
} from './data';

// ── Formatters ──

export function formatNumber(n: number): string {
  if (n === 0) return '0';
  return n.toLocaleString('en-AU');
}

export function formatRate(rate: number, decimals = 1): string {
  if (rate < 0.1) return rate.toFixed(2);
  if (rate < 10) return rate.toFixed(decimals);
  return rate.toFixed(decimals);
}

export function formatPercent(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Statistics ──

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

export function percentChange(oldVal: number, newVal: number): number {
  if (oldVal === 0) return newVal > 0 ? 100 : 0;
  return ((newVal - oldVal) / oldVal) * 100;
}

// ── Analysis ──

export interface Insight {
  severity: 'info' | 'warning' | 'alert';
  title: string;
  description: string;
  metric: string;
  value: string;
}

export function generateInsights(): Insight[] {
  const insights: Insight[] = [];
  const latestData = getYearData(LATEST_YEAR);
  const prevData = getYearData(PREV_YEAR);

  // 1. YoY changes by state × category
  for (const state of STATES) {
    const latest = latestData.find(r => r.state === state);
    const prev = prevData.find(r => r.state === state);
    if (!latest || !prev) continue;

    for (const cat of CATEGORY_IDS) {
      const latestRate = ratePer100k(latest.offences[cat] || 0, latest.population);
      const prevRate = ratePer100k(prev.offences[cat] || 0, prev.population);
      const change = percentChange(prevRate, latestRate);
      const catLabel = CATEGORY_MAP[cat].label;

      if (Math.abs(change) > 15) {
        insights.push({
          severity: change > 25 ? 'alert' : 'warning',
          title: `${state}: ${catLabel} ${change > 0 ? 'spike' : 'drop'}`,
          description: `${catLabel} rate in ${state} changed ${formatPercent(change)} year-on-year (${formatRate(prevRate)} → ${formatRate(latestRate)} per 100K).`,
          metric: 'YoY Change',
          value: formatPercent(change),
        });
      }
    }
  }

  // 2. States with rates >2x national median
  const nationalTotals = getNationalTotals(LATEST_YEAR);
  for (const cat of CATEGORY_IDS) {
    const stateRates = latestData.map(r => ratePer100k(r.offences[cat] || 0, r.population));
    const med = median(stateRates);
    const catLabel = CATEGORY_MAP[cat].label;

    for (const record of latestData) {
      const rate = ratePer100k(record.offences[cat] || 0, record.population);
      if (rate > med * 2 && med > 0) {
        insights.push({
          severity: 'alert',
          title: `${record.state}: ${catLabel} rate is ${(rate / med).toFixed(1)}× the median`,
          description: `${record.state} has a ${catLabel} rate of ${formatRate(rate)} per 100K, compared to the state median of ${formatRate(med)} per 100K.`,
          metric: 'vs Median',
          value: `${(rate / med).toFixed(1)}×`,
        });
      }
    }
  }

  // 3. 10-year trend extremes
  for (const state of STATES) {
    const stateData = NATIONAL_DATA.filter(r => r.state === state);
    const first = stateData[0];
    const last = stateData[stateData.length - 1];
    if (!first || !last) continue;

    const firstRate = ratePer100k(totalOffences(first), first.population);
    const lastRate = ratePer100k(totalOffences(last), last.population);
    const decadeChange = percentChange(firstRate, lastRate);

    if (Math.abs(decadeChange) > 20) {
      insights.push({
        severity: 'info',
        title: `${state}: Total crime rate ${decadeChange > 0 ? 'up' : 'down'} ${Math.abs(decadeChange).toFixed(0)}% over 10 years`,
        description: `${state}'s overall crime rate moved from ${formatRate(firstRate, 0)} to ${formatRate(lastRate, 0)} per 100K between 2014 and 2024.`,
        metric: '10yr Change',
        value: formatPercent(decadeChange, 0),
      });
    }
  }

  // 4. Highest per-capita total crime rate
  const totalRates = latestData.map(r => ({
    state: r.state,
    rate: ratePer100k(totalOffences(r), r.population),
  }));
  totalRates.sort((a, b) => b.rate - a.rate);
  if (totalRates.length >= 2) {
    const top = totalRates[0];
    const bottom = totalRates[totalRates.length - 1];
    insights.push({
      severity: 'info',
      title: `${top.state} has the highest crime rate; ${bottom.state} the lowest`,
      description: `${top.state} recorded ${formatRate(top.rate, 0)} offences per 100K in ${LATEST_YEAR}, ${(top.rate / bottom.rate).toFixed(1)}× higher than ${bottom.state} at ${formatRate(bottom.rate, 0)} per 100K.`,
      metric: 'Gap',
      value: `${(top.rate / bottom.rate).toFixed(1)}×`,
    });
  }

  // 5. Fastest-growing categories nationally
  const natPrev = getNationalTotals(PREV_YEAR);
  const catChanges = CATEGORY_IDS.map(cat => ({
    cat,
    change: percentChange(
      ratePer100k(natPrev.offences[cat] || 0, natPrev.population),
      ratePer100k(nationalTotals.offences[cat] || 0, nationalTotals.population)
    ),
  }));
  catChanges.sort((a, b) => b.change - a.change);
  const fastest = catChanges[0];
  if (fastest && fastest.change > 5) {
    insights.push({
      severity: 'warning',
      title: `${CATEGORY_MAP[fastest.cat].label} is the fastest-growing category nationally`,
      description: `The national ${CATEGORY_MAP[fastest.cat].label} rate increased ${formatPercent(fastest.change)} year-on-year.`,
      metric: 'National YoY',
      value: formatPercent(fastest.change),
    });
  }

  // Sort by severity
  const severityOrder: Record<string, number> = { alert: 0, warning: 1, info: 2 };
  insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Deduplicate and limit
  const seen = new Set<string>();
  return insights.filter(i => {
    if (seen.has(i.title)) return false;
    seen.add(i.title);
    return true;
  }).slice(0, 25);
}

// ── State summary for overview ──

export interface StateSummary {
  state: StateCode;
  population: number;
  totalOffences: number;
  ratePer100k: number;
  yoyChange: number;
  topCategory: string;
  topCategoryRate: number;
}

export function getStateSummaries(): StateSummary[] {
  const latestData = getYearData(LATEST_YEAR);
  const prevData = getYearData(PREV_YEAR);

  return latestData.map(record => {
    const prev = prevData.find(r => r.state === record.state);
    const total = totalOffences(record);
    const rate = ratePer100k(total, record.population);
    const prevRate = prev ? ratePer100k(totalOffences(prev), prev.population) : rate;

    // Find top category
    let topCat = CATEGORY_IDS[0];
    let topCount = 0;
    for (const cat of CATEGORY_IDS) {
      if ((record.offences[cat] || 0) > topCount) {
        topCount = record.offences[cat] || 0;
        topCat = cat;
      }
    }

    return {
      state: record.state as StateCode,
      population: record.population,
      totalOffences: total,
      ratePer100k: rate,
      yoyChange: percentChange(prevRate, rate),
      topCategory: CATEGORY_MAP[topCat].label,
      topCategoryRate: ratePer100k(topCount, record.population),
    };
  }).sort((a, b) => b.ratePer100k - a.ratePer100k);
}
