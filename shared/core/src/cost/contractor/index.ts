/**
 * Contractor cost (`docs/03_estimation_model.md` §5.2).
 *
 * Labour is priced from `contractor_rate_cards.json` by `(geo, role_id, grade)`
 * using the band midpoint (`rate_mid`). No role multiplier and no FX conversion
 * are applied: only RU quotes are priced here, other geos raise
 * {@link UnsupportedGeoError} instead of being silently converted.
 *
 * The contract model drives the risk premium: `fixed_price` adds a scope-risk
 * load (20 % by default), while `t_and_m` and `dedicated_team` do not. Fixed
 * overheads are separate lines so the UI can show a formula tree. The function
 * is pure and deterministic; invalid input raises `RangeError`, a missing band
 * raises {@link MissingBandError}.
 */

import type { CostLine } from '@app/contract';
import {
  assertPercentage,
  bandRef,
  collectBuckets,
  formatNumber,
} from './helpers.js';
import {
  DEFAULT_ACCEPTANCE_PCT,
  DEFAULT_COORDINATION_PCT,
  DEFAULT_FIXED_PRICE_RISK_PCT,
  UnsupportedGeoError,
  VAT_RATE,
  type ContractorInput,
} from './types.js';

export {
  DEFAULT_ACCEPTANCE_PCT,
  DEFAULT_COORDINATION_PCT,
  DEFAULT_FIXED_PRICE_RISK_PCT,
  MissingBandError,
  UnsupportedGeoError,
  VAT_RATE,
} from './types.js';
export type {
  ContractModel,
  ContractorEffort,
  ContractorGeo,
  ContractorInput,
  ContractorOptions,
} from './types.js';

/**
 * Builds the contractor cost lines (`docs/03_estimation_model.md` §5.2).
 *
 * Lines, in order:
 *
 * - `labor:<role>:<grade>`: `hours × rate_mid`, `status: 'fact'`.
 * - `coordination`: `Σlabor × coordinationPct` (default 15 %), group `coordination`.
 * - `acceptance`: `Σlabor × acceptancePct` (default 5 %), group `coordination`.
 * - `risk`: `Σlabor × riskLoadPct` (default 20 % only for `fixed_price`;
 *   omitted when the share is 0), group `risk`.
 * - `vat`: `(labor + coordination + acceptance + risk) × 20 %` when `vat` is
 *   `true`, group `vat`.
 *
 * @throws {UnsupportedGeoError} when `opts.geo` is not `RU` (no FX conversion).
 * @throws {MissingBandError} when a role/grade/geo triple has no band.
 * @throws {RangeError} when hours or percentages are invalid.
 */
export function costContractor(input: ContractorInput): CostLine[] {
  const opts = input.opts ?? {};
  const geo = opts.geo ?? 'RU';
  if (geo !== 'RU') {
    throw new UnsupportedGeoError(geo);
  }

  const model = opts.model ?? 't_and_m';
  const coordinationPct = opts.coordinationPct ?? DEFAULT_COORDINATION_PCT;
  const acceptancePct = opts.acceptancePct ?? DEFAULT_ACCEPTANCE_PCT;
  const riskLoadPct =
    opts.riskLoadPct ?? (model === 'fixed_price' ? DEFAULT_FIXED_PRICE_RISK_PCT : 0);

  assertPercentage('opts.coordinationPct', coordinationPct, 0.5);
  assertPercentage('opts.acceptancePct', acceptancePct, 0.5);
  assertPercentage('opts.riskLoadPct', riskLoadPct);

  const buckets = collectBuckets(input, geo);
  const lines: CostLine[] = buckets.map((bucket) => {
    const { roleId, grade, hours, band, rate } = bucket;
    const sourceId = bandRef(band.id);
    return {
      id: `labor:${roleId}:${grade}`,
      group: 'labor',
      label: `Труд подрядчика: ${band.role_ru} (${grade})`,
      formula: `${formatNumber(hours)} h × ${formatNumber(rate)} ₽/ч`,
      inputRefs: [sourceId],
      valueRub: hours * rate,
      sourceId,
      status: 'fact',
    };
  });

  if (buckets.length === 0) {
    return lines;
  }

  const laborTotal = lines.reduce((sum, line) => sum + line.valueRub, 0);
  const laborRefs = buckets.map((bucket) => bandRef(bucket.band.id));

  const coordination = laborTotal * coordinationPct;
  lines.push({
    id: 'coordination',
    group: 'coordination',
    label: `Координация (${formatNumber(coordinationPct * 100)} %)`,
    formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(coordinationPct)}`,
    inputRefs: laborRefs,
    valueRub: coordination,
    sourceId: 'assumption:coordination',
    status: 'assumption',
  });

  const acceptance = laborTotal * acceptancePct;
  lines.push({
    id: 'acceptance',
    group: 'coordination',
    label: `Приёмка и передача (${formatNumber(acceptancePct * 100)} %)`,
    formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(acceptancePct)}`,
    inputRefs: laborRefs,
    valueRub: acceptance,
    sourceId: 'assumption:acceptance',
    status: 'assumption',
  });

  const risk = laborTotal * riskLoadPct;
  if (riskLoadPct > 0) {
    lines.push({
      id: 'risk',
      group: 'risk',
      label: `Риск-премия (${formatNumber(riskLoadPct * 100)} %, ${model})`,
      formula: `${formatNumber(laborTotal)} ₽ × ${formatNumber(riskLoadPct)}`,
      inputRefs: laborRefs,
      valueRub: risk,
      sourceId: 'assumption:risk',
      status: 'assumption',
    });
  }

  if (opts.vat) {
    const vatBase = laborTotal + coordination + acceptance + risk;
    lines.push({
      id: 'vat',
      group: 'vat',
      label: `НДС (${formatNumber(VAT_RATE * 100)} %)`,
      formula: `${formatNumber(vatBase)} ₽ × ${formatNumber(VAT_RATE)}`,
      inputRefs: laborRefs,
      valueRub: vatBase * VAT_RATE,
      sourceId: 'assumption:vat',
      status: 'assumption',
    });
  }

  return lines;
}
