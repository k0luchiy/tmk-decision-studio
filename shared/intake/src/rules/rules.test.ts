import { describe, expect, it } from 'vitest';
import { classify, detectFlags, extract, extractQuantities, needsClarification } from './index.js';

const D1 =
  'Интеграция 1С:ERP с WMS, 6 интеграционных потоков, срок 3 месяца';

describe('classify', () => {
  it('D1 → integration on 1C with high confidence', () => {
    const result = classify(D1);
    expect(result.workType).toBe('integration');
    expect(result.platform).toBe('1c');
    expect(result.confidence).toBe('high');
    expect(result.matchedKeywords).toContain('интеграц');
  });

  it('non-IT text → unknown and low confidence', () => {
    const result = classify('Сделайте что-нибудь');
    expect(result.workType).toBe('unknown');
    expect(result.platform).toBe('unknown');
    expect(result.confidence).toBe('low');
  });
});

describe('extractQuantities', () => {
  it('D1 → 6 flows and 3 months, both with a quote', () => {
    const quantities = extractQuantities(D1);

    const flows = quantities.find((quantity) => quantity.key === 'flows');
    expect(flows?.value).toBe(6);
    expect(flows?.quote).toContain('6 интеграционных потоков');

    const duration = quantities.find((quantity) => quantity.key === 'duration');
    expect(duration?.value).toBe(3);
    expect(duration?.unit).toBe('мес');
    expect(duration?.quote).toContain('3 месяца');
  });

  it('spelled-out numeral «шесть потоков» → 6', () => {
    const quantities = extractQuantities('Нужно сделать шесть потоков обмена');
    const flows = quantities.find((quantity) => quantity.key === 'flows');
    expect(flows?.value).toBe(6);
  });

  it('data volumes require digits', () => {
    const quantities = extractQuantities('Объём данных 500 ГБ, сто записей');
    const volumes = quantities.filter((quantity) => quantity.key === 'data_volume');
    expect(volumes).toHaveLength(1);
    expect(volumes[0]?.value).toBe(500);
    expect(volumes[0]?.unit).toBe('ГБ');
  });
});

describe('extract', () => {
  it('marks digit parameters high and written numerals medium', () => {
    const params = extract(D1);
    const flows = params.find((param) => param.key === 'flows');
    expect(flows?.confidence).toBe('high');
    expect(flows?.source).toBe('rules');
    expect(flows?.status).toBe('auto');
    expect(flows?.quote).toContain('6');

    const spelled = extract('шесть потоков').find((param) => param.key === 'flows');
    expect(spelled?.value).toBe(6);
    expect(spelled?.confidence).toBe('medium');
  });
});

describe('needsClarification', () => {
  it('D1 is complete enough → no questions', () => {
    expect(needsClarification(D1)).toHaveLength(0);
  });

  it('vague brief → at least two concrete questions', () => {
    const questions = needsClarification('Сделайте что-нибудь');
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.some((question) => question.includes('тип'))).toBe(true);
    expect(questions.some((question) => question.includes('срок'))).toBe(true);
  });

  it('empty brief → asks for type, volume and deadline', () => {
    expect(needsClarification('')).toHaveLength(3);
  });
});

describe('detectFlags', () => {
  it('detects КИИ / 187-ФЗ and mobile iOS', () => {
    const flags = detectFlags('КИИ 187-ФЗ, мобильное приложение iOS');
    expect(flags.securityKii).toBe(true);
    expect(flags.mobile).toBe(true);
  });

  it('detects 24/7 support, migration and import substitution', () => {
    const flags = detectFlags(
      'Миграция на отечественное ПО, поддержка 24/7 после запуска',
    );
    expect(flags.migration).toBe(true);
    expect(flags.support24x7).toBe(true);
    expect(flags.importSubstitution).toBe(true);
    expect(flags.securityKii).toBe(false);
  });

  it('does not match ИБ inside «библиотека»', () => {
    expect(detectFlags('Обновить библиотеку компонентов').securityKii).toBe(false);
  });
});
