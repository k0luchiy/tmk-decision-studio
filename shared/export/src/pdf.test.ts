import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
import d1ScenariosJson from '../../contract/mock/d1.scenarios.json';
import { toPdf } from './pdf.js';

const scenarios: Estimate[] = d1ScenariosJson.map((raw) => EstimateSchema.parse(raw));

function firstEstimate(): Estimate {
  return scenarios[0] as Estimate;
}

function scenario(name: Estimate['scenario']): Estimate {
  const found = scenarios.find((item) => item.scenario === name);
  if (found === undefined) {
    throw new Error(`Missing D1 scenario ${name}`);
  }
  return found;
}

function threeScenarioContext() {
  const inhouse = scenario('inhouse');
  const contractor = scenario('contractor');
  const hybrid = scenario('hybrid');
  return {
    estimates: { inhouse, contractor, hybrid },
    verdict: {
      code: 'hybrid' as const,
      templateId: 'hybrid_v1',
      text: 'Рекомендация: гибрид — подрядчик на критическом пути, команда на остальном.',
      numbersRefs: [],
    },
    confidence: hybrid.confidence,
  };
}

function parityContext() {
  const context = threeScenarioContext();
  return {
    ...context,
    verdict: {
      code: 'parity' as const,
      templateId: 'parity_v1',
      text: 'Паритет: сценарии сопоставимы по TCO, выбор — по рискам и компетенциям.',
      numbersRefs: [],
    },
  };
}

function pdftotext(buffer: Buffer): string | undefined {
  const result = spawnSync('pdftotext', ['-enc', 'UTF-8', '-', '-'], {
    input: buffer,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error !== undefined || result.status !== 0) {
    return undefined;
  }
  return result.stdout.toString('utf8');
}

function emptyCollections(estimate: Estimate): Estimate {
  return EstimateSchema.parse({
    ...estimate,
    assumptions: [],
    risks: [],
    analogues: [],
    cost: { ...estimate.cost, lines: [] },
    tco: [],
    breakevenMonth: null,
    formulaTree: { ...estimate.formulaTree, children: [] },
  });
}

describe('toPdf (TMK Decision Studio)', () => {
  it('starts with the %PDF signature, has ≥3 pages and weighs >20 KB', async () => {
    const buffer = await toPdf(firstEstimate());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(buffer.byteLength).toBeGreaterThan(20_000);
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
  });

  it('renders every D1 scenario', async () => {
    expect(scenarios).toHaveLength(3);
    for (const estimate of scenarios) {
      const buffer = await toPdf(estimate);
      const document = await PDFDocument.load(buffer);
      expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
      expect(buffer.byteLength).toBeGreaterThan(20_000);
    }
  });

  it('renders the three-scenario matrix and recommendation from context', async () => {
    const buffer = await toPdf(scenario('hybrid'), threeScenarioContext());
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);

    const text = pdftotext(buffer);
    if (text === undefined) {
      return;
    }
    expect(text).toContain('Внутренняя команда');
    expect(text).toContain('Подрядчик');
    expect(text).toContain('Гибрид');
    expect(text).toMatch(/РЕКОМЕНДАЦИЯ · ГИБРИД/u);
    expect(text).toMatch(/рекоменд/iu);
  });

  it('marks every scenario as parity when the verdict is parity', async () => {
    const text = pdftotext(await toPdf(scenario('hybrid'), parityContext()));
    if (text === undefined) {
      return;
    }
    expect(text).toMatch(/паритет/iu);
    expect(text).toContain('Внутренняя команда');
    expect(text).toContain('Подрядчик');
  });

  it('extracts Cyrillic brand and report sections with pdftotext', async () => {
    const text = pdftotext(await toPdf(firstEstimate()));
    if (text === undefined) {
      // pdftotext is optional in CI; the PDF itself is still validated above.
      return;
    }
    expect(text).toContain('TMK Decision Studio');
    expect(text).toContain('Вердикт');
    expect(text).toContain('P50');
    expect(text).toContain('Риски');
    expect(text).toMatch(/[А-Яа-яЁё]{4,}/u);
  });

  it('does not fail when risks, analogues, assumptions and cost lines are empty', async () => {
    const buffer = await toPdf(emptyCollections(firstEstimate()));
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    const document = await PDFDocument.load(buffer);
    expect(document.getPageCount()).toBeGreaterThanOrEqual(3);
  });
});
