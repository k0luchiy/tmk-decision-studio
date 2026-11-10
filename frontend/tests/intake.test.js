import test from 'node:test';
import assert from 'node:assert/strict';
import { mapIntakeToParams } from '../src/core/api.js';
import { applyAutoParams, applyParam } from '../src/core/parseBrief.js';

const fixture = {
  status: 'jev-cache',
  params: [
    {
      key: 'work_type',
      value: 'integration',
      unit: '',
      confidence: 0.9,
      quote: 'Интеграция 1С:ERP с WMS',
      status: 'auto',
    },
    { key: 'flows', value: 6, unit: 'поток', confidence: 0.9, quote: '6 потоков' },
    { key: 'duration_weeks', value: 12, confidence: 0.6 },
    { key: 'security_kii', value: true, confidence: 0.3 },
    { key: 'unknown_key', value: 'x', confidence: 0.5 },
  ],
};

test('mapIntakeToParams maps backend keys to review rows', () => {
  const rows = mapIntakeToParams(fixture.params);

  assert.equal(rows.length, 5);
  assert.deepEqual(rows[0], {
    id: 'work_type',
    label: 'Тип работы',
    value: 'integration',
    source: 'Интеграция 1С:ERP с WMS',
    confidence: 'Высокая',
    status: 'pending',
    autoAccepted: false,
    suggested: false,
    policy: 'auto',
  });
  assert.equal(rows[1].label, 'Количество потоков');
  assert.equal(rows[1].value, '6');
  assert.equal(rows[1].confidence, 'Высокая');
  assert.equal(rows[2].label, 'Целевой срок');
  assert.equal(rows[2].source, 'Jev/правила');
  assert.equal(rows[2].confidence, 'Средняя');
  assert.equal(rows[3].label, 'Требования КИИ');
  assert.equal(rows[3].value, 'true');
  assert.equal(rows[3].confidence, 'Средняя');
  assert.equal(rows[4].label, 'unknown_key');
  assert.equal(rows[4].status, 'pending');
});

test('mapIntakeToParams marks auto-accepted values and Jev suggestions', () => {
  const rows = mapIntakeToParams([
    {
      key: 'work_type', value: 'support', source: 'rules', confidence: 0.85,
      status: 'auto', policy: 'auto', autoAccept: true,
    },
    {
      key: 'stage_owner_development', value: 'vendor', source: 'jev', probability: 0.91,
      status: 'auto', policy: 'suggest', autoAccept: false, suggested: true,
    },
  ]);

  assert.equal(rows[0].status, 'confirmed');
  assert.equal(rows[0].autoAccepted, true);
  assert.equal(rows[1].status, 'pending');
  assert.equal(rows[1].suggested, true);
  assert.equal(rows[1].label, 'Ответственный: разработка');
});

test('applyAutoParams applies only auto-accepted values', () => {
  const state = {
    type: 'ИТ-инициатива',
    integrations: 2,
    screens: 0,
    users: 0,
    complexity: 'medium',
    deadlineWeeks: 16,
    stages: [{ id: 'development', owner: 'internal', split: 80 }],
    extras: [],
  };
  const next = applyAutoParams(state, [
    { id: 'work_type', value: 'support', autoAccepted: true },
    { id: 'stage_owner_development', value: 'vendor', autoAccepted: false },
  ]);

  assert.equal(next.type, 'Сопровождение');
  assert.equal(next.stages[0].owner, 'internal');

  const confirmed = applyParam(next, {
    id: 'stage_owner_development',
    value: 'vendor',
    autoAccepted: false,
  });
  assert.equal(confirmed.stages[0].owner, 'vendor');
  assert.equal(confirmed.stages[0].split, 20);
});

test('mapIntakeToParams tolerates an empty payload', () => {
  assert.deepEqual(mapIntakeToParams(), []);
  assert.deepEqual(mapIntakeToParams([]), []);
});
