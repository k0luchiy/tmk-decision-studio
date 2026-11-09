/** Human confirmation of merged parameters and the ready-to-calculate gate. */

import type { ExtractedParam as ContractExtractedParam } from '@app/contract';
import type { MergedParam } from './types.js';

/**
 * Confirm a parameter by key (and optionally by value when two conflict
 * rows share the key). Confirming one side of a conflict rejects the other
 * side and clears the conflict group.
 */
export function confirmParam(
  params: readonly MergedParam[],
  key: string,
  value?: ContractExtractedParam['value'],
): MergedParam[] {
  const matches = new Set<MergedParam>();
  for (const param of params) {
    if (param.key !== key) continue;
    if (value !== undefined && param.value !== value) continue;
    matches.add(param);
  }

  if (matches.size === 0) {
    return params.map((param) => ({ ...param }));
  }

  const clearedGroups = new Set<string>();
  for (const param of matches) {
    if (param.conflictGroup !== undefined) clearedGroups.add(param.conflictGroup);
  }

  return params.map((param) => {
    if (matches.has(param)) {
      return {
        ...param,
        value: value ?? param.value,
        status: 'confirmed',
        conflictGroup: undefined,
      };
    }
    if (param.conflictGroup !== undefined && clearedGroups.has(param.conflictGroup)) {
      return { ...param, status: 'rejected', conflictGroup: undefined };
    }
    return { ...param };
  });
}

/** True when every parameter has been confirmed by a human. */
export function allConfirmed(params: readonly MergedParam[]): boolean {
  return params.every((param) => param.status === 'confirmed');
}
