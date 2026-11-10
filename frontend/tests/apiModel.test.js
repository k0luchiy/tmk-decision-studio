import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModelFromApi, mapContractorStages, mapStateToRequest } from '../src/core/apiModel.js';
import { mapContractorStageShares, mapExtras, weightedTeamRate } from '../src/core/apiRequest.js';
import { createCaseState } from '../src/core/calc.js';

const mock = JSON.parse(
  readFileSync(new URL('../../shared/contract/mock/d1.scenarios.json', import.meta.url), 'utf8'),
);
const [inhouse, contractor, hybrid] = mock;

const apiResponse = (overrides = {}) => ({
  id: 'est_fixture_d1',
  datasetVersion: inhouse.datasetVersion,
  seed: 42,
  createdAt: inhouse.createdAt,
  estimates: { inhouse, contractor, hybrid },
  verdict: inhouse.verdict,
  confidence: inhouse.confidence,
  effortGrid: inhouse.effort.grid,
  formulaTree: inhouse.formulaTree,
  params: [],
  warnings: inhouse.warnings,
  methodDivergence: 0.42,
  ...overrides,
});

test('buildModelFromApi maps the API snapshot into the legacy model shape', () => {
  const state = createCaseState('D1');
  const model = buildModelFromApi(apiResponse(), state);

  assert.deepEqual(Object.keys(model.scenarios), ['internal', 'vendor', 'hybrid']);
  for (const id of ['internal', 'vendor', 'hybrid']) {
    const scenario = model.scenarios[id];
    assert.ok(scenario.p10 < scenario.p50 && scenario.p50 < scenario.p90, `${id} quantiles ordered`);
    assert.ok(scenario.weeks > 0);
    assert.ok(scenario.tco1 > 0 && scenario.tco3 > scenario.tco1 && scenario.tco5 > scenario.tco3);
    assert.equal(typeof scenario.scoreParts.cost, 'number');
    assert.equal(typeof scenario.scoreParts.time, 'number');
    assert.equal(typeof scenario.scoreParts.risk, 'number');
    assert.equal(typeof scenario.scoreParts.flexibility, 'number');
    assert.ok(scenario.score >= 0 && scenario.score <= 100);
    assert.ok(Array.isArray(scenario.lines) && scenario.lines.length > 0);
  }
  assert.ok(['internal', 'vendor', 'hybrid'].includes(model.recommended));
  assert.ok(model.scenarios[model.recommended]);
  assert.equal(model.estimateId, 'est_fixture_d1');
  assert.equal(model.api, true);
});

test('confidence, stage rows and effort are adapted for the UI', () => {
  const model = buildModelFromApi(apiResponse(), createCaseState('D1'));

  assert.equal(model.confidence.components.length, 4);
  assert.deepEqual(
    model.confidence.components.map((item) => item.id),
    ['brief', 'method', 'analog', 'data'],
  );
  assert.deepEqual(
    model.confidence.components.map((item) => item.weight),
    [0.3, 0.3, 0.2, 0.2],
  );
  assert.equal(model.confidence.score, apiResponse().confidence.score);
  assert.ok(model.confidence.score >= 0 && model.confidence.score <= 100);

  assert.equal(model.stageRows.length, 7);
  const hours = model.stageRows.reduce((acc, row) => acc + row.hours, 0);
  assert.equal(Math.round(hours), model.effort);
  assert.equal(model.effort, 930);
  assert.ok(model.stageDays > 0);
  assert.ok(model.risksTotal >= 0);
  assert.ok(model.meta.assumptions.length > 0);
  assert.ok(model.meta.analogs.length > 0);
});

test('maps the calendar breakdown from the API response', () => {
  const calendar = {
    workType: 'integration',
    effortP50Weeks: 7,
    stageLags: [{ stage: 1, weeks: 0.5 }],
    lagWeeks: 3.5,
    pilotWeeks: 0,
    minCalendarWeeks: 4,
  };
  const model = buildModelFromApi(apiResponse({ calendar }), createCaseState('D1'));
  assert.deepEqual(model.calendar, calendar);
});

