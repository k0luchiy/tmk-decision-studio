// core package
export { STAGE_SHARES, stageSharesSum } from './sizing/stageShares.js';
export type { StageShareKey } from './sizing/stageShares.js';
export { buildWbs, WORK_TYPE_TO_ARCHETYPE } from './sizing/wbs.js';
export { DEFAULT_PDR_HOURS_PER_FP, FP_WEIGHTS, PDR_BY_PLATFORM, fpLite } from './sizing/fpLite.js';
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
export { combineMethods, DEFAULT_DIVERGENCE_THRESHOLD, DEFAULT_WEIGHTS } from './sizing/combine.js';
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
export { costExtras } from './cost/extras.js';
export type { CostExtra } from './cost/extras.js';
export { P10_Z, P80_Z, allocateCostByStage, toStageGrid } from './cost/stageGrid.js';
export type { StageCost } from './cost/stageGrid.js';
export {
  BREAKEVEN_MONTHS,
  DEFAULT_CONTRACTOR_STAGES,
  DEFAULT_SUPPORT_RATE_CONTRACTOR,
  DEFAULT_SUPPORT_RATE_INHOUSE,
  DEFAULT_YEARS,
  RISK_PREMIUM_PCT,
  breakevenMonth,
  buildScenarios,
} from './scenarios/scenarios.js';
export type { CashFlowProfile, ScenarioInput, ScenarioResult } from './scenarios/scenarios.js';
export {
  RU_HOLIDAYS_2026_2027,
  addWorkingDays,
  formatCalendarDate,
  isWorkingDay,
  workingDaysBetween,
} from './schedule/calendar.js';
export {
  COMPRESSION_WARNING_THRESHOLD,
  DEFAULT_START_DATE,
  HOURS_PER_WEEK_PER_FTE,
  schedule,
} from './schedule/schedule.js';
export type { ScheduleInput, ScheduleResult, TeamMember } from './schedule/schedule.js';
export { mulberry32, normalPair } from './risk/prng.js';
export { DEFAULT_CORRELATION, DEFAULT_ITERATIONS, simulate } from './risk/monteCarlo.js';
export type {
  EstimateRange,
  MonteCarloInput,
  MonteCarloResult,
  Quantiles,
} from './risk/monteCarlo.js';
export {
  conditional_v1,
  contractor_v1,
  formatMoneyMln,
  formatMonth,
  formatWeeks,
  hybrid_v1,
  inhouse_v1,
  parity_v1,
} from './decision/templates.js';
export type { TemplateInput, TemplateScenario } from './decision/templates.js';
export { HYBRID_TCO_TOLERANCE, buildVerdict } from './decision/verdict.js';
export type { VerdictInput, VerdictScenarioInput } from './decision/verdict.js';
export {
  CONFIDENCE_WEIGHTS,
  HIGH_THRESHOLD,
  MEDIUM_THRESHOLD,
  ORDER_OF_MAGNITUDE_CAP,
  confidence,
} from './decision/confidence.js';
export type { AccuracyClass, ConfidenceInput, ConfidenceWeights } from './decision/confidence.js';
export { D1_FLOWS, d1Task } from './fixtures/d1.js';
export { computeCalcD1, formatCalcTable, runCalc } from './cli/calc.js';
export type { CalcEffort, CalcResult, CalcScenario, CalcStageRow } from './cli/calc.js';
