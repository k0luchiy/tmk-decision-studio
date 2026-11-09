/** Structural checks for `contractor_rate_cards.json`. */

import type { ContractorBand, Datasets } from '../types.js';
import { asArray, isFiniteNumber, isNonEmptyString, issue, type ValidationIssue } from './issues.js';

export function validateContractorRates(data: Datasets, issues: ValidationIssue[]): void {
  const bands = asArray<ContractorBand>(data.contractorRates?.bands);
  if (bands.length !== 224) {
    issue(issues, 'CONTRACTOR_BAND_COUNT', 'contractorRates.bands', `expected 224 bands, got ${bands.length}`);
  }

  bands.forEach((band, index) => {
    const bandPath = `contractorRates.bands[${index}]`;
    const ordered =
      isFiniteNumber(band.rate_low) &&
      isFiniteNumber(band.rate_mid) &&
      isFiniteNumber(band.rate_high) &&
      band.rate_low <= band.rate_mid &&
      band.rate_mid <= band.rate_high;
    if (!ordered) {
      issue(issues, 'RATE_BAND_ORDER', `${bandPath}.rate_mid`, 'expected rate_low <= rate_mid <= rate_high');
    }
    if (band.vat_included !== false) {
      issue(issues, 'VAT_FLAG', `${bandPath}.vat_included`, 'expected vat_included === false');
    }
    if (!isNonEmptyString(band.role_id)) {
      issue(issues, 'CONTRACTOR_ROLE_MISSING', `${bandPath}.role_id`, 'role_id must be non-empty');
    }
    if (!isNonEmptyString(band.grade)) {
      issue(issues, 'CONTRACTOR_GRADE_MISSING', `${bandPath}.grade`, 'grade must be non-empty');
    }
  });
}
