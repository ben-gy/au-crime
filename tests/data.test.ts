import { describe, expect, it } from 'vitest';
import {
  STATES, STATE_NAMES, STATE_COLORS, CATEGORIES, CATEGORY_IDS,
  NATIONAL_DATA, NSW_LGA_DATA, YEARS, LATEST_YEAR,
  getStateData, getYearData, totalOffences, ratePer100k, getNationalTotals,
} from '../src/data';

describe('STATES', () => {
  it('has 8 states/territories', () => {
    expect(STATES).toHaveLength(8);
  });

  it('includes all Australian states', () => {
    expect(STATES).toContain('NSW');
    expect(STATES).toContain('VIC');
    expect(STATES).toContain('QLD');
    expect(STATES).toContain('WA');
    expect(STATES).toContain('SA');
    expect(STATES).toContain('TAS');
    expect(STATES).toContain('ACT');
    expect(STATES).toContain('NT');
  });

  it('all states have names', () => {
    for (const s of STATES) {
      expect(STATE_NAMES[s]).toBeTruthy();
    }
  });

  it('all states have colors', () => {
    for (const s of STATES) {
      expect(STATE_COLORS[s]).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});

describe('CATEGORIES', () => {
  it('has 12 offence categories', () => {
    expect(CATEGORIES).toHaveLength(12);
  });

  it('each category has required fields', () => {
    for (const c of CATEGORIES) {
      expect(c.id).toBeTruthy();
      expect(c.label).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('CATEGORY_IDS matches CATEGORIES', () => {
    expect(CATEGORY_IDS).toHaveLength(CATEGORIES.length);
    for (const cat of CATEGORIES) {
      expect(CATEGORY_IDS).toContain(cat.id);
    }
  });
});

describe('NATIONAL_DATA', () => {
  it('has 88 records (8 states × 11 years)', () => {
    expect(NATIONAL_DATA).toHaveLength(88);
  });

  it('each record has required fields', () => {
    for (const r of NATIONAL_DATA) {
      expect(STATES).toContain(r.state);
      expect(r.year).toBeGreaterThanOrEqual(2014);
      expect(r.year).toBeLessThanOrEqual(2024);
      expect(r.population).toBeGreaterThan(0);
      expect(typeof r.offences).toBe('object');
    }
  });

  it('offence counts are non-negative', () => {
    for (const r of NATIONAL_DATA) {
      for (const cat of CATEGORY_IDS) {
        expect(r.offences[cat]).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('populations are in a realistic range', () => {
    for (const r of NATIONAL_DATA) {
      expect(r.population).toBeGreaterThan(200000); // NT is smallest
      expect(r.population).toBeLessThan(10000000);  // NSW is largest
    }
  });
});

describe('getStateData', () => {
  it('returns 11 records for each state', () => {
    for (const s of STATES) {
      expect(getStateData(s)).toHaveLength(11);
    }
  });

  it('returns records in year order', () => {
    const nsw = getStateData('NSW');
    for (let i = 1; i < nsw.length; i++) {
      expect(nsw[i].year).toBeGreaterThan(nsw[i - 1].year);
    }
  });
});

describe('getYearData', () => {
  it('returns 8 records for each year', () => {
    for (const y of YEARS) {
      expect(getYearData(y)).toHaveLength(8);
    }
  });

  it('returns empty for non-existent year', () => {
    expect(getYearData(1900)).toHaveLength(0);
  });
});

describe('totalOffences', () => {
  it('sums all offence categories', () => {
    const record = NATIONAL_DATA[0];
    const total = totalOffences(record);
    const manual = Object.values(record.offences).reduce((s, v) => s + v, 0);
    expect(total).toBe(manual);
  });

  it('returns positive values', () => {
    for (const r of NATIONAL_DATA) {
      expect(totalOffences(r)).toBeGreaterThan(0);
    }
  });
});

describe('ratePer100k', () => {
  it('computes correct rate', () => {
    expect(ratePer100k(500, 100000)).toBe(500);
    expect(ratePer100k(250, 50000)).toBe(500);
  });

  it('handles zero population', () => {
    expect(ratePer100k(100, 0)).toBe(0);
  });

  it('handles zero count', () => {
    expect(ratePer100k(0, 100000)).toBe(0);
  });
});

describe('getNationalTotals', () => {
  it('returns population and offence totals', () => {
    const totals = getNationalTotals(LATEST_YEAR);
    expect(totals.population).toBeGreaterThan(20000000);
    expect(Object.keys(totals.offences)).toHaveLength(CATEGORY_IDS.length);
  });

  it('national total equals sum of state data', () => {
    const totals = getNationalTotals(LATEST_YEAR);
    const stateData = getYearData(LATEST_YEAR);
    const sumPop = stateData.reduce((s, r) => s + r.population, 0);
    expect(totals.population).toBe(sumPop);
  });
});

describe('NSW_LGA_DATA', () => {
  it('has at least 10 LGAs', () => {
    expect(NSW_LGA_DATA.length).toBeGreaterThanOrEqual(10);
  });

  it('each LGA has required fields', () => {
    for (const lga of NSW_LGA_DATA) {
      expect(lga.lga).toBeTruthy();
      expect(lga.state).toBe('NSW');
      expect(lga.population).toBeGreaterThan(0);
      expect(lga.year).toBe(2024);
    }
  });

  it('LGA offence counts are non-negative', () => {
    for (const lga of NSW_LGA_DATA) {
      for (const val of Object.values(lga.offences)) {
        expect(val).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