test('uses API sensitivity and distribution when present', () => {
  const sensitivity = Array.from({ length: 5 }, (_, index) => ({
    name: `Фактор ${index}`, low: -0.1, high: 0.1, lowValue: 900, highValue: 1100,
  }));
  const distribution = Array.from({ length: 11 }, (_, index) => ({ value: index * 1000, label: `${index},0`, count: index }));
  const model = buildModelFromApi(apiResponse({ sensitivity, distribution }), createCaseState('D1'));

  assert.deepEqual(model.sensitivity, sensitivity);
  assert.deepEqual(model.distribution, distribution);
});

test('falls back to synthetic arrays only when the API omits them', () => {
  const model = buildModelFromApi(apiResponse(), createCaseState('D1'));

  assert.equal(model.sensitivity.length, 5);
  assert.equal(model.distribution.length, 11);
  assert.ok(model.sensitivity.every((factor) => typeof factor.lowValue === 'number'));
  assert.ok(model.distribution.every((bin) => typeof bin.count === 'number'));
});

test('mapStateToRequest sends confirmed params and options', () => {
  const state = createCaseState('D1');
  const clean = mapStateToRequest(state);
  assert.ok(!Object.prototype.hasOwnProperty.call(clean.options, 'teamRate'));
  assert.ok(!Object.prototype.hasOwnProperty.call(clean.options, 'stageHours'));
  assert.ok(!Object.prototype.hasOwnProperty.call(clean.options, 'targetWeeks'));

  const request = mapStateToRequest(state, { rateDirty: true, stageHoursDirty: true, deadlineDirty: true });

  assert.equal(request.params.length, 5);
  for (const param of request.params) {
    assert.equal(param.status, 'confirmed');
    assert.equal(param.defaultUsed, false);
    assert.equal(param.unit, '');
    assert.equal(param.confidence, 1);
  }
  assert.equal(request.params.find((param) => param.key === 'work_type').value, 'integration');
  assert.equal(request.params.find((param) => param.key === 'flows').value, state.integrations);
  assert.equal(request.params.find((param) => param.key === 'duration_weeks').value, state.deadlineWeeks);

  assert.equal(request.options.model, 't_and_m');
  assert.equal(request.options.utilization, 0.7);
  assert.equal(request.options.vat, false);
  assert.equal(request.options.targetWeeks, state.deadlineWeeks);
  const expectedRate = Math.round(
    state.stages.reduce((acc, stage) => acc + stage.hours * stage.rate, 0) /
      state.stages.reduce((acc, stage) => acc + stage.hours, 0),
  );
  assert.equal(request.options.teamRate, expectedRate);
  assert.equal(request.options.reservePct, state.reserve / 100);
  assert.equal(request.options.oversightPct, state.oversight / 100);
  assert.equal(request.options.stageHours['3'], 560);
  assert.equal(request.options.targetWeeks, state.deadlineWeeks);
  assert.deepEqual(request.options.contractorStages, [3]);
  assert.equal(request.options.extras.length, 9);
  assert.ok(request.options.extras.every((extra) => extra.amountRub > 0));
  assert.deepEqual(
    [...new Set(request.options.extras.map((extra) => extra.appliesTo))].sort(),
    ['contractor', 'hybrid', 'inhouse'],
  );
});

test('teamRate falls back to state.teamRate when stage rates match', () => {
  const state = createCaseState('D1');
  const uniform = { ...state, stages: state.stages.map((stage) => ({ ...stage, rate: 5000 })) };
  assert.equal(weightedTeamRate(uniform), uniform.teamRate);
  assert.equal(weightedTeamRate(state), Math.round(
    state.stages.reduce((acc, stage) => acc + stage.hours * stage.rate, 0) /
      state.stages.reduce((acc, stage) => acc + stage.hours, 0),
  ));
});

test('mapExtras emits up to three per-scenario lines, skips zeros and caps at 20', () => {
  const records = mapExtras([{ name: 'Лицензии', internal: 100000, external: 200000, hybrid: 150000 }]);
  assert.equal(records.length, 3);
  assert.deepEqual(records.map((record) => record.appliesTo), ['inhouse', 'contractor', 'hybrid']);
  assert.deepEqual(records.map((record) => record.amountRub), [100000, 200000, 150000]);
  assert.ok(records.every((record) => record.label.startsWith('Лицензии')));

  assert.deepEqual(mapExtras([{ name: 'GPU', internal: 0, external: 0, hybrid: 0 }]), []);
  const partial = mapExtras([{ name: 'Инфра', internal: 5000, external: 0, hybrid: 0 }]);
  assert.equal(partial.length, 1);
  assert.equal(partial[0].appliesTo, 'inhouse');
  const many = Array.from({ length: 10 }, (_, index) => ({ name: `E${index}`, internal: 1, external: 1, hybrid: 1 }));
  assert.equal(mapExtras(many).length, 20);
});

