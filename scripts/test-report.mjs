// Generates TEST_REPORT.md from real artefacts:
// - out/control.json        — observed D1–D3 P50 / verdict (written by `npm run e2e`)
// - data/seeds/control.json — expected baselines and tolerance
// - out/intake-eval.json    — intake metrics (generated on demand)
// - a fresh `vitest run --reporter=json` for the unit/property summary
//
// The report is generated, never hand-written: it cannot drift from the code.
// MAPE is intentionally not computed — see the calibration section.

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process, { cwd, stdout } from 'node:process';

const root = process.env.REPORT_ROOT ?? cwd();
const outDir = path.join(root, 'out');
mkdirSync(outDir, { recursive: true });

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function tryRun(command, args) {
  try {
    execFileSync(command, args, { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------------- //
// Tests: run Vitest once with the JSON reporter and split unit vs property.
// --------------------------------------------------------------------------- //
const vitestBin = path.join(root, 'node_modules', '.bin', 'vitest');
const vitestJson = path.join(outDir, 'vitest-report.json');
const testsOk = tryRun(vitestBin, ['run', '--reporter=json', `--outputFile=${vitestJson}`]);

const testSummary = {
  total: 0,
  passed: 0,
  failed: 0,
  files: 0,
  unitFiles: 0,
  unitTests: 0,
  unitPassed: 0,
  propertyFiles: 0,
  propertyTests: 0,
  propertyPassed: 0,
};

if (existsSync(vitestJson)) {
  const report = readJson(vitestJson);
  testSummary.total = report.numTotalTests ?? 0;
  testSummary.passed = report.numPassedTests ?? 0;
  testSummary.failed = report.numFailedTests ?? 0;
  const results = Array.isArray(report.testResults) ? report.testResults : [];
  testSummary.files = results.length;

  for (const file of results) {
    const name = String(file.name ?? '');
    const assertions = Array.isArray(file.assertionResults) ? file.assertionResults : [];
    const passed = assertions.filter((entry) => entry.status === 'passed').length;
    const isProperty = name.includes('invariants') || name.includes('property');
    if (isProperty) {
      testSummary.propertyFiles += 1;
      testSummary.propertyTests += assertions.length;
      testSummary.propertyPassed += passed;
    } else {
      testSummary.unitFiles += 1;
      testSummary.unitTests += assertions.length;
      testSummary.unitPassed += passed;
    }
  }
}

// --------------------------------------------------------------------------- //
// Control tasks D1–D3.
// --------------------------------------------------------------------------- //
const expectedControl = readJson(path.join(root, 'data', 'seeds', 'control.json'));
const actualControlPath = path.join(outDir, 'control.json');
const actualControl = existsSync(actualControlPath) ? readJson(actualControlPath) : null;
const tolerance = Number(expectedControl.tolerance ?? 0.15);

const actualById = new Map(
  (actualControl?.tasks ?? []).map((task) => [task.id, task]),
);

const numberFormat = new Intl.NumberFormat('ru-RU');

function money(value) {
  return numberFormat.format(Math.round(value));
}

function signedPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)} %`;
}

const controlRows = [];
let controlFailures = 0;
for (const expected of expectedControl.tasks ?? []) {
  const actual = actualById.get(expected.id);
  if (actual === undefined) {
    controlFailures += 1;
    controlRows.push({
      id: expected.id,
      expected: `${expected.verdict}, P50 ${money(expected.p50Rub)} ₽ ±${(tolerance * 100).toFixed(0)} %`,
      fact: 'нет данных (запустите npm run e2e)',
      deviation: '—',
      verdict: 'FAIL',
    });
    continue;
  }

  const deviation = ((actual.p50Rub - expected.p50Rub) / expected.p50Rub) * 100;
  const within = Math.abs(deviation) <= tolerance * 100;
  const verdictOk = actual.verdict === expected.verdict;
  if (!within || !verdictOk) controlFailures += 1;

  controlRows.push({
    id: expected.id,
    expected: `${expected.verdict}, P50 ${money(expected.p50Rub)} ₽ ±${(tolerance * 100).toFixed(0)} %`,
    fact: `${actual.verdict}, P50 ${money(actual.p50Rub)} ₽, ${actual.weeks} нед`,
    deviation: signedPercent(deviation),
    verdict: within && verdictOk ? 'ok' : verdictOk ? `FAIL (P50 вне ±${(tolerance * 100).toFixed(0)} %)` : `FAIL (ожидался ${expected.verdict})`,
  });
}

// --------------------------------------------------------------------------- //
// Intake metrics: generate out/intake-eval.json when it is missing.
// --------------------------------------------------------------------------- //
const intakePath = path.join(outDir, 'intake-eval.json');
if (!existsSync(intakePath)) {
  tryRun(process.execPath, [path.join(root, 'scripts', 'intake-eval.mjs')]);
}
const intake = existsSync(intakePath) ? readJson(intakePath) : null;

function percent(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)} %`;
}

const intakeRows = intake === null
  ? [['workTypeAccuracy', 'нет данных — запустите npm run intake:eval'], ['flagsAccuracy', '—'], ['numberRecall', '—'], ['total', '—'], ['missing_labels', '—']]
  : [
      ['workTypeAccuracy', percent(intake.workTypeAccuracy)],
      ['flagsAccuracy', percent(intake.flagsAccuracy)],
      ['numberRecall', percent(intake.numberRecall)],
      ['total', String(intake.total ?? 0)],
      ['missing_labels', String((intake.missing_labels ?? []).length)],
    ];

// --------------------------------------------------------------------------- //
// Markdown.
// --------------------------------------------------------------------------- //
const lines = [];
lines.push('# TEST_REPORT');
lines.push('');
lines.push('_Сгенерировано `scripts/test-report.mjs`; не редактировать вручную._');
lines.push('');
lines.push(`- Дата генерации: ${new Date().toISOString()}`);
lines.push(`- Версия датасетов: \`${expectedControl.datasetVersion ?? 'unknown'}\``);
lines.push(`- Точка входа e2e: \`out/control.json\` (${actualControl === null ? 'нет файла' : 'есть'})`);
lines.push('');
lines.push('## 1. Контрольные задачи D1–D3');
lines.push('');
lines.push('| задача | ожидание | факт | отклонение | verdict |');
lines.push('|---|---|---|---|---|');
for (const row of controlRows) {
  lines.push(`| ${row.id} | ${row.expected} | ${row.fact} | ${row.deviation} | ${row.verdict} |`);
}
lines.push('');
lines.push(`Допуск P50: ±${(tolerance * 100).toFixed(0)} % от базовой линии. Провалов: ${controlFailures}.`);
lines.push('');
lines.push('Базовая линия в `data/seeds/control.json` снята с текущего движка и служит регрессией: она ловит дрейф расчёта, а не подтверждает точность на рынке.');
lines.push('');
lines.push('## 2. Unit и property тесты');
lines.push('');
lines.push('| уровень | файлов | тестов | пройдено |');
lines.push('|---|---:|---:|---:|');
lines.push(`| Unit | ${testSummary.unitFiles} | ${testSummary.unitTests} | ${testSummary.unitPassed} |`);
lines.push(`| Property (invariants) | ${testSummary.propertyFiles} | ${testSummary.propertyTests} | ${testSummary.propertyPassed} |`);
lines.push(`| Всего | ${testSummary.files} | ${testSummary.total} | ${testSummary.passed} |`);
lines.push('');
lines.push(`Итог Vitest: ${testSummary.passed}/${testSummary.total} пройдено, ${testSummary.failed} провалено${testsOk ? '' : ' (запуск завершился с ошибкой)'}.`);
lines.push('');
lines.push('## 3. Intake (правила + кэш Jev)');
lines.push('');
lines.push('| метрика | значение |');
lines.push('|---|---|');
for (const [key, value] of intakeRows) {
  lines.push(`| ${key} | ${value} |`);
}
lines.push('');
lines.push('Источник: `out/intake-eval.json`, набор `data/eval/briefs.json` (12 брифов, 3 с метками для контроля).');
lines.push('');
lines.push('## 4. Калибровка и MAPE');
lines.push('');
lines.push('**MAPE не считается.** В обезличенной выгрузке HelpDesk всего 4 строки; для калибровки MAPE/PRED(25) нужно не менее 10 пар план/факт. Контроль D1–D3 проверяет попадание P50 в ±15 % от базовой линии и совпадение вердикта, а не точность прогноза на исторических данных.');
lines.push('');
lines.push('## 5. Что не покрыто');
lines.push('');
lines.push('- Реальная калибровка MAPE/PRED(25): данных недостаточно (см. §4).');
lines.push('- Playwright-сценарий браузерного кокпита: на текущем этапе e2e идёт от брифа до PDF через Node-пайплайн (`npm run e2e`).');
lines.push('');

const reportPath = path.join(root, 'TEST_REPORT.md');
writeFileSync(reportPath, `${lines.join('\n')}\n`, 'utf8');

stdout.write(`TEST_REPORT.md written\n`);
stdout.write(`${controlRows.map((row) => `${row.id}: ${row.verdict}`).join(', ')}\n`);
if (!testsOk || controlFailures > 0 || actualControl === null) {
  process.exitCode = 1;
}
