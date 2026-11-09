import { beforeAll, describe, expect, it } from 'vitest';
import { loadDatasets } from '@app/data';
import type { ContractorBand } from '@app/data';
import {
  MissingBandError,
  UnsupportedGeoError,
  costContractor,
} from './contractor.js';

let bands: ContractorBand[];
let oneCMiddleRate: number;

beforeAll(async () => {
  const datasets = await loadDatasets();
  bands = datasets.contractorRates.bands;
  const band = bands.find(
    (candidate) =>
      candidate.geo === 'RU' &&
      candidate.role_id === '1c_developer' &&
      candidate.grade === 'middle',
  );
  if (!band) {
    throw new Error('RU 1c_developer/middle is missing from contractor_rate_cards.json');
  }
  oneCMiddleRate = band.rate_mid;
});

describe('costContractor', () => {
  it('D1: prices 930 h of RU 1C middle at rate_mid and marks it fact', () => {
    const lines = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
    });

    const labor = lines.filter((line) => line.group === 'labor');
    expect(labor).toHaveLength(1);

    const [line] = labor;
    expect(line?.id).toBe('labor:1c_developer:middle');
    expect(line?.valueRub).toBe(930 * oneCMiddleRate);
    expect(line?.status).toBe('fact');
    expect(line?.sourceId).toMatch(/^contractor_rate_cards:.+/);
    expect(line?.inputRefs).toContain(line?.sourceId);
  });

  it('T&M: coordination and acceptance add up, no risk premium', () => {
    const lines = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
      opts: { model: 't_and_m' },
    });

    const labor = 930 * oneCMiddleRate;
    const coordination = lines.find((item) => item.id === 'coordination');
    const acceptance = lines.find((item) => item.id === 'acceptance');

    expect(coordination?.valueRub).toBeCloseTo(labor * 0.15, 6);
    expect(acceptance?.valueRub).toBeCloseTo(labor * 0.05, 6);
    expect(coordination?.group).toBe('coordination');
    expect(acceptance?.group).toBe('coordination');
    expect(coordination?.status).toBe('assumption');
    expect(lines.some((item) => item.group === 'risk')).toBe(false);
    expect(lines.some((item) => item.group === 'vat')).toBe(false);
  });

  it('fixed_price adds a 20 % risk premium', () => {
    const tm = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
      opts: { model: 't_and_m' },
    });
    const fixed = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
      opts: { model: 'fixed_price' },
    });

    const labor = 930 * oneCMiddleRate;
    const risk = fixed.find((line) => line.group === 'risk');
    expect(risk).toBeDefined();
    expect(risk?.valueRub).toBeCloseTo(labor * 0.2, 6);
    expect(fixed.some((line) => line.group === 'risk')).toBe(true);
    expect(tm.some((line) => line.group === 'risk')).toBe(false);

    const tmTotal = tm.reduce((sum, line) => sum + line.valueRub, 0);
    const fixedTotal = fixed.reduce((sum, line) => sum + line.valueRub, 0);
    expect(fixedTotal).toBeGreaterThan(tmTotal);
  });

  it('vat=true adds a 20 % VAT line on labour plus overheads', () => {
    const withoutVat = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
      opts: { model: 'fixed_price', vat: false },
    });
    const withVat = costContractor({
      effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 930 }],
      bands,
      opts: { model: 'fixed_price', vat: true },
    });

    const base = withoutVat.reduce((sum, line) => sum + line.valueRub, 0);
    const vat = withVat.find((line) => line.group === 'vat');
    expect(vat).toBeDefined();
    expect(vat?.valueRub).toBeCloseTo(base * 0.2, 6);

    const total = withVat.reduce((sum, line) => sum + line.valueRub, 0);
    expect(total).toBeCloseTo(base * 1.2, 6);
  });

  it('raises MissingBandError with role, grade and geo', () => {
    let caught: unknown;
    try {
      costContractor({
        effortByRole: [{ roleId: 'no_such_role', grade: 'middle', hours: 10 }],
        bands,
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(MissingBandError);
    const error = caught as MissingBandError;
    expect(error.code).toBe('MISSING_BAND');
    expect(error.roleId).toBe('no_such_role');
    expect(error.grade).toBe('middle');
    expect(error.geo).toBe('RU');
  });

  it('rejects non-RU geo without converting currency', () => {
    let caught: unknown;
    try {
      costContractor({
        effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 10 }],
        bands,
        opts: { geo: 'KZ' },
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(UnsupportedGeoError);
    const error = caught as UnsupportedGeoError;
    expect(error.code).toBe('UNSUPPORTED_GEO');
    expect(error.geo).toBe('KZ');
  });

  it('rejects negative hours and invalid percentages with RangeError', () => {
    expect(() =>
      costContractor({
        effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: -1 }],
        bands,
      }),
    ).toThrow(RangeError);

    expect(() =>
      costContractor({
        effortByRole: [{ roleId: '1c_developer', grade: 'middle', hours: 10 }],
        bands,
        opts: { coordinationPct: -0.1 },
      }),
    ).toThrow(RangeError);
  });
});
