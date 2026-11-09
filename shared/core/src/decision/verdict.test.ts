import { describe, expect, it } from 'vitest';
import { formatMoneyMln, formatMonth, formatWeeks } from './templates.js';
import type { VerdictInput } from './verdict.js';
import { buildVerdict } from './verdict.js';

/** Extracts number-like tokens: `6`, `6,2`, `14`, etc. */
function numberTokens(text: string): string[] {
  return text.match(/\d+[.,]?\d*/g) ?? [];
}

/**
 * Every formatted number the input can produce, itself reduced to the same
 * tokens the guard extracts from the verdict text. `М6` becomes the token `6`,
 * mirroring the extraction from the final sentence.
 */
function allowedTokens(input: VerdictInput): Set<string> {
  const allowed = new Set<string>();
  const scenarios = [input.inhouse, input.contractor, input.hybrid];
  for (const scenario of scenarios) {
    const formatted = [
      formatMoneyMln(scenario.p50Rub),
      formatMoneyMln(scenario.tcoRub),
      formatWeeks(scenario.weeks),
      formatMonth(scenario.breakevenMonth),
    ];
    for (const value of formatted) {
      for (const token of numberTokens(value)) {
        allowed.add(token);
      }
    }
  }
  return allowed;
}

/** TCO gap (250k) is inside the risk band (1M): qualitative axes decide. */
const parityInput: VerdictInput = {
  inhouse: {
    p50Rub: 5_000_000,
    p80Rub: 6_000_000,
    tcoRub: 6_180_000,
    weeks: 14,
    breakevenMonth: null,
  },
  contractor: {
    p50Rub: 5_100_000,
    p80Rub: 6_100_000,
    tcoRub: 6_430_000,
    weeks: 11,
    breakevenMonth: 6,
  },
  hybrid: {
    p50Rub: 5_050_000,
    p80Rub: 5_950_000,
    tcoRub: 6_030_000,
    weeks: 12,
    breakevenMonth: 4,
  },
};

/** Contractor cheaper up front, dearer on the horizon; hybrid not close enough. */
const conditionalInput: VerdictInput = {
  inhouse: {
    p50Rub: 6_000_000,
    p80Rub: 6_100_000,
    tcoRub: 6_180_000,
    weeks: 14,
    breakevenMonth: null,
  },
  contractor: {
    p50Rub: 4_000_000,
    p80Rub: 4_100_000,
    tcoRub: 6_430_000,
    weeks: 13,
    breakevenMonth: 6,
  },
  hybrid: {
    p50Rub: 5_000_000,
    p80Rub: 5_100_000,
    tcoRub: 7_000_000,
    weeks: 12,
    breakevenMonth: 3,
  },
};

/** Hybrid within 5 % of the cheapest and faster via the contractor. */
const hybridInput: VerdictInput = {
  inhouse: {
    p50Rub: 6_000_000,
    p80Rub: 6_050_000,
    tcoRub: 6_180_000,
    weeks: 14,
    breakevenMonth: null,
  },
  contractor: {
    p50Rub: 6_100_000,
    p80Rub: 6_150_000,
    tcoRub: 6_430_000,
    weeks: 11,
    breakevenMonth: 6,
  },
  hybrid: {
    p50Rub: 5_000_000,
    p80Rub: 5_050_000,
    tcoRub: 6_030_000,
    weeks: 12,
    breakevenMonth: 4,
  },
};

/** Contractor clearly cheaper on TCO; no conditional or hybrid case. */
const contractorWinnerInput: VerdictInput = {
  inhouse: {
    p50Rub: 5_000_000,
    p80Rub: 5_050_000,
    tcoRub: 6_180_000,
    weeks: 14,
    breakevenMonth: null,
  },
  contractor: {
    p50Rub: 4_000_000,
    p80Rub: 4_050_000,
    tcoRub: 5_000_000,
    weeks: 13,
    breakevenMonth: 0,
  },
  hybrid: {
    p50Rub: 5_000_000,
    p80Rub: 5_050_000,
    tcoRub: 9_000_000,
    weeks: 12,
    breakevenMonth: 30,
  },
};