test('methodDivergence becomes methodDiff and warns above 30%', () => {
  const high = buildModelFromApi(apiResponse({ methodDivergence: 0.42 }), createCaseState('D1'));
  assert.equal(high.methodDiff, 0.42);
  const warning = high.warnings.find((item) => item.title === 'Расхождение методов');
  assert.ok(warning);
  assert.equal(warning.tone, 'warn');
  assert.match(warning.text, /42%/);

  const low = buildModelFromApi(apiResponse({ methodDivergence: 0.1 }), createCaseState('D1'));
  assert.equal(low.methodDiff, 0.1);
  assert.ok(!low.warnings.some((item) => item.title === 'Расхождение методов'));

  const missing = buildModelFromApi(apiResponse({ methodDivergence: undefined }), createCaseState('D1'));
  assert.equal(missing.methodDiff, 0);
});

test('mapContractorStageShares keeps partial ownership per stage', () => {
  assert.deepEqual(
    mapContractorStageShares([
      { id: 'discovery', owner: 'internal' },
      { id: 'design', owner: 'split' },
      { id: 'development', owner: 'vendor' },
      { id: 'integration', owner: 'split' },
    ]),
    { 2: 0.5, 3: 1 },
  );
});

test('mapContractorStages maps vendor/split stages and falls back to [3]', () => {
  assert.deepEqual(mapContractorStages(createCaseState('D1').stages), [3]);
  assert.deepEqual(
    mapContractorStages([
      { id: 'testing', split: 20, owner: 'split' },
      { id: 'deployment', split: 50, owner: 'vendor' },
    ]),
    [4, 5],
  );
  assert.deepEqual(mapContractorStages([]), [3]);
});

test('work type accepts English backend keys and Russian labels', () => {
  const base = createCaseState('D1');
  const workType = (type) =>
    mapStateToRequest({ ...base, type }, { rateDirty: false, stageHoursDirty: false }).params.find(
      (param) => param.key === 'work_type',
    ).value;

  assert.equal(workType('integration'), 'integration');
  assert.equal(workType('support'), 'support');
  assert.equal(workType('Сопровождение'), 'support');
  assert.equal(workType('Интеграция систем'), 'integration');
  assert.equal(workType('Computer Vision'), 'cv');
  assert.equal(workType('unknown'), 'default');
});

test('stage 7 hours map onto the handover row for support tasks', () => {
  const response = apiResponse({
    effortGrid: { byStage: [{ stage: 7, hours: 1533 }], totalHours: 1533, p10Hours: 1200, p90Hours: 1800 },
  });
  const model = buildModelFromApi(response, createCaseState('D3'));

  assert.equal(model.stageRows.length, 7);
  assert.equal(model.stageRows.at(-1).id, 'handover');
  assert.equal(model.stageRows.at(-1).hours, 1533);
  const hours = model.stageRows.reduce((acc, row) => acc + row.hours, 0);
  assert.equal(Math.round(hours), model.effort);
});

test('break-even and compression come from API estimates and warnings', () => {
  const estimates = apiResponse().estimates;
  const response = apiResponse({
    estimates: {
      ...estimates,
      inhouse: {
        ...estimates.inhouse,
        warnings: [
          { code: 'schedule_compression', severity: 'warning', message: 'Сжатие 30%: трудоёмкость ×2.50' },
        ],
      },
      contractor: { ...estimates.contractor, breakevenMonth: null },
      hybrid: { ...estimates.hybrid, breakevenMonth: 14 },
    },
  });
  const model = buildModelFromApi(response, createCaseState('D1'));

  assert.equal(model.breakEven, 14);
  for (const id of ['internal', 'vendor', 'hybrid']) {
    assert.equal(model.scenarios[id].compressed, true);
    assert.equal(model.scenarios[id].compressionMultiplier, 2.5);
    assert.ok(model.scenarios[id].savedWeeks >= 0);
  }
  assert.deepEqual(model.deadline.compressedScenarios, ['internal', 'vendor', 'hybrid']);
});
