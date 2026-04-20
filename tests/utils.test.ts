import { describe, expect, it } from 'vitest';
import {
  formatNumber, formatRate, formatPercent, formatCompact,
  median, mean, percentChange,
  getStateSummaries, generateInsights,
} from '../src/utils';

describe('formatNumber', () => {
  it('formats zero', () => {
    expect(formatNumber(0)).toBe('0');
  });

  it('formats thousands with locale separators', () => {
    const result = formatNumber(1234567);
    // Accept either comma or period as thousands separator depending on locale
    expect(result).toMatch(/1[,.]234[,.]567/);
  });

  it('formats small numbers without separator', () => {
    expect(formatNumber(42)).toBe('42');
  });
});

describe('formatRate', () => {
  it('formats rates with decimal places', () => {
    expect(formatRate(123.456, 1)).toBe('123.5');
  });

  it('formats small rates with more precision', () => {
    expect(formatRate(0.05)).toBe('0.05');
  });

  it('formats single-digit rates', () => {
    expect(formatRate(5.67)).toBe('5.7');
  });
});

describe('formatPercent', () => {
  it('adds plus sign for positive values', () => {
    expect(formatPercent(12.3)).toBe('+12.3%');
  });

  it('shows negative sign for negative values', () => {
    expect(formatPercent(-8.5)).toBe('-8.5%');
  });

  it('formats zero', () => {
    expect(formatPercent(0)).toBe('0.0%');
  });

  it('respects decimal places parameter', () => {
    expect(formatPercent(12.345, 2)).toBe('+12.35%');
  });
});

describe('formatCompact', () => {
  it('formats millions', () => {
    expect(formatCompact(1500000)).toBe('1.5M');
  });

  it('formats thousands', () => {
    expect(formatCompact(42500)).toBe('42.5K');
  });

  it('leaves small numbers as-is', () => {
    expect(formatCompact(999)).toBe('999');
  });
});

describe('median', () => {
  it('returns median of odd-length array', () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it('returns median of even-length array', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });

  it('returns 0 for empty array', () => {
    expect(median([])).toBe(0);
  });

  it('returns the single element for length-1 array', () => {
    expect(median([42])).toBe(42);
  });
});

describe('mean', () => {
  it('computes mean', () => {
    expect(mean([10, 20, 30])).toBe(20);
  });

  it('returns 0 for empty array', () => {
    expect(mean([])).toBe(0);
  });
});

describe('percentChange', () => {
  it('computes positive change', () => {
    expect(percentChange(100, 120)).toBe(20);
  });

  it('computes negative change', () => {
    expect(percentChange(100, 80)).toBe(-20);
  });

  it('handles zero old value', () => {
    expect(percentChange(0, 50)).toBe(100);
  });

  it('handles both zero', () => {
    expect(percentChange(0, 0)).toBe(0);
  });
});

describe('getStateSummaries', () => {
  it('returns summaries for all 8 states', () => {
    const summaries = getStateSummaries();
    expect(summaries).toHaveLength(8);
  });

  it('each summary has required fields', () => {
    const summaries = getStateSummaries();
    for (const s of summaries) {
      expect(s).toHaveProperty('state');
      expect(s).toHaveProperty('population');
      expect(s).toHaveProperty('totalOffences');
      expect(s).toHaveProperty('ratePer100k');
      expect(s).toHaveProperty('yoyChange');
      expect(s).toHaveProperty('topCategory');
    }
  });

  it('is sorted by rate descending', () => {
    const summaries = getStateSummaries();
    for (let i = 1; i < summaries.length; i++) {
      expect(summaries[i - 1].ratePer100k).toBeGreaterThanOrEqual(summaries[i].ratePer100k);
    }
  });

  it('NT has the highest rate (known outlier)', () => {
    const summaries = getStateSummaries();
    expect(summaries[0].state).toBe('NT');
  });
});

describe('generateInsights', () => {
  it('returns an array of insights', () => {
    const insights = generateInsights();
    expect(Array.isArray(insights)).toBe(true);
    expect(insights.length).toBeGreaterThan(0);
  });

  it('each insight has required fields', () => {
    const insights = generateInsights();
    for (const i of insights) {
      expect(i).toHaveProperty('severity');
      expect(i).toHaveProperty('title');
      expect(i).toHaveProperty('description');
      expect(i).toHaveProperty('metric');
      expect(i).toHaveProperty('value');
      expect(['alert', 'warning', 'info']).toContain(i.severity);
    }
  });

  it('is sorted by severity (alerts first)', () => {
    const insights = generateInsights();
    const severityOrder = { alert: 0, warning: 1, info: 2 };
    for (let i = 1; i < insights.length; i++) {
      expect(severityOrder[insights[i - 1].severity]).toBeLessThanOrEqual(severityOrder[insights[i].severity]);
    }
  });

  it('includes NT as an outlier', () => {
    const insights = generateInsights();
    const ntInsights = insights.filter(i => i.title.includes('NT'));
    expect(ntInsights.length).toBeGreaterThan(0);
  });
});
