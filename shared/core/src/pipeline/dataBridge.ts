/**
 * Bridges loaded datasets into the contract shapes used by the assembled
 * estimates: published analogues plus the default assumptions and risks.
 */

import type { Analogue, Assumption, Risk } from '@app/contract';
import type { Datasets } from '@app/data';
import type { ContractModel } from '../cost/contractor.js';
import {
  ANALOGUE_AGE_INDEX,
  ANALOGUE_TYPE_BY_WORK_TYPE,
  DEFAULT_TARGET_YEAR,
} from '../sizing/analogues.js';
import { supportAnaloguesFromContracts } from '../sizing/supportAnalogues.js';

function cleanScopeVector(
  raw: Record<string, unknown>,
): Record<string, number | boolean | string> {
  const result: Record<string, number | boolean | string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
      result[key] = value;
    }
  }
  return result;
}

function supportContractAnalogues(datasets: Datasets): Analogue[] {
  return supportAnaloguesFromContracts(datasets.contracts)
    .slice(0, 3)
    .map((row) => ({
      id: row.id,
      corpus: 'tmk_eis' as const,
      type: 'support',
      title: row.title,
      year: row.year,
      currency: 'RUB' as const,
      price: {
        low: row.price_mid ?? 0,
        mid: row.price_mid ?? 0,
        high: row.price_mid ?? 0,
        basis: 'contract_price',
      },
      vatFlag: false,
      scopeVector: { contract_price: true },
      normalization: {
        kScope: 1,
        kComplexity: 1,
        kRegion: 1,
        kAge: row.year <= DEFAULT_TARGET_YEAR
          ? Math.pow(ANALOGUE_AGE_INDEX, DEFAULT_TARGET_YEAR - row.year)
          : 1,
        kVat: 1,
      },
      normalizedPriceRub: row.price_mid ?? 0,
      included: true,
      sourceId: `tmk_contracts:${row.id.replace(/^tmk:/, '')}`,
      ...(typeof row.source === 'string' ? { url: row.source } : {}),
    }));
}

/** Maps corpus rows to contract analogues; only matching project types. */
export function toContractAnalogues(datasets: Datasets, workType: string): Analogue[] {
  if (workType === 'support') {
    return supportContractAnalogues(datasets);
  }

  if (workType === 'default') return [];
  const expectedType = ANALOGUE_TYPE_BY_WORK_TYPE[workType];
  if (expectedType === undefined) return [];

  return datasets.analogues.analogues
    .filter((row) => row.project_type === expectedType)
    .slice(0, 3)
    .map((row) => {
      const low = row.price_low ?? 0;
      const high = row.price_high ?? low;
      const mid = row.price_mid ?? (low + high) / 2;
      const vatFlag = row.vat_included === true;
      return {
        id: row.id,
        corpus: 'published' as const,
        type: row.project_type,
        title: row.title,
        year: row.year,
        currency: row.currency === 'USD' ? ('USD' as const) : ('RUB' as const),
        price: { low, mid, high, basis: row.price_basis },
        vatFlag,
        scopeVector: cleanScopeVector(row.scope_vector),
        normalization: {
          kScope: 1,
          kComplexity: 1,
          kRegion: 1,
          kAge: ANALOGUE_AGE_INDEX,
          kVat: 1,
        },
        ...(row.currency === 'RUB' ? { normalizedPriceRub: mid } : {}),
        included: true,
        sourceId: row.source,
      };
    });
}

export function buildAssumptions(
  utilization: number,
  hiring: boolean,
  model: ContractModel,
): Assumption[] {
  const assumptions: Assumption[] = [
    {
      id: 'utilization',
      label: 'Загрузка команды',
      value: utilization,
      range: { low: 0.65, high: 0.75 },
      sourceId: 'coefficients:productive_hours',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'support_inhouse',
      label: 'Поддержка in-house, %/год от труда',
      value: 0.12,
      range: { low: 0.1, high: 0.15 },
      sourceId: 'docs:03_estimation_model §5.3',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'support_contractor',
      label: 'Поддержка подрядчика, %/год от труда',
      value: 0.18,
      range: { low: 0.15, high: 0.2 },
      sourceId: 'docs:03_estimation_model §5.3',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'risk_reserve',
      label: 'Резерв P80 к P50',
      value: 0.18,
      range: { low: 0.15, high: 0.3 },
      sourceId: 'coefficients:contingency_policy',
      pinned: false,
      owner: 'R2',
    },
    {
      id: 'contract_model',
      label: 'Модель контракта подрядчика',
      value: model,
      range: { low: 0, high: 1 },
      sourceId: 'contractor_rate_cards:pricing_basis',
      pinned: false,
      owner: 'R2',
    },
  ];

  if (hiring) {
    assumptions.push({
      id: 'hiring',
      label: 'Найм под ключевую роль',
      value: true,
      range: { low: 1.5, high: 1.5 },
      sourceId: 'research/05 §5.3',
      pinned: false,
      owner: 'R2',
    });
  }

  return assumptions;
}

export function buildRisks(implementationRub: number): Risk[] {
  const base = Math.max(0, implementationRub);
  return [
    {
      id: 'scope_growth',
      label: 'Рост объёма и неопределённость требований',
      probability: 0.4,
      impactRub: { low: base * 0.05, mid: base * 0.1, high: base * 0.2 },
      expectedRub: base * 0.04,
      mitigation: 'Фиксация объёма, этапная приёмка, change-request',
      party: 'shared',
      sourceId: 'assumption:risk_scope',
    },
    {
      id: 'schedule_slip',
      label: 'Сдвиг срока из-за согласований',
      probability: 0.3,
      impactRub: { low: base * 0.03, mid: base * 0.06, high: base * 0.12 },
      expectedRub: base * 0.018,
      mitigation: 'Календарный план с резервом и контрольными точками',
      party: 'shared',
      sourceId: 'assumption:risk_schedule',
    },
  ];
}
