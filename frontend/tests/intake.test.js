import test from 'node:test';
import assert from 'node:assert/strict';
import { mapIntakeToParams } from '../src/core/api.js';

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

test('mapIntakeToParams tolerates an empty payload', () => {
  assert.deepEqual(mapIntakeToParams(), []);
  assert.deepEqual(mapIntakeToParams([]), []);
});
