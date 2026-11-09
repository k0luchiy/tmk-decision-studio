/** Adapter: backend estimate API ↔ legacy `computeModel` model shape. */
import { BASE_STAGES, CASES } from '../data/cases.js';
const API_BASE = import.meta.env?.VITE_API_URL ?? '';
const SCENARIO_MAP = { internal: 'inhouse', vendor: 'contractor', hybrid: 'hybrid' };
const SCENARIO_IDS = ['internal', 'vendor', 'hybrid'];
const STAGE_NUMBER = { discovery: 1, design: 2, development: 3, integration: 3, testing: 4, deployment: 5, handover: 6 };
const STAGE_RATIO = { development: 0.7, integration: 0.3 };
const SCORE_CONSTANTS = { internal: { risk: 76, flexibility: 76 }, vendor: { risk: 58, flexibility: 72 }, hybrid: { risk: 89, flexibility: 90 } };
const GROUP_LABELS = {
  labor: 'Работы и услуги', overhead: 'Накладные', hiring: 'Найм и ramp-up', rampup: 'Ramp-up',
  bench: 'Резерв простоя (bench)', coordination: 'Координация и приёмка', risk: 'Риск-премия',
  vat: 'НДС', extra: 'Дополнительные статьи', support: 'Сопровождение', turnover: 'Текучесть',
};
const CONFIDENCE_COMPONENTS = [
  { id: 'brief', key: 'brief', label: 'Полнота брифа', weight: 0.3 },
  { id: 'data', key: 'data', label: 'Качество данных', weight: 0.25 },
  { id: 'analog', key: 'analogues', label: 'Рыночные аналоги', weight: 0.25 },
  { id: 'method', key: 'methods', label: 'Согласие методов', weight: 0.2 },
];
export class ApiError extends Error {
  constructor(code, message, details) { super(message); Object.assign(this, { name: 'ApiError', code, details }); }
}
const round1 = (value) => Math.round(value * 10) / 10;
const round3 = (value) => Math.round(value) / 1000;
const sum = (list, pick) => list.reduce((acc, item) => acc + (Number(pick(item)) || 0), 0);
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return !sorted.length ? 0 : sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};
const workTypeFor = (type) => {
  const text = String(type ?? '').toLowerCase();
  if (/интеграц/.test(text)) return 'integration';
  if (/vision|cv|дефект/.test(text)) return 'cv';
  if (/сопровожд|поддержк|sla/.test(text)) return 'support';
  if (/разработ|мобильн/.test(text)) return 'development';
  return 'default';
};
const confirmedParam = (key, value) => ({ key, value, status: 'confirmed', defaultUsed: false, unit: '', confidence: 1 });
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
    if ((stage.owner === 'vendor' || split <= 35) && STAGE_NUMBER[stage.id] !== undefined) numbers.add(STAGE_NUMBER[stage.id]);
  });
  const result = [...numbers].sort((a, b) => a - b);
  return result.length ? result : [3];
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
      hiring: state.hiring, utilization: 0.7, model: state.contractType === 'fixed' ? 'fixed_price' : 't_and_m',
      vat: false, teamRate: state.teamRate, reservePct: (Number(state.reserve) || 0) / 100,
      oversightPct: (Number(state.oversight) || 0) / 100,
      contractorStages: mapContractorStages(state.stages), stageHours: mapStageHours(state.stages),
    },
  };
}
async function apiErrorFrom(response) {
  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const error = payload?.error ?? {};
  return new ApiError(error.code ?? `http_${response.status}`, error.message ?? `HTTP ${response.status}`, error.details);
}
export async function fetchApiModel(state, { signal, seed = 42 } = {}) {
  const response = await fetch(`${API_BASE}/api/estimates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...mapStateToRequest(state), seed }),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw await apiErrorFrom(response);
  return response.json();
}
export async function exportApiEstimate(id, format) {
  const response = await fetch(`${API_BASE}/api/estimates/${encodeURIComponent(id)}/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format }),
  });
  if (!response.ok) throw await apiErrorFrom(response);
  const disposition = response.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1].replaceAll('"', '')) : `${id}.${format}`;
  return { blob: await response.blob(), filename };
}
function buildConfidence(response) {
  const byKey = new Map((response.confidence?.components ?? []).map((item) => [item.key, item]));
  const components = CONFIDENCE_COMPONENTS.map((item) => {
    const raw = Number(byKey.get(item.key)?.value) || 0;
    return { id: item.id, label: item.label, weight: item.weight, value: Math.round(raw <= 1 ? raw * 100 : raw) };
  });
  return { score: Math.round(components.reduce((acc, item) => acc + item.value * item.weight, 0)), components };
}
function supportFor(estimate) {
  const rows = new Map((estimate.tco ?? []).map((row) => [row.year, row]));
  const first = rows.get(0);
  const third = rows.get(3);
  return first && third ? (third.cumulativeRub - first.cumulativeRub) / 36 : 0;
}
function tcoFor(estimate, year, supportMonthly) {
  const row = (estimate.tco ?? []).find((item) => item.year === year);
  return row ? row.cumulativeRub : estimate.cost.p50Rub + supportMonthly * 12 * year;
}
function groupLines(lines = []) {
  const totals = new Map();
  lines.forEach((line) => totals.set(line.group, (totals.get(line.group) || 0) + (Number(line.valueRub) || 0)));
  return Object.keys(GROUP_LABELS).filter((group) => totals.has(group)).map((group) => ({ label: GROUP_LABELS[group], value: totals.get(group) }));
}
function buildStageRows(response, state) {
  const byStage = new Map((response.effortGrid?.byStage ?? []).map((row) => [row.stage, row.hours]));
  const totalHours = Number(response.effortGrid?.totalHours) || sum([...byStage.values()], (value) => value);
  const contractor = response.estimates.contractor;
  const rows = BASE_STAGES.map((stage) => {
    const hours = (byStage.get(STAGE_NUMBER[stage.id]) || 0) * (STAGE_RATIO[stage.id] ?? 1);
    const share = totalHours > 0 ? hours / totalHours : 0;
    const external = contractor.cost.p50Rub * share;
    const stateStage = (state.stages ?? []).find((item) => item.id === stage.id) ?? {};
    const split = Number(stateStage.split ?? 50);
    const owner = stateStage.owner ?? (split >= 65 ? 'internal' : split <= 35 ? 'vendor' : 'split');
    const internalCost = hours * stage.rate;
    return { ...stage, hours, rate: stage.rate, external, days: round1(share * contractor.duration.p50Weeks * 5),
      split, owner, internalCost, hybridCost: internalCost * (split / 100) + external * (1 - split / 100), effort: hours };
  });
  return { rows, stageDays: sum(rows, (row) => row.days) };
}
export function buildModelFromApi(response, state) {
  const inhouse = response.estimates.inhouse;
  const base = {};
  SCENARIO_IDS.forEach((id) => {
    const estimate = response.estimates[SCENARIO_MAP[id]];
    base[id] = { estimate, supportMonthly: supportFor(estimate), cost: estimate.cost.p50Rub,
      p10: estimate.cost.p10Rub, p50: estimate.cost.p50Rub, p90: estimate.cost.p90Rub, weeks: estimate.duration.p50Weeks };
  });
  const minCost = Math.min(...SCENARIO_IDS.map((id) => base[id].cost));
  const minWeeks = Math.min(...SCENARIO_IDS.map((id) => base[id].weeks));
  const scores = SCENARIO_IDS.map((id) => {
    const costScore = base[id].cost > 0 ? (minCost / base[id].cost) * 100 : 0;
    const timeScore = base[id].weeks > 0 ? (minWeeks / base[id].weeks) * 100 : 0;
    const { risk, flexibility } = SCORE_CONSTANTS[id];
    const total = round1(costScore * 0.45 + timeScore * 0.25 + risk * 0.2 + flexibility * 0.1);
    return { id, total, parts: { cost: round1(costScore), time: round1(timeScore), risk, flexibility } };
  });
  const scenarios = {};
  SCENARIO_IDS.forEach((id) => {
    const item = base[id];
    const score = scores.find((entry) => entry.id === id);
    scenarios[id] = {
      id, cost: item.cost, p10: item.p10, p50: item.p50, p90: item.p90, weeks: item.weeks, rawWeeks: item.weeks,
      compressed: false, compressionMultiplier: 1, savedWeeks: 0, supportMonthly: item.supportMonthly,
      tco1: tcoFor(item.estimate, 1, item.supportMonthly), tco3: tcoFor(item.estimate, 3, item.supportMonthly),
      tco5: tcoFor(item.estimate, 5, item.supportMonthly),
      score: score.total, scoreParts: score.parts, lines: groupLines(item.estimate.cost.lines),
    };
  });
  const code = response.verdict?.code ?? 'hybrid';
  const recommended = code === 'inhouse' ? 'internal' : code === 'contractor' ? 'vendor' : 'hybrid';
  const confidence = buildConfidence(response);
  const risks = (inhouse.risks ?? []).map((risk) => ({
    name: risk.label, probability: risk.probability, impact: risk.impactRub.mid,
    expected: risk.expectedRub ?? risk.probability * risk.impactRub.mid, note: risk.mitigation,
  }));
  const assumptions = (inhouse.assumptions ?? []).map((item) => ({
    name: item.label, value: `${item.value}${item.unit ?? ''}`, range: `${item.range.low}–${item.range.high}`,
    source: item.sourceId ?? 'допущение', sensitivity: item.pinned ? 'Низкая' : 'Средняя',
  }));
  const analogues = inhouse.analogues ?? [];
  const analogs = analogues.map((analog) => {
    const price = analog.price?.mid ?? 0;
    const normalized = analog.normalizedPriceRub ?? 0;
    return { name: analog.title, year: analog.year, price, normalized, coeff: price ? normalized / price : 0, source: analog.sourceId, date: String(analog.year) };
  });
  const analogMedian = median(analogues.map((analog) => Number(analog.normalizedPriceRub)).filter(Number.isFinite));
  const { rows: stageRows, stageDays } = buildStageRows(response, state);
  const srcCase = CASES[state.caseId] ?? {};
  const meta = {
    ...srcCase, ...state, id: state.caseId, name: state.name ?? srcCase.name, type: state.type ?? srcCase.type,
    shortName: srcCase.shortName ?? state.name, description: state.description ?? srcCase.description,
    assumptions, analogs, risks,
    supportMonthly: { internal: scenarios.internal.supportMonthly, vendor: scenarios.vendor.supportMonthly, hybrid: scenarios.hybrid.supportMonthly },
    scores: SCORE_CONSTANTS, confidence: Object.fromEntries(confidence.components.map((item) => [item.id, item.value])),
  };
  const implMonths = (weeks) => Math.max(0.5, weeks / 4.345);
  const breakEvenSeries = Array.from({ length: 37 }, (_, month) => {
    const point = { month };
    SCENARIO_IDS.forEach((id) => {
      const months = implMonths(scenarios[id].weeks);
      const upfront = scenarios[id].cost * Math.min(1, month / months);
      point[id] = round3((upfront + scenarios[id].supportMonthly * Math.max(0, month - months)) / 1000);
    });
    return point;
  });
  const tcoSeries = Array.from({ length: 6 }, (_, year) => ({
    year, label: year === 0 ? 'Старт' : `${year} г.`,
    internal: round3((scenarios.internal.cost + scenarios.internal.supportMonthly * 12 * year) / 1000),
    vendor: round3((scenarios.vendor.cost + scenarios.vendor.supportMonthly * 12 * year) / 1000),
    hybrid: round3((scenarios.hybrid.cost + scenarios.hybrid.supportMonthly * 12 * year) / 1000),
  }));
  const baseCost = scenarios[recommended].p50;
  const reserve = (Number(state.reserve) || 0) / 100;
  const sensitivity = [
    { name: 'Ставка внутренней команды', low: -0.18, high: 0.22 },
    { name: 'Стоимость подрядчика', low: -0.16, high: 0.24 },
    { name: 'Объём работ (часы)', low: -0.14, high: 0.18 },
    { name: 'Резерв на риск', low: -Math.min(0.2, reserve), high: 0.1 },
    { name: 'Сжатие срока', low: -0.04, high: 0.2 },
  ].map((factor) => ({ ...factor, lowValue: baseCost * (1 + factor.low), highValue: baseCost * (1 + factor.high) }));
  const rec = scenarios[recommended];
  const sigma = Math.max(1, (rec.p90 - rec.p10) / 2.563);
  const min = rec.p10 * 0.96;
  const max = rec.p90 * 1.04;
  const distribution = Array.from({ length: 11 }, (_, index) => {
    const x = min + ((max - min) * index) / 10;
    return { value: x, label: (x / 1_000_000).toFixed(1).replace('.', ','),
      count: Math.round(Math.exp(-0.5 * ((x - rec.p50) / sigma) ** 2) * 100 + (index === 0 ? 2 : 0)) };
  });
  const warnings = (inhouse.warnings ?? []).map((warning) => ({
    tone: warning.severity === 'error' ? 'bad' : warning.severity === 'warning' ? 'warn' : 'info',
    title: warning.code ?? 'Предупреждение', text: warning.message ?? '',
  }));
  return {
    meta, state, k: 1, effort: Number(response.effortGrid?.totalHours) || 0,
    effortRange: { p10: Number(response.effortGrid?.p10Hours) || 0, p90: Number(response.effortGrid?.p90Hours) || 0 },
    stageRows, stageDays, scenarios, recommended, ranking: [...scores].sort((a, b) => b.total - a.total), scores, confidence,
    analogMedian, methodDiff: 0, breakEven: inhouse.breakevenMonth ?? null, breakEvenSeries, tcoSeries, sensitivity, distribution,
    risks, risksTotal: sum(risks, (risk) => risk.expected), warnings, pending: 0,
    rawWeeks: { internal: scenarios.internal.rawWeeks, vendor: scenarios.vendor.rawWeeks, hybrid: scenarios.hybrid.rawWeeks },
    deadline: { weeks: Number(state.deadlineWeeks) || 0, compressedScenarios: [] }, estimateId: response.id, api: true,
  };
}
