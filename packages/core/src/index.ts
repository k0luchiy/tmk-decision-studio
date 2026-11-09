// core package
export { STAGE_SHARES, stageSharesSum } from './sizing/stageShares.js';
export type { StageShareKey } from './sizing/stageShares.js';
export { buildWbs, WORK_TYPE_TO_ARCHETYPE } from './sizing/wbs.js';
export {
  DEFAULT_PDR_HOURS_PER_FP,
  FP_WEIGHTS,
  PDR_BY_PLATFORM,
  fpLite,
} from './sizing/fpLite.js';
export type { FpComponent, FpLiteInput, FpLiteResult, FpPlatform } from './sizing/fpLite.js';
export {
  ANALOGUE_AGE_INDEX,
  ANALOGUE_TYPE_BY_WORK_TYPE,
  DEFAULT_MIN_ANALOGUES,
  DEFAULT_TARGET_YEAR,
  analogueEstimate,
} from './sizing/analogues.js';
export type {
  AnalogueEstimateInput,
  AnalogueEstimateResult,
  AnalogueExclusionReason,
  ExcludedAnalogue,
  RawAnalogue,
  UsedAnalogue,
} from './sizing/analogues.js';
export {
  combineMethods,
  DEFAULT_DIVERGENCE_THRESHOLD,
  DEFAULT_WEIGHTS,
} from './sizing/combine.js';
export type { CombineMethodsInput, CombineMethodsResult, MethodWeights } from './sizing/combine.js';
export {
  DEFAULT_UTILIZATION,
  HIRING_MONTHS,
  MissingRateError,
  MONTHS_PER_YEAR,
  PRODUCTIVE_HOURS_PER_MONTH,
  RAMPUP_MONTHS,
  RAMPUP_PRODUCTIVITY,
  TURNOVER_REPLACEMENT_SHARE,
  costInhouse,
} from './cost/inhouse.js';
export type { EffortByRole, InhouseInput, InhouseOptions } from './cost/inhouse.js';
export {
  DEFAULT_ACCEPTANCE_PCT,
  DEFAULT_COORDINATION_PCT,
  DEFAULT_FIXED_PRICE_RISK_PCT,
  MissingBandError,
  UnsupportedGeoError,
  VAT_RATE,
  costContractor,
} from './cost/contractor.js';
export type {
  ContractModel,
  ContractorEffort,
  ContractorGeo,
  ContractorInput,
  ContractorOptions,
} from './cost/contractor.js';
