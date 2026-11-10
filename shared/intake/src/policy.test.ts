import { describe, expect, it } from 'vitest';
import { applyIntakePolicy, policyForParam, type PolicyParam } from './policy.js';
import type { MergedParam } from './merge.js';

function param(overrides: Partial<MergedParam> & Pick<MergedParam, 'key' | 'value'>): MergedParam {
  return {
    unit: '',
    confidence: 0.9,
    status: 'auto',
    defaultUsed: false,
    source: 'jev',
    ...overrides,
  };
}

function byKey(params: readonly PolicyParam[], key: string): PolicyParam | undefined {
  return params.find((item) => item.key === key);
}

describe('intake policy', () => {
  it('auto-accepts high-confidence classification fields', () => {
    const rows = applyIntakePolicy([
      param({ key: 'work_type', value: 'integration', probability: 0.92 }),
      param({ key: 'platform', value: '1c', probability: 0.8 }),
    ]);

    expect(byKey(rows, 'work_type')).toMatchObject({ policy: 'auto', autoAccept: true });
    expect(byKey(rows, 'platform')).toMatchObject({ policy: 'auto', autoAccept: true });
  });

  it('keeps stage ownership as a suggestion', () => {
    const rows = applyIntakePolicy([
      param({ key: 'stage_owner_development', value: 'vendor', probability: 0.99 }),
    ]);

    expect(byKey(rows, 'stage_owner_development')).toMatchObject({
      policy: 'suggest',
      autoAccept: false,
      suggested: true,
    });
  });

  it('never auto-accepts numbers or commercial settings', () => {
    const rows = applyIntakePolicy([
      param({ key: 'flows', value: 6, confidence: 1, source: 'rules' }),
      param({ key: 'reserve', value: 0.15, confidence: 1, source: 'rules' }),
    ]);

    expect(byKey(rows, 'flows')).toMatchObject({ policy: 'manual', autoAccept: false });
    expect(byKey(rows, 'reserve')).toMatchObject({ policy: 'manual', autoAccept: false });
  });

  it('does not auto-accept a conflict or a low probability', () => {
    const rows = applyIntakePolicy([
      param({ key: 'work_type', value: 'support', probability: 0.95, conflictGroup: 'work_type' }),
      param({ key: 'platform', value: 'web', probability: 0.5 }),
    ]);

    expect(byKey(rows, 'work_type')?.autoAccept).toBe(false);
    expect(byKey(rows, 'platform')?.autoAccept).toBe(false);
  });

  it('maps known keys to the documented policy', () => {
    expect(policyForParam('work_type')).toBe('auto');
    expect(policyForParam('stage_owner_testing')).toBe('suggest');
    expect(policyForParam('duration_weeks')).toBe('manual');
  });
});
