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
