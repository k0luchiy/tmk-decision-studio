/**
 * Demo fixture D1: integration of 1C:ERP with WMS across 6 flows.
 *
 * Used by the calculation CLI and tests. The task only carries the brief; the
 * WBS is built from it with `buildWbs(d1Task, archetypes, { unitsCount: D1_FLOWS })`.
 */

import type { Task } from '@app/contract';

/** Number of integration flows in the D1 demo. */
export const D1_FLOWS = 6;

/** D1 brief: an integration task on the 1C platform with 6 flows. */
export const d1Task: Task = {
  id: 'd1',
  title: 'Интеграция 1С:ERP ↔ WMS, 6 потоков',
  descriptionRaw:
    'Демо D1: интеграция 1С:ERP с WMS по 6 потокам (заказы, остатки, приёмка, отгрузка, справочники, возвраты).',
  briefVersion: '1.0',
  createdAt: '2026-11-09',
  platform: '1С',
  params: [
    {
      key: 'work_type',
      value: 'integration',
      unit: '',
      confidence: 1,
      status: 'confirmed',
      defaultUsed: false,
    },
    {
      key: 'flows',
      value: D1_FLOWS,
      unit: 'поток',
      confidence: 1,
      status: 'confirmed',
      defaultUsed: false,
    },
  ],
};
