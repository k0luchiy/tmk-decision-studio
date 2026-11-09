/**
 * Компилируемый пример использования контракта `@app/contract`.
 *
 * Запуск проверки типов: `npm run typecheck` (корневой tsconfig включает
 * каталог `examples`). Пример ничего не вычисляет: он только валидирует
 * мок схемой и читает готовые поля для отрисовки.
 */
import { EstimateSchema } from '@app/contract';
import type { Estimate } from '@app/contract';
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
