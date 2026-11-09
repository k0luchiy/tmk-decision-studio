/**
 * Компилируемый пример использования контракта `@app/contract`.
 *
 * Запуск проверки типов: `npm run typecheck` (корневой tsconfig включает
 * каталог `examples`). Пример ничего не вычисляет: он только валидирует
 * мок схемой и читает готовые поля для отрисовки.
 */
import { estimateTask } from '@app/core';
import type { Datasets } from '@app/data';
import { buildExportBundle } from '@app/export';
import { EstimateSchema } from '@app/contract';
import type { Estimate, Task } from '@app/contract';
import d1ScenariosJson from '../packages/contract/mock/d1.scenarios.json' assert { type: 'json' };

/** Разбор массива сценариев D1 схемой контракта. */
function parseScenarios(raw: unknown): Estimate[] {
  return EstimateSchema.array().parse(raw);
}

const estimates = parseScenarios(d1ScenariosJson);
const preferred = estimates.find((estimate) => estimate.scenario === 'hybrid') ?? estimates[0];

if (!preferred) {
  throw new Error('D1 mock не содержит ни одного сценария');
}

// Фронт только читает готовые поля — без собственных расчётов.
const verdictCode: Estimate['verdict']['code'] = preferred.verdict.code;
const costP50Rub: number = preferred.cost.p50Rub;
const analoguesCount: number = preferred.analogues.length;

console.log('verdict.code:', verdictCode);
console.log('cost.p50Rub:', costP50Rub);
console.log('analogues.length:', analoguesCount);

/**
 * Компилируемый пример полного пути: `estimateTask` → `buildExportBundle`.
 *
 * Функция не запускается при проверке типов: она показывает, как серверная
 * сторона получает готовый `Estimate` и снимок. `task.params` в демо-режиме
 * должны быть подтверждены (`status: 'confirmed'`), иначе gate экспорта вернёт
 * `ExportError('needs_review')`.
 */
export async function runEstimateExample(task: Task, datasets: Datasets): Promise<void> {
  const seed = 42;
  const datasetVersion = datasets.manifest?.datasetVersion ?? 'unknown';

  const result = estimateTask({
    task,
    datasets,
    seed,
    datasetVersion,
    options: { hiring: true, utilization: 0.7, model: 'fixed_price', vat: false },
  });

  const scenario =
    result.verdict.code === 'contractor'
      ? result.estimates.contractor
      : result.verdict.code === 'inhouse'
        ? result.estimates.inhouse
        : result.estimates.hybrid;

  const bundle = await buildExportBundle({
    estimate: scenario,
    params: (task.params ?? []).map((param) => ({ status: param.status })),
    datasetVersion,
    seed,
    format: 'json',
  });

  console.log('export.filename:', bundle.filename);
  console.log('export.bytes:', bundle.data.byteLength);
  console.log('result.effortGrid.totalHours:', result.effortGrid.totalHours);
}
