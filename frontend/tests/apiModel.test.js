import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModelFromApi, mapContractorStages, mapStateToRequest } from '../src/core/apiModel.js';
import { createCaseState } from '../src/core/calc.js';

const mock = JSON.parse(
  readFileSync(new URL('../../shared/contract/mock/d1.scenarios.json', import.meta.url), 'utf8'),
);
const [inhouse, contractor, hybrid] = mock;

const apiResponse = () => ({
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

test('mapStateToRequest sends confirmed params and options', () => {
  const state = createCaseState('D1');
  const request = mapStateToRequest(state);

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
  assert.equal(request.options.teamRate, state.teamRate);
  assert.equal(request.options.reservePct, state.reserve / 100);
  assert.equal(request.options.oversightPct, state.oversight / 100);
  assert.equal(request.options.stageHours['3'], 560);
  assert.deepEqual(request.options.contractorStages, [3]);
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
