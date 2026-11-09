import type { JevAnswer } from '@app/contract';
import { describe, expect, it } from 'vitest';
import { allConfirmed, confirmParam, mergeIntake, type MergedParam } from './merge.js';
import { classify, extract } from './rules/index.js';

const D1 = 'Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца';

function answer(
  questionId: string,
  value: JevAnswer['value'],
  probability = 0.9,
): JevAnswer {
  const type: JevAnswer['type'] =
    typeof value === 'boolean' ? 'noul' : typeof value === 'number' ? 'score' : 'choice';
  return {
    questionId,
    type,
    value,
    probability,
    model: 'jev-1.13',
    promptVersion: '1.0.0',
    stateHash: 'a'.repeat(64),
  };
}

function byKey(params: readonly MergedParam[], key: string): MergedParam[] {
  return params.filter((param) => param.key === key);
}

describe('mergeIntake', () => {
  it('merges D1 rules with Jev and keeps rule numbers', () => {
    const classification = classify(D1);
    const params = mergeIntake({
      rules: {
        params: extract(D1),
        classification: { workType: classification.workType, platform: classification.platform },
      },
      jev: [
        answer('work_type', 'integration', 0.93),
        answer('platform', '1c', 0.96),
        answer('security_kii', false, 0.88),
        answer('mobile', false, 0.9),
      ],
    });

    expect(byKey(params, 'work_type')[0]).toMatchObject({
      value: 'integration',
      source: 'rules',
      status: 'auto',
    });
    expect(byKey(params, 'platform')[0]).toMatchObject({ value: '1c', source: 'rules' });
    expect(byKey(params, 'flows')[0]).toMatchObject({ value: 6, source: 'rules' });
    expect(byKey(params, 'duration')[0]).toMatchObject({ value: 3, source: 'rules' });
    expect(byKey(params, 'security_kii')[0]?.value).toBe(false);
  });

  it('Jev fills work type and platform when rules say unknown', () => {
    const params = mergeIntake({
      rules: { params: [], classification: { workType: 'unknown', platform: 'unknown' } },
      jev: [answer('work_type', 'migration', 0.82), answer('platform', 'sap', 0.77)],
    });

    expect(byKey(params, 'work_type')[0]).toMatchObject({
      value: 'migration',
      source: 'jev',
      probability: 0.82,
    });
    expect(byKey(params, 'platform')[0]).toMatchObject({
      value: 'sap',
      source: 'jev',
      probability: 0.77,
    });
  });

  it('disagreement produces two auto rows in the same conflict group', () => {
    const params = mergeIntake({
      rules: {
        params: [],
        classification: { workType: 'integration', platform: '1c' },
      },
      jev: [answer('work_type', 'erp', 0.8), answer('platform', 'sap', 0.7)],
    });

    const workTypes = byKey(params, 'work_type');
    expect(workTypes).toHaveLength(2);
    expect(workTypes.map((param) => param.value)).toEqual(['integration', 'erp']);
    expect(workTypes[0]?.conflictGroup).toBe('work_type');
    expect(workTypes[1]?.conflictGroup).toBe('work_type');
    expect(workTypes.every((param) => param.status === 'auto')).toBe(true);

    const platforms = byKey(params, 'platform');
    expect(platforms).toHaveLength(2);
    expect(platforms.every((param) => param.conflictGroup === 'platform')).toBe(true);
  });

  it('does not let Jev overwrite a numeric rule parameter', () => {
    const params = mergeIntake({
      rules: {
        params: extract(D1),
        classification: { workType: 'integration', platform: '1c' },
      },
      jev: [answer('flows', 99, 0.99), answer('integrations_scale', '11+', 0.6)],
    });

    const flows = byKey(params, 'flows');
    expect(flows).toHaveLength(1);
    expect(flows[0]?.value).toBe(6);
    expect(flows[0]?.source).toBe('rules');
    // The range hint lives under its own key and never replaces the number.
    expect(byKey(params, 'integrations_scale')[0]?.value).toBe('11+');
  });
});

describe('confirmParam / allConfirmed', () => {
  const conflicted = mergeIntake({
    rules: { params: [], classification: { workType: 'integration', platform: '1c' } },
    jev: [answer('work_type', 'erp', 0.8)],
  });

  it('confirms the chosen value and rejects the other side of the conflict', () => {
    const confirmed = confirmParam(conflicted, 'work_type', 'integration');
    const rows = byKey(confirmed, 'work_type');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      value: 'integration',
      status: 'confirmed',
      conflictGroup: undefined,
    });
    expect(rows[1]).toMatchObject({ value: 'erp', status: 'rejected', conflictGroup: undefined });
    expect(allConfirmed(confirmed)).toBe(false);
  });

  it('allConfirmed is true once every parameter is confirmed', () => {
    let params: MergedParam[] = mergeIntake({
      rules: { params: [], classification: { workType: 'integration', platform: '1c' } },
      jev: [],
    });
    params = confirmParam(params, 'work_type', 'integration');
    params = confirmParam(params, 'platform', '1c');

    expect(allConfirmed(params)).toBe(true);
  });
});
