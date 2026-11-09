/** Maps the legacy UI `state` onto a `POST /api/estimates` request body. */

const STAGE_NUMBER = {
  discovery: 1,
  design: 2,
  development: 3,
  integration: 3,
  testing: 4,
  deployment: 5,
  handover: 6,
};
const MAX_EXTRAS = 20;
const EXTRA_TARGETS = [
  ['internal', 'inhouse', 'команда'],
  ['external', 'contractor', 'подрядчик'],
  ['hybrid', 'hybrid', 'гибрид'],
];

const workTypeFor = (type) => {
  const text = String(type ?? '').toLowerCase();
  if (/интеграц/.test(text)) return 'integration';
  if (/vision|cv|дефект/.test(text)) return 'cv';
  if (/сопровожд|поддержк|sla/.test(text)) return 'support';
  if (/разработ|мобильн/.test(text)) return 'development';
  return 'default';
};

const confirmedParam = (key, value) => ({
  key,
  value,
  status: 'confirmed',
  defaultUsed: false,
  unit: '',
  confidence: 1,
});

export function mapStageHours(stages = []) {
  const hours = {};
  stages.forEach((stage) => {
    const number = STAGE_NUMBER[stage.id];
    const value = Number(stage.hours) || 0;
    if (number !== undefined && value > 0) hours[number] = (hours[number] || 0) + value;
  });
  return hours;
}

export function mapContractorStages(stages = []) {
  const numbers = new Set();
  stages.forEach((stage) => {
    const split = Number(stage.split ?? 50);
    if ((stage.owner === 'vendor' || split <= 35) && STAGE_NUMBER[stage.id] !== undefined) {
      numbers.add(STAGE_NUMBER[stage.id]);
    }
  });
  const result = [...numbers].sort((a, b) => a - b);
  return result.length ? result : [3];
}

/** Hours-weighted average rate when stage rates differ; otherwise the team rate. */
export function weightedTeamRate(state) {
  const stages = state.stages ?? [];
  const totalHours = stages.reduce((acc, stage) => acc + (Number(stage.hours) || 0), 0);
  const distinct = new Set(stages.map((stage) => Number(stage.rate) || 0));
  if (distinct.size <= 1 || totalHours <= 0) return state.teamRate;
  const weighted = stages.reduce(
    (acc, stage) => acc + (Number(stage.hours) || 0) * (Number(stage.rate) || 0),
    0,
  );
  return Math.round(weighted / totalHours);
}

/** Extra articles as per-scenario cost lines; zeros are skipped, at most 20. */
export function mapExtras(extras = []) {
  const records = [];
  extras.forEach((extra) => {
    EXTRA_TARGETS.forEach(([field, appliesTo, suffix]) => {
      const amountRub = Number(extra[field]) || 0;
      if (amountRub > 0 && records.length < MAX_EXTRAS) {
        records.push({ label: `${extra.name} (${suffix})`, amountRub, appliesTo });
      }
    });
  });
  return records;
}

export function mapStateToRequest(state) {
  return {
    params: [
      confirmedParam('work_type', workTypeFor(state.type)),
      confirmedParam('flows', state.integrations),
      confirmedParam('screens', state.screens),
      confirmedParam('users', state.users),
      confirmedParam('duration_weeks', state.deadlineWeeks),
    ],
    options: {
      hiring: state.hiring,
      utilization: 0.7,
      model: state.contractType === 'fixed' ? 'fixed_price' : 't_and_m',
      vat: false,
      teamRate: weightedTeamRate(state),
      reservePct: (Number(state.reserve) || 0) / 100,
      oversightPct: (Number(state.oversight) || 0) / 100,
      contractorStages: mapContractorStages(state.stages),
      stageHours: mapStageHours(state.stages),
      targetWeeks: state.deadlineWeeks,
      extras: mapExtras(state.extras),
    },
  };
}
