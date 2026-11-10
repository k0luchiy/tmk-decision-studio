/** Thin HTTP helpers for datasets, HelpDesk import and intake. */

const API_BASE = import.meta.env?.VITE_API_URL ?? '';

const PARAM_LABELS = {
  work_type: 'Тип работы',
  flows: 'Количество потоков',
  screens: 'Экраны интерфейса',
  users: 'Пользователи',
  duration_weeks: 'Целевой срок',
  security_kii: 'Требования КИИ',
  mobile: 'Мобильный доступ',
  platform: 'Платформа',
  integrations_scale: 'Масштаб интеграций',
  complexity: 'Сложность',
  has_scope_numbers: 'Числовые параметры объёма',
  greenfield: 'Проект с нуля',
  stage_owner_discovery: 'Ответственный: аналитика',
  stage_owner_design: 'Ответственный: проектирование',
  stage_owner_development: 'Ответственный: разработка',
  stage_owner_integration: 'Ответственный: интеграции',
  stage_owner_testing: 'Ответственный: тестирование',
  stage_owner_deployment: 'Ответственный: внедрение',
  stage_owner_handover: 'Ответственный: приёмка',
};

const AUTO_KEYS = new Set([
  'work_type', 'platform', 'security_kii', 'mobile', 'has_integrations',
  'integrations_scale', 'complexity', 'greenfield', 'has_scope_numbers',
]);

const paramPolicy = (param) => {
  if (param.policy === 'auto' || param.policy === 'suggest' || param.policy === 'manual') {
    return param.policy;
  }
  if (String(param.key).startsWith('stage_owner_')) return 'suggest';
  return AUTO_KEYS.has(param.key) ? 'auto' : 'manual';
};

const isAutoAccepted = (param) => {
  if (typeof param.autoAccept === 'boolean') return param.autoAccept;
  const policy = paramPolicy(param);
  if (policy !== 'auto' || param.conflictGroup !== undefined) return false;
  const confidence = param.probability ?? param.confidence ?? 0;
  return (param.source === 'rules' || param.source === 'jev') && confidence >= 0.75;
};

export class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    Object.assign(this, { name: 'ApiError', code, details });
  }
}

async function apiErrorFrom(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const error = payload?.error ?? {};
  return new ApiError(
    error.code ?? `http_${response.status}`,
    error.message ?? `HTTP ${response.status}`,
    error.details,
  );
}

async function readJson(response) {
  if (!response.ok) throw await apiErrorFrom(response);
  return response.json();
}

export function fetchDatasets() {
  return fetch(`${API_BASE}/api/datasets`).then(readJson);
}

export function importHelpdesk(file) {
  const form = new FormData();
  form.append('file', file, file.name);
  return fetch(`${API_BASE}/api/import/helpdesk`, { method: 'POST', body: form }).then(readJson);
}

export function fetchIntake(brief, mode = import.meta.env?.VITE_INTAKE_MODE ?? 'cache') {
  return fetch(`${API_BASE}/api/intake`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, mode }),
  }).then(readJson);
}

export function fetchEstimates() {
  return fetch(`${API_BASE}/api/estimates`).then(readJson);
}

export function fetchEstimate(id) {
  return fetch(`${API_BASE}/api/estimates/${encodeURIComponent(id)}`).then(readJson);
}

export function confirmIntake(params) {
  const payload = params.map((param) => ({
    key: param.id ?? param.key,
    value: param.value,
    status: 'confirmed',
  }));
  return fetch(`${API_BASE}/api/intake/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ params: payload }),
  }).then(readJson);
}

const confidenceLabel = (value) => (Number(value) >= 0.75 ? 'Высокая' : 'Средняя');

/**
 * Backend intake params → review-table rows. `id` stays the backend key, so
 * `applyParam` can reconcile values back into the local state.
 */
export function mapIntakeToParams(apiParams = []) {
  return apiParams.map((param) => {
    const policy = paramPolicy(param);
    const autoAccepted = isAutoAccepted(param);
    const source = param.quote ?? (param.source === 'jev' ? 'Jev' : param.source === 'rules' ? 'Правила' : 'Jev/правила');
    return {
      id: param.key,
      label: PARAM_LABELS[param.key] ?? param.key,
      value: String(param.value),
      source,
      confidence: confidenceLabel(param.probability ?? param.confidence),
      status: autoAccepted ? 'confirmed' : 'pending',
      autoAccepted,
      suggested: policy === 'suggest',
      policy,
    };
  });
}
