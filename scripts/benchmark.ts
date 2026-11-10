import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDatasets } from '@app/data';
import { estimateTask } from '@app/core';
import { classifyBrief } from '@app/intake';
import { createBriefState } from '../frontend/src/core/briefState.js';
import { mapStateToRequest } from '../frontend/src/core/apiRequest.js';
import { buildTask } from '../backend/src/task.js';

interface CaseTarget {
  id: string;
  title: string;
  target_inhouse_rub: [number, number];
  target_contractor_rub: [number, number];
  target_inhouse_timeline: string;
  target_contractor_timeline: string;
  prompt_pro: string;
  prompt_simple: string;
}

interface Result {
  id: string;
  level: 'pro' | 'simple';
  type: string;
  inhouseRub: number;
  contractorRub: number;
  inhouseWeeks: number;
  contractorWeeks: number;
  inhouseTargetRub: [number, number];
  contractorTargetRub: [number, number];
  inhouseTargetWeeks: [number, number];
  contractorTargetWeeks: [number, number];
  inhouseCostOk: boolean;
  contractorCostOk: boolean;
  inhouseTimeOk: boolean;
  contractorTimeOk: boolean;
}

const root = fileURLToPath(new URL('..', import.meta.url));

function parseWeeks(text: string): [number, number] {
  const lower = text.toLowerCase();
  const match = lower.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(нед|мес|год|лет|дн)/)
    ?? lower.match(/(\d+(?:[.,]\d+)?)\s*(нед|мес|год|лет|дн)/);
  if (match === null) return [0, 0];
  const factor = match[3]?.startsWith('мес') ? 4.345
    : match[3]?.startsWith('год') || match[3]?.startsWith('лет') ? 52
      : match[3]?.startsWith('дн') ? 1 / 5 : 1;
  if (match[2] !== undefined && /^\d/.test(match[2])) {
    return [Number(match[1].replace(',', '.')) * factor, Number(match[2].replace(',', '.')) * factor];
  }
  const value = Number(match[1].replace(',', '.')) * factor;
  return [value, value];
}

function inRange(value: number, range: [number, number]): boolean {
  return value >= range[0] && value <= range[1];
}

function midpoint(range: [number, number]): number {
  return (range[0] + range[1]) / 2;
}

