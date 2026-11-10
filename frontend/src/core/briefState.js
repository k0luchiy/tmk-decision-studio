import { createCaseState } from './calc.js';
import { applyParam } from './parseBrief.js';
import { assignStageOwners, workTypeKey } from './stageOwners.js';

const DEFAULTS = {
  integration: { type: 'Интеграция систем', integrations: 0, screens: 0, users: 100, deadlineWeeks: 10, effort: 360 },
  development: { type: 'Разработка ПО', integrations: 0, screens: 3, users: 100, deadlineWeeks: 10, effort: 360 },
  ai: { type: 'Искусственный интеллект', integrations: 0, screens: 0, users: 100, deadlineWeeks: 8, effort: 320 },
  mobile: { type: 'Мобильная разработка', integrations: 0, screens: 8, users: 100, deadlineWeeks: 12, effort: 600 },
  mes: { type: 'MES / АСУ ТП', integrations: 4, screens: 0, users: 500, deadlineWeeks: 24, effort: 1600 },
  support: { type: 'Сопровождение', integrations: 0, screens: 0, users: 100, deadlineWeeks: 12, effort: 500 },
  default: { type: 'ИТ-инициатива', integrations: 0, screens: 2, users: 100, deadlineWeeks: 10, effort: 320 },
};

const paramsType = (params) => {
  const param = params.find((item) => item.id === 'work_type' || item.id === 'type');
  return param ? workTypeKey(param.value) : 'default';
};

const sumHours = (stages) => stages.reduce((acc, stage) => acc + (Number(stage.hours) || 0), 0);

export const createBriefState = (brief, params = []) => {
  const base = createCaseState('D1');
  const key = paramsType(params);
  const defaults = DEFAULTS[key] ?? DEFAULTS.default;

  let state = {
    ...base,
    caseId: 'D1',
    name: brief.trim().slice(0, 80) || 'Новая оценка',
    description: brief.trim(),
    ...defaults,
    hiring: false,
    reserve: 12,
    oversight: 10,
    hybridSplit: 58,
    confirmedParams: 0,
    rejectedParams: 0,
    ownersTouched: false,
    stages: base.stages.map((stage) => ({ ...stage })),
    extras: base.extras.map((item) => ({ ...item, internal: 0, external: 0, hybrid: 0 })),
  };

  state = params.filter((param) => !param.suggested).reduce(applyParam, state);

  let target = defaults.effort;
  if (key === 'integration') target = Math.max(target, (Number(state.integrations) || 0) * 120);
  if (key === 'development' || key === 'mobile') target = Math.max(target, (Number(state.screens) || 0) * 30);
  const factor = target / Math.max(1, sumHours(base.stages));

  state.stages = state.stages.map((stage) => ({
    ...stage,
    hours: Math.max(1, Math.round(stage.hours * factor)),
    external: Math.round(stage.external * factor),
    days: Math.max(1, Math.round(stage.days * factor)),
  }));
  state.stages = assignStageOwners(state.stages, state.type);
  return state;
};
