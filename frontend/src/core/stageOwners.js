const OWNER_SPLIT = { internal: 80, split: 50, vendor: 20 };

const DEFAULT_MATRIX = {
  discovery: 'internal',
  design: 'split',
  development: 'vendor',
  integration: 'vendor',
  testing: 'internal',
  deployment: 'split',
  handover: 'internal',
};

const MATRIX = {
  integration: { ...DEFAULT_MATRIX, design: 'internal' },
  development: DEFAULT_MATRIX,
  ai: DEFAULT_MATRIX,
  mobile: DEFAULT_MATRIX,
  support: {
    discovery: 'internal',
    design: 'internal',
    development: 'internal',
    integration: 'internal',
    testing: 'internal',
    deployment: 'internal',
    handover: 'internal',
  },
  erp: { ...DEFAULT_MATRIX, design: 'internal' },
  migration: { ...DEFAULT_MATRIX, design: 'internal' },
  bi: DEFAULT_MATRIX,
  mes: DEFAULT_MATRIX,
  cv: DEFAULT_MATRIX,
  security: {
    ...DEFAULT_MATRIX,
    design: 'internal',
    development: 'split',
    integration: 'split',
    deployment: 'internal',
  },
  data: DEFAULT_MATRIX,
  default: { ...DEFAULT_MATRIX, design: 'internal' },
};

export const workTypeKey = (value) => {
  const text = String(value ?? '').toLowerCase();
  if (/искусствен|нейросет|телеграм|telegram|чат-бот|чатбот|\bai\b/.test(text)) return 'ai';
  if (/сопровожд|поддержк|support/.test(text)) return 'support';
  if (/мобильн|mobile/.test(text)) return 'mobile';
  if (/интеграц|integration/.test(text)) return 'integration';
  if (/миграц|migration/.test(text)) return 'migration';
  if (/erp|1с|1c/.test(text)) return 'erp';
  if (/bi|аналитик|dwh|данн/.test(text)) return 'bi';
  if (/mes|асутп/.test(text)) return 'mes';
  if (/vision|cv|компьютерн/.test(text)) return 'cv';
  if (/безопасн|security|кии/.test(text)) return 'security';
  if (/разработ|development|веб|web|приложен/.test(text)) return 'development';
  return 'default';
};

export const assignStageOwners = (stages, type) => {
  const matrix = MATRIX[workTypeKey(type)] ?? MATRIX.default;
  return stages.map((stage) => {
    const owner = matrix[stage.id] ?? 'split';
    return { ...stage, owner, split: OWNER_SPLIT[owner] };
  });
};
