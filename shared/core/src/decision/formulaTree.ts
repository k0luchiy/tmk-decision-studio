/**
 * Formula tree (`docs/03_estimation_model.md` §4, §10; contour 1 in §13).
 *
 * The tree decomposes the P50 cost into auditable leaves: every cost line keeps
 * its formula, inputs and — whenever it has one — its source. Lines that are
 * planning assumptions (no source) are explicitly marked in their formula, so
 * the tree never presents an assumption as fact.
 *
 * Shape:
 *
 * ```
 * cost_p50 (total)
 * ├── effort (hours: p50)
 * ├── reserve (hours: p80 − p50)
 * └── group:<name> (group)
 *     └── <cost line> (line)
 * ```
 */

import type { CostLine, FormulaNode } from '@app/contract';

/** Input of {@link buildFormulaTree}. */
export interface FormulaTreeInput {
  /** Estimate id; used as the provenance anchor for synthetic hour nodes. */
  estimateId: string;
  /** Cost lines that make up the P50 total. */
  costLines: CostLine[];
  /** Effort quantiles in person-hours. */
  effortHours: { p50: number; p80: number };
}

/**
 * A {@link FormulaNode} that may carry a `sourceId` directly.
 *
 * The contract type has no `sourceId` field, so provenance is attached as an
 * additive property without touching the schema. It is also mirrored in
 * `inputs` so schema-parsed consumers keep the reference.
 */
export type ProvenanceFormulaNode = FormulaNode & { sourceId?: string };

/** Display order and labels of cost-line groups. */
const GROUP_ORDER = [
  'labor',
  'overhead',
  'coordination',
  'risk',
  'vat',
  'extra',
  'hiring',
  'rampup',
  'bench',
  'turnover',
  'support',
] as const;

type GroupKey = (typeof GROUP_ORDER)[number];

const GROUP_LABELS: Record<GroupKey, string> = {
  labor: 'Труд',
  overhead: 'Накладные',
  coordination: 'Координация',
  risk: 'Риски',
  vat: 'НДС',
  extra: 'Дополнительные статьи',
  hiring: 'Найм',
  rampup: 'Ramp-up',
  bench: 'Bench',
  turnover: 'Текучесть',
  support: 'Поддержка',
};

/** Recognises an assumption marker in either Russian or English. */
const ASSUMPTION_PATTERN = /допущен|assumption/i;

/** Formats a number without floating-point noise and without grouping. */
function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(6)));
}

/** Builds the leaf for a single cost line, marking assumptions explicitly. */
function buildLineNode(line: CostLine): ProvenanceFormulaNode {
  const inlineMarked = ASSUMPTION_PATTERN.test(line.formula);
  const formula =
    line.sourceId === undefined && !inlineMarked ? `${line.formula} [допущение]` : line.formula;

  const node: ProvenanceFormulaNode = {
    id: line.id,
    label: line.label,
    kind: 'line',
    valueRub: line.valueRub,
    formula,
    inputs: line.inputRefs,
  };

  if (line.sourceId !== undefined) {
    node.sourceId = line.sourceId;
    if (!node.inputs.includes(line.sourceId)) {
      node.inputs = [...node.inputs, line.sourceId];
    }
  }

  return node;
}

/** Builds a group node from its cost lines, or `undefined` when empty. */
function buildGroupNode(group: GroupKey, lines: CostLine[]): ProvenanceFormulaNode | undefined {
  if (lines.length === 0) {
    return undefined;
  }

  const valueRub = lines.reduce((sum, line) => sum + line.valueRub, 0);

  return {
    id: `group:${group}`,
    label: GROUP_LABELS[group],
    kind: 'group',
    valueRub,
    formula: `Σ ${lines.length}`,
    inputs: [],
    children: lines.map(buildLineNode),
  };
}

/**
 * Builds the P50 formula tree from cost lines and effort quantiles.
 *
 * The root value equals the sum of the cost lines; the two hour nodes (P50
 * effort and the P80 − P50 reserve) are leaves too, so the tree has
 * `costLines.length + 2` leaves and at least three levels
 * (`total → group → line`).
 */
export function buildFormulaTree(input: FormulaTreeInput): FormulaNode {
  const { estimateId, costLines, effortHours } = input;

  const totalRub = costLines.reduce((sum, line) => sum + line.valueRub, 0);

  const effort: ProvenanceFormulaNode = {
    id: 'effort',
    label: 'Трудоёмкость P50',
    kind: 'hours',
    formula: `${formatNumber(effortHours.p50)} h`,
    inputs: [estimateId],
    sourceId: estimateId,
  };

  const reserve: ProvenanceFormulaNode = {
    id: 'reserve',
    label: 'Резерв P80 − P50',
    kind: 'hours',
    formula: `${formatNumber(effortHours.p80)} h − ${formatNumber(effortHours.p50)} h`,
    inputs: [estimateId],
    sourceId: estimateId,
  };

  const grouped = new Map<GroupKey, CostLine[]>();
  for (const line of costLines) {
    const bucket = grouped.get(line.group);
    if (bucket === undefined) {
      grouped.set(line.group, [line]);
    } else {
      bucket.push(line);
    }
  }

  const groups: ProvenanceFormulaNode[] = [];
  for (const group of GROUP_ORDER) {
    const node = buildGroupNode(group, grouped.get(group) ?? []);
    if (node !== undefined) {
      groups.push(node);
    }
  }

  return {
    id: 'cost_p50',
    label: 'Стоимость P50',
    kind: 'total',
    valueRub: totalRub,
    formula: `${formatNumber(totalRub)} ₽`,
    inputs: [],
    children: [effort, reserve, ...groups],
  };
}

/** Visits the tree in pre-order (node before its children). */
export function walk(tree: FormulaNode): FormulaNode[] {
  const result: FormulaNode[] = [];

  const visit = (node: FormulaNode): void => {
    result.push(node);
    for (const child of node.children ?? []) {
      visit(child);
    }
  };

  visit(tree);
  return result;
}

/** Returns all leaves (nodes without children) in pre-order. */
export function leaves(tree: FormulaNode): FormulaNode[] {
  return walk(tree).filter((node) => (node.children?.length ?? 0) === 0);
}
