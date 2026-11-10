import { createCaseState } from './calc.js';
import { applyParam } from './parseBrief.js';

const DEFAULTS = {
  integration: { type: 'Интеграция систем', integrations: 0, screens: 0, users: 100, deadlineWeeks: 10, effort: 360 },
  development: { type: 'Разработка ПО', integrations: 0, screens: 3, users: 100, deadlineWeeks: 10, effort: 360 },
  ai: { type: 'Искусственный интеллект', integrations: 0, screens: 0, users: 100, deadlineWeeks: 8, effort: 320 },
  mobile: { type: 'Мобильная разработка', integrations: 0, screens: 8, users: 100, deadlineWeeks: 12, effort: 600 },
  support: { type: 'Сопровождение', integrations: 0, screens: 0, users: 100, deadlineWeeks: 12, effort: 500 },
  default: { type: 'ИТ-инициатива', integrations: 0, screens: 2, users: 100, deadlineWeeks: 10, effort: 320 },
};

const typeKey = (value) => {
  const text = String(value ?? '').toLowerCase();
  if (/искусствен|нейросет|телеграм|telegram|чат-бот|чатбот|\bai\b/.test(text)) return 'ai';
  if (/сопровожд|поддержк|support/.test(text)) return 'support';
  if (/мобильн|mobile/.test(text)) return 'mobile';
  if (/интеграц|integration/.test(text)) return 'integration';
  if (/разработ|development|веб|web|приложен/.test(text)) return 'development';
  return 'default';
};

const paramsType = (params) => {
  const param = params.find((item) => item.id === 'work_type' || item.id === 'type');
  return param ? typeKey(param.value) : 'default';
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
  return state;
};
