import test from 'node:test';
import assert from 'node:assert/strict';
import { computeModel, createCaseState } from '../src/core/calc.js';
import { parseBrief } from '../src/core/parseBrief.js';

const closeTo = (a, b, tolerance = 0.02) => Math.abs(a - b) <= Math.abs(b) * tolerance;

test('D1 produces three scenarios with ordered P10/P50/P90 and a recommendation', () => {
  const model = computeModel(createCaseState('D1'));
  assert.equal(Object.keys(model.scenarios).length, 3);
  for (const scenario of Object.values(model.scenarios)) {
    assert.ok(scenario.p10 < scenario.p50);
    assert.ok(scenario.p50 < scenario.p90);
    assert.ok(scenario.weeks > 0);
    assert.ok(scenario.score >= 0 && scenario.score <= 100);
  }
  assert.equal(model.recommended, 'hybrid');
  assert.ok(model.confidence.score >= 50 && model.confidence.score <= 100);
});

test('D3 recommends the vendor for a mature 24/7 support scope', () => {
  const model = computeModel(createCaseState('D3'));
  assert.equal(model.recommended, 'vendor');
  assert.ok(model.scenarios.vendor.p50 < model.scenarios.internal.p50);
});

test('increasing internal role rates only increases the internal scenario', () => {
  const baseState = createCaseState('D1');
  const base = computeModel(baseState);
  const raised = computeModel({
    ...baseState,
    teamRate: baseState.teamRate + 1000,
    stages: baseState.stages.map((stage) => ({ ...stage, rate: Math.round(stage.rate * 1.24) })),
  });
  assert.ok(raised.scenarios.internal.p50 > base.scenarios.internal.p50);
  assert.ok(closeTo(raised.scenarios.vendor.p50, base.scenarios.vendor.p50, 0.0001));
});

test('increasing the reserve increases every scenario', () => {
  const baseState = createCaseState('D1');
  const base = computeModel(baseState);
  const raised = computeModel({ ...baseState, reserve: baseState.reserve + 8 });
  for (const id of ['internal', 'vendor', 'hybrid']) {
    assert.ok(raised.scenarios[id].p50 > base.scenarios[id].p50);
  }
});

test('changing hybrid responsibility changes the hybrid cost', () => {
  const baseState = createCaseState('D1');
  const base = computeModel(baseState);
  const shifted = computeModel({
    ...baseState,
    stages: baseState.stages.map((stage) => ({ ...stage, split: Math.min(100, stage.split + 20) })),
  });
  assert.notEqual(shifted.scenarios.hybrid.p50, base.scenarios.hybrid.p50);
});

test('a tighter deadline compresses duration and raises cost', () => {
  const baseState = createCaseState('D1');
  const base = computeModel(baseState);
  const tight = computeModel({ ...baseState, deadlineWeeks: Math.max(6, base.scenarios.internal.rawWeeks - 4) });
  assert.ok(tight.scenarios.internal.weeks < base.scenarios.internal.weeks);
  assert.ok(tight.scenarios.internal.p50 > base.scenarios.internal.p50);
});

test('rejected parameters reduce confidence', () => {
  const baseState = createCaseState('D1');
  const base = computeModel(baseState);
  const rejected = computeModel({ ...baseState, rejectedParams: 2 });
  assert.ok(rejected.confidence.score < base.confidence.score);
});

test('brief parsing extracts integrations and deadline', () => {
  const params = parseBrief('Нужна интеграция 1С с WMS, 3 потока обмена. Целевой срок 6 месяцев, 850 пользователей.');
  const integrations = params.find((param) => param.id === 'integrations');
  const deadline = params.find((param) => param.id === 'deadline');
  const users = params.find((param) => param.id === 'users');
  assert.equal(integrations?.value, '3');
  assert.ok(deadline?.value.includes('6'));
  assert.equal(users?.value, '850');
});
