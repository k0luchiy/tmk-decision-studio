/** Three-scenario comparison matrix for the branded PDF report (section 3). */

import type { Estimate, Verdict } from '@app/contract';
import { note, sectionTitle } from './components.js';
import type { PdfContext } from './context.js';
import type { Fonts } from './fonts.js';
import { table } from './tables.js';
import { costIndex, cumulativeTco, millions, num, scenarioName } from './theme.js';

/** Scenarios rendered in the comparison matrix, always in this order. */
const SCENARIO_ORDER = ['inhouse', 'contractor', 'hybrid'] as const;
type ScenarioKey = (typeof SCENARIO_ORDER)[number];

/** Human label for the verdict code, reused by the recommendation block. */
export function verdictCodeLabel(code: Verdict['code']): string {
  return code === 'parity' ? 'Паритет' : scenarioName(code);
}

function isScenarioKey(value: string): value is ScenarioKey {
  return (SCENARIO_ORDER as readonly string[]).includes(value);
}

/** Recommendation marker for one matrix row; `parity` marks every row. */
function markerFor(code: Verdict['code'], key: ScenarioKey): string {
  if (code === 'parity') {
    return 'паритет';
  }
  return code === key ? '★ рекоменд.' : '—';
}

function tcoCell(estimate: Estimate): string {
  return [1, 3, 5].map((year) => millions(cumulativeTco(estimate, year) ?? 0)).join('/');
}

function rowFor(estimate: Estimate, code: Verdict['code']): string[] {
  const marker = isScenarioKey(estimate.scenario)
    ? markerFor(code, estimate.scenario)
    : '—';
  return [
    scenarioName(estimate.scenario),
    millions(estimate.cost.p10Rub),
    millions(estimate.cost.p50Rub),
    millions(estimate.cost.p80Rub),
    millions(estimate.cost.p90Rub),
    String(estimate.duration.p50Weeks),
    tcoCell(estimate),
    num(costIndex(estimate)),
    marker,
  ];
}

const COLUMNS = [
  { header: 'Сценарий', width: 112 },
  { header: 'P10', width: 34, align: 'right' as const },
  { header: 'P50', width: 34, align: 'right' as const },
  { header: 'P80', width: 34, align: 'right' as const },
  { header: 'P90', width: 34, align: 'right' as const },
  { header: 'Срок', width: 38, align: 'right' as const },
  { header: 'TCO 1/3/5, млн', width: 86, align: 'right' as const },
  { header: '₽/час', width: 40, align: 'right' as const },
  { header: 'Маркер', width: 77 },
];

/**
 * Renders the full in-house / contractor / hybrid matrix when `context` has
 * all three estimates; otherwise falls back to the single scenario row.
 */
export function comparisonSection(
  doc: PDFKit.PDFDocument,
  fonts: Fonts,
  estimate: Estimate,
  context: PdfContext | undefined,
  y: number,
): number {
  y = sectionTitle(doc, fonts, 3, 'Сравнение сценариев', y);
  const code = context?.verdict?.code ?? estimate.verdict.code;
  const estimates = context?.estimates;
  const list: Estimate[] =
    estimates === undefined
      ? [estimate]
      : [estimates.inhouse, estimates.contractor, estimates.hybrid];

  y = table(doc, fonts, {
    y,
    columns: COLUMNS,
    rows: list.map((item) => rowFor(item, code)),
  });

  const lead =
    estimates === undefined
      ? 'В отчёт передан один сценарий.'
      : code === 'parity'
        ? 'Рекомендация движка: паритет — сценарии сопоставимы по TCO.'
        : `Рекомендация движка: ${verdictCodeLabel(code)}.`;
  return note(
    doc,
    fonts,
    `${lead} P10–P90 и TCO — млн ₽ (накопительно на 1/3/5 год); срок — недели; ₽/час — стоимость P50 за час.`,
    y,
  );
}
