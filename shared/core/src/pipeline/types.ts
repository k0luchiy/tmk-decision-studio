/**
 * Public shapes and shared constants of the estimate pipeline.
 *
 * These types are re-exported through the `../../pipeline.js` shim so existing
 * imports keep working.
 */

import type { ConfidenceScore, EffortGrid, Estimate, FormulaNode, Task, Verdict } from '@app/contract';
import type { Datasets } from '@app/data';
import type { ContractModel } from '../cost/contractor.js';

/** Hiring default: the most loaded role, or `1c_developer` when present. */
export const TURNOVER_RATE = 0.13;
/** Monte Carlo iterations per scenario: enough for stable P10/P90, still fast. */
export const SIMULATION_ITERATIONS = 4000;
/** One-factor copula correlation used by `simulate` (docs §8). */
export const SIMULATION_CORRELATION = 0.5;
/** Contractor stages owned by the contractor in the hybrid scenario. */
export const HYBRID_CONTRACTOR_STAGES: readonly number[] = [3];

/** Options that shape the two cost bases. All are optional. */
export interface EstimateTaskOptions {
  /** Add a hiring line for the most loaded role. */
  hiring?: boolean;
  /** Team utilisation in `(0, 1]`. Default `0.7`. */
  utilization?: number;
  /** Contractor contract model. Default `t_and_m`. */
  model?: ContractModel;
  /** Add a 20 % VAT line to contractor costs. Default `false`. */
  vat?: boolean;
  /** Override the average in-house rate, RUB/hour, for labour lines. */
  teamRate?: number;
  /** Risk reserve in `[0, 0.5]`; scales implementation cost by `1 + reservePct`. */
  reservePct?: number;
  /** Customer oversight/acceptance in `[0, 0.5]`; replaces contractor acceptance. */
  oversightPct?: number;
  /** Stages handed to the contractor in the hybrid scenario. Default `[3]`. */
  contractorStages?: number[];
  /** Target hours per stage 1..7; overrides the WBS after triangulation. */
  stageHours?: Record<number, number>;
}

/** Input of {@link estimateTask}. */
export interface EstimateTaskInput {
  task: Task;
  datasets: Datasets;
  seed: number;
  datasetVersion: string;
  options?: EstimateTaskOptions;
}

/** Result of {@link estimateTask}. */
export interface EstimateTaskResult {
  estimates: {
    inhouse: Estimate;
    contractor: Estimate;
    hybrid: Estimate;
  };
  verdict: Verdict;
  confidence: ConfidenceScore;
  effortGrid: EffortGrid;
  formulaTree: FormulaNode;
}
