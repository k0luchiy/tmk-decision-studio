import { describe, expect, it } from 'vitest';
import type { CostLine, FormulaNode } from '@app/contract';
import type { ProvenanceFormulaNode } from './formulaTree.js';
import { buildFormulaTree, leaves, walk } from './formulaTree.js';

/** D1-like cost lines: two sourced labour rows, two assumptions, one offer. */
const costLines: CostLine[] = [
  {
    id: 'labor:analyst',
    group: 'labor',
    label: 'Аналитик',
    formula: '100 h × 5000 ₽/ч',
    inputRefs: ['rate:analyst'],
    valueRub: 500_000,
    sourceId: 'rate:analyst',
    status: 'fact',
  },
  {
    id: 'labor:developer',
    group: 'labor',
    label: 'Разработчик',
    formula: '200 h × 4000 ₽/ч',
    inputRefs: ['rate:developer'],
    valueRub: 800_000,
    sourceId: 'rate:developer',
    status: 'fact',
  },
  {
    id: 'coordination',
    group: 'coordination',
    label: 'Координация (15 %)',
    formula: '1300000 ₽ × 0.15',
    inputRefs: [],
    valueRub: 195_000,
    status: 'assumption',
  },
  {
    id: 'risk:premium',
    group: 'risk',
    label: 'Риск-премия (15 %)',
    formula: '1300000 ₽ × 0.15',
    inputRefs: [],
    valueRub: 195_000,
    status: 'assumption',
  },
  {
    id: 'extra:cloud',
    group: 'extra',
    label: 'Облачный стенд',
    formula: '3 мес × 20000 ₽',
    inputRefs: ['offer:cloud'],
    valueRub: 60_000,
    sourceId: 'offer:cloud',
    status: 'offer',
  },
];

const input = {
  estimateId: 'd1',
  costLines,
  effortHours: { p50: 770, p80: 835 },
};

/** Maximum root-to-leaf depth (root counts as 1). */
function treeDepth(node: FormulaNode): number {
  const children = node.children ?? [];
  if (children.length === 0) {
    return 1;
  }
  return 1 + Math.max(...children.map(treeDepth));
}

describe('buildFormulaTree', () => {
  it('returns a cost_p50 root whose value equals the sum of the lines', () => {
    const tree = buildFormulaTree(input);
    const expected = costLines.reduce((sum, line) => sum + line.valueRub, 0);

    expect(tree.id).toBe('cost_p50');
    expect(tree.kind).toBe('total');
    expect(tree.valueRub).toBe(expected);
  });

  it('is at least three levels deep (total → group → line)', () => {
    expect(treeDepth(buildFormulaTree(input))).toBeGreaterThanOrEqual(3);
  });

  it('has costLines.length + 2 leaves (lines plus effort and reserve)', () => {
    expect(leaves(buildFormulaTree(input))).toHaveLength(costLines.length + 2);
  });

  it('gives every leaf a sourceId or an explicit assumption marker', () => {
    const leafNodes = leaves(buildFormulaTree(input)) as ProvenanceFormulaNode[];

    for (const leaf of leafNodes) {
      const marked =
        leaf.sourceId !== undefined || /допущен|assumption/i.test(leaf.formula ?? '');
      expect(marked, `leaf ${leaf.id} lacks provenance`).toBe(true);
    }
  });

  it('carries sourceId through to sourced line leaves', () => {
    const leafNodes = leaves(buildFormulaTree(input)) as ProvenanceFormulaNode[];
    const analyst = leafNodes.find((leaf) => leaf.id === 'labor:analyst');

    expect(analyst?.sourceId).toBe('rate:analyst');
    expect(analyst?.inputs).toContain('rate:analyst');
  });

  it('marks assumption lines with an explicit assumption note', () => {
    const leafNodes = leaves(buildFormulaTree(input)) as ProvenanceFormulaNode[];
    const coordination = leafNodes.find((leaf) => leaf.id === 'coordination');

    expect(coordination?.sourceId).toBeUndefined();
    expect(coordination?.formula).toMatch(/допущен/i);
  });
});

describe('walk', () => {
  it('visits every node in pre-order', () => {
    const tree = buildFormulaTree(input);
    const nodes = walk(tree);

    // 1 root + 2 hour leaves + 4 non-empty groups + 5 lines.
    expect(nodes).toHaveLength(12);
    expect(nodes[0]).toBe(tree);
    expect(nodes.map((node) => node.id)).toEqual([
      'cost_p50',
      'effort',
      'reserve',
      'group:labor',
      'labor:analyst',
      'labor:developer',
      'group:coordination',
      'coordination',
      'group:risk',
      'risk:premium',
      'group:extra',
      'extra:cloud',
    ]);
  });
});