/** In-house clearly cheaper on TCO; contractor is not cheaper up front. */
const inhouseWinnerInput: VerdictInput = {
  inhouse: {
    p50Rub: 5_000_000,
    p80Rub: 5_050_000,
    tcoRub: 5_000_000,
    weeks: 14,
    breakevenMonth: null,
  },
  contractor: {
    p50Rub: 5_500_000,
    p80Rub: 5_550_000,
    tcoRub: 6_180_000,
    weeks: 13,
    breakevenMonth: null,
  },
  hybrid: {
    p50Rub: 5_200_000,
    p80Rub: 5_250_000,
    tcoRub: 9_000_000,
    weeks: 12,
    breakevenMonth: null,
  },
};

const allInputs = [
  parityInput,
  conditionalInput,
  hybridInput,
  contractorWinnerInput,
  inhouseWinnerInput,
];

describe('formatting helpers', () => {
  it('formats money as millions with one decimal and a comma', () => {
    expect(formatMoneyMln(6_180_000)).toBe('6,2');
    expect(formatMoneyMln(6_030_000)).toBe('6,0');
  });

  it('formats weeks as whole numbers', () => {
    expect(formatWeeks(14)).toBe('14');
    expect(formatWeeks(11.6)).toBe('12');
  });

  it('formats a month as М<n> and handles null', () => {
    expect(formatMonth(6)).toBe('М6');
    expect(formatMonth(null)).toBe('не достигается');
  });
});

describe('buildVerdict', () => {
  it('returns parity when the TCO gap is within the risk band', () => {
    const verdict = buildVerdict(parityInput);

    expect(verdict.code).toBe('parity');
    expect(verdict.templateId).toBe('parity_v1');
    expect(verdict.text).toContain('Паритет');
    expect(verdict.numbersRefs).toEqual(['inhouse.tco', 'contractor.tco']);
  });

  it('returns conditional in-house when cheaper up front but dearer on the horizon', () => {
    const verdict = buildVerdict(conditionalInput);

    expect(verdict.code).toBe('inhouse');
    expect(verdict.templateId).toBe('conditional_v1');
    expect(verdict.text).toContain('дешевле');
    expect(verdict.text).toContain('М6');
    expect(verdict.numbersRefs).toContain('breakeven');
    expect(verdict.numbersRefs).toContain('contractor.p50');
  });

  it('returns hybrid when it is within 5 % of the cheapest and faster', () => {
    const verdict = buildVerdict(hybridInput);

    expect(verdict.code).toBe('hybrid');
    expect(verdict.templateId).toBe('hybrid_v1');
    expect(verdict.text).toContain('гибрид');
    expect(verdict.numbersRefs).toContain('hybrid.tco');
  });

  it('falls back to the cheaper TCO (contractor)', () => {
    const verdict = buildVerdict(contractorWinnerInput);

    expect(verdict.code).toBe('contractor');
    expect(verdict.templateId).toBe('contractor_v1');
    expect(verdict.text).toContain('подрядчику');
    expect(verdict.numbersRefs).toEqual(['contractor.tco', 'inhouse.tco']);
  });

  it('falls back to the cheaper TCO (in-house)', () => {
    const verdict = buildVerdict(inhouseWinnerInput);

    expect(verdict.code).toBe('inhouse');
    expect(verdict.templateId).toBe('inhouse_v1');
    expect(verdict.text).toContain('внутри');
    expect(verdict.numbersRefs).toEqual(['inhouse.tco', 'contractor.tco']);
  });

  it('guard: every number in the verdict text comes from the formatted input', () => {
    for (const input of allInputs) {
      const verdict = buildVerdict(input);
      const allowed = allowedTokens(input);
      const tokens = numberTokens(verdict.text);

      expect(tokens.length).toBeGreaterThan(0);
      for (const token of tokens) {
        expect(allowed.has(token), `unexpected number "${token}" in "${verdict.text}"`).toBe(true);
      }
    }
  });
});