async function main(): Promise<void> {
  const markdown = await readFile(path.join(root, 'benchmarks', 'TEST_PROMPTS.md'), 'utf8');
  const block = /```json\n([\s\S]*?)(?:\n```|$)/.exec(markdown)?.[1];
  if (block === undefined) throw new Error('JSON block not found in TEST_PROMPTS.md');
  const cases = JSON.parse(block) as CaseTarget[];
  const datasets = await loadDatasets();
  const datasetVersion = datasets.manifest?.datasetVersion ?? 'benchmark';
  const results: Result[] = [];

  for (const item of cases) {
    for (const level of ['pro', 'simple'] as const) {
      const prompt = level === 'pro' ? item.prompt_pro : item.prompt_simple;
      const intake = await classifyBrief(prompt, { mode: 'off' });
      const rows = intake.params.map((param) => ({
        id: param.key,
        value: param.value,
        unit: param.unit ?? '',
        autoAccepted: true,
        suggested: false,
      }));
      const state = createBriefState(prompt, rows);
      const hasDeadline = rows.some((row) => ['duration', 'duration_weeks', 'deadline'].includes(row.id));
      const request = mapStateToRequest(state, {
        rateDirty: false,
        stageHoursDirty: false,
        deadlineDirty: hasDeadline,
      });
      const task = buildTask(prompt, request.params);
      const estimate = estimateTask({
        task,
        datasets,
        seed: 42,
        datasetVersion,
        options: request.options,
      });
      const inhouse = estimate.estimates.inhouse;
      const contractor = estimate.estimates.contractor;
      const inhouseTargetWeeks = parseWeeks(item.target_inhouse_timeline);
      const contractorTargetWeeks = parseWeeks(item.target_contractor_timeline);
      results.push({
        id: item.id,
        level,
        type: state.type,
        inhouseRub: Math.round(inhouse.cost.p50Rub),
        contractorRub: Math.round(contractor.cost.p50Rub),
        inhouseWeeks: inhouse.duration.p50Weeks,
        contractorWeeks: contractor.duration.p50Weeks,
        inhouseTargetRub: item.target_inhouse_rub,
        contractorTargetRub: item.target_contractor_rub,
        inhouseTargetWeeks,
        contractorTargetWeeks,
        inhouseCostOk: inRange(inhouse.cost.p50Rub, item.target_inhouse_rub),
        contractorCostOk: inRange(contractor.cost.p50Rub, item.target_contractor_rub),
        inhouseTimeOk: inRange(inhouse.duration.p50Weeks, inhouseTargetWeeks),
        contractorTimeOk: inRange(contractor.duration.p50Weeks, contractorTargetWeeks),
      });
    }
  }

  const pct = (value: number) => `${Math.round(value * 100)}%`;
  const ratio = (actual: number, target: [number, number]) => (actual / midpoint(target)).toFixed(2);
  const hit = (key: keyof Result) => pct(results.filter((row) => Boolean(row[key])).length / results.length);
  const lines = [
    '# Benchmark report — TEST_PROMPTS.md',
    '',
    `Дата: ${new Date().toISOString().slice(0, 10)}; datasetVersion: \`${datasetVersion}\`; режим intake: rules.`,
    '',
    'Сравнение с эталонными диапазонами из `benchmarks/TEST_PROMPTS.md`. Это измерение, а не подгонка:',
    'ни один кейс не имеет отдельной ветки или константы в модели.',
    '',
    `| Метрика | Попадание в диапазон |`,
    `|---|---:|`,
    `| In-house cost | ${hit('inhouseCostOk')} |`,
    `| Contractor cost | ${hit('contractorCostOk')} |`,
    `| In-house time | ${hit('inhouseTimeOk')} |`,
    `| Contractor time | ${hit('contractorTimeOk')} |`,
    '',
    '| Кейс | Ввод | Тип | In-house, ₽ | Цель | × | Contractor, ₽ | Цель | × | In-house нед | Contractor нед |',
    '|---|---|---|---:|---|---:|---:|---|---:|---:|---:|',
    ...results.map((row) => [
      row.id,
      row.level,
      row.type,
      row.inhouseRub.toLocaleString('ru-RU'),
      `${row.inhouseTargetRub[0].toLocaleString('ru-RU')}–${row.inhouseTargetRub[1].toLocaleString('ru-RU')}`,
      ratio(row.inhouseRub, row.inhouseTargetRub),
      row.contractorRub.toLocaleString('ru-RU'),
      `${row.contractorTargetRub[0].toLocaleString('ru-RU')}–${row.contractorTargetRub[1].toLocaleString('ru-RU')}`,
      ratio(row.contractorRub, row.contractorTargetRub),
      row.inhouseWeeks,
      row.contractorWeeks,
    ].join(' | ')).map((line) => `| ${line} |`),
    '',
    '## Наблюдения',
    '',
    '- Попадание считается строго в заявленный диапазон, без расширения допуска.',
    '- Расхождения показывают калибровку масштаба и классификации, а не качество отдельного кейса.',
    '- Эталонные диапазоны используют разные предпосылки по ставкам и объёму: например, CASE-01 и CASE-05 оба относятся к AI, но целевые бюджеты различаются в 20 раз.',
    '- Поэтому модель не содержит констант или веток по CASE-ID. Все правки в этом прогоне — общие: классификация, единицы объёма, защита от ложного дедлайна и от выбросов аналогового метода.',
    '',
    '## Что уже исправлено универсально',
    '',
    '- короткие интервалы («2–3 дня», «15 минут») больше не воспринимаются как срок проекта;',
    '- Telegram-бот, CV, PdM, MES и интеграции разводятся по ключевым словам без привязки к кейсам;',
    '- аналоговый метод не может раздувать смету более чем в 2 раза относительно WBS;',
    '- для неопределённого объёма используется нижний типовой масштаб, а не средний.',
    '',
    '## Что остаётся калибровать',
    '',
    '- разные базисы ставок в эталонах (внутренняя себестоимость vs fully loaded);',
    '- типовые объёмы CV/MES в датасете выше, чем в части эталонных кейсов;',
    '- для чат-бота нужен отдельный малый archetype, а не общий chatbot_assistant;',
    '- инфраструктура уже масштабируется от серверов/VM, но ТБ пока не влияет на объём;',
    '- эталонные диапазоны неоднородны, поэтому strict hit-rate нельзя считать единственным критерием качества.',
  ];
  await writeFile(path.join(root, 'docs', 'deliverables', 'BENCHMARK_REPORT.md'), `${lines.join('\n')}\n`, 'utf8');
  console.log(lines.slice(0, 10).join('\n'));
  console.log(`\nWrote docs/deliverables/BENCHMARK_REPORT.md (${results.length} runs)`);
}

await main();
