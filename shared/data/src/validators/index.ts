/** Dataset validation entry point and cross-cutting warning checks. */

import type {
  AnalogueRow,
  Archetype,
  ContractorBand,
  Datasets,
  GradeRow,
  RoleCard,
  TmkContract,
} from '../types.js';
import { validateAnalogues } from './analogues.js';
import { validateArchetypes } from './archetypes.js';
import { validateContractorRates } from './contractor.js';
import {
  asArray,
  checkConfidence,
  checkName,
  checkStaleDate,
  type ValidationIssue,
  validateCoefficients,
  validateContracts,
} from './issues.js';
import { validateRateCards } from './rate.js';

export type { ValidationIssue } from './issues.js';

function validateWarnings(data: Datasets, issues: ValidationIssue[]): void {
  asArray<RoleCard>(data.rateCards?.roles).forEach((role, index) => {
    const path = `rateCards.roles[${index}]`;
    checkName(role.role_ru, `${path}.role_ru`, issues);
    checkName(role.role_en, `${path}.role_en`, issues);
    checkConfidence(role.confidence, `${path}.confidence`, issues);
    asArray<GradeRow>(role.grades).forEach((grade, gradeIndex) => {
      checkConfidence(grade.confidence, `${path}.grades[${gradeIndex}].confidence`, issues);
    });
  });

  asArray<ContractorBand>(data.contractorRates?.bands).forEach((band, index) => {
    checkConfidence(band.confidence, `contractorRates.bands[${index}].confidence`, issues);
  });

  asArray<Archetype>(data.archetypes?.archetypes).forEach((archetype, index) => {
    const path = `archetypes.archetypes[${index}]`;
    checkName(archetype.name_ru, `${path}.name_ru`, issues);
    checkName(archetype.name_en, `${path}.name_en`, issues);
    checkConfidence(archetype.confidence, `${path}.confidence`, issues);
  });

  asArray<AnalogueRow>(data.analogues?.analogues).forEach((analogue, index) => {
    const path = `analogues.analogues[${index}]`;
    checkName(analogue.title, `${path}.title`, issues);
    checkStaleDate(analogue.year, `${path}.year`, issues);
    checkConfidence(analogue.confidence, `${path}.confidence`, issues);
  });

  asArray<Record<string, unknown>>(data.analogues?.tmk_eis_rows).forEach((row, index) => {
    const path = `analogues.tmk_eis_rows[${index}]`;
    checkStaleDate(row.date_published, `${path}.date_published`, issues);
    checkConfidence(row.confidence, `${path}.confidence`, issues);
  });

  asArray<TmkContract>(data.contracts).forEach((contract, index) => {
    const path = `contracts[${index}]`;
    checkName(contract.subject_short, `${path}.subject_short`, issues);
    checkStaleDate(contract.start_date, `${path}.start_date`, issues);
    checkConfidence(contract.confidence, `${path}.confidence`, issues);
  });
}

/**
 * Validates every loaded dataset and returns all findings. The function never
 * throws for data problems: callers receive an (possibly empty) issue list and
 * decide how to surface it.
 */
export function validateDatasets(data: Datasets): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const roleIds = validateRateCards(data, issues);
  validateContractorRates(data, issues);
  validateArchetypes(data, issues, roleIds);
  validateAnalogues(data, issues);
  validateCoefficients(data, issues);
  validateContracts(data, issues);
  validateWarnings(data, issues);
  return issues;
}
