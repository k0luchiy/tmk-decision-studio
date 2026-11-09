/** Design tokens for the TMK Decision Studio PDF report (`docs/04b_design.md`). */

import type { Estimate, Risk } from '@app/contract';

export const COLORS = {
  ink: '#111111',
  muted: '#6B6B6B',
  border: '#D6D6D6',
  borderStrong: '#9A9A9A',
  surface: '#F4F4F4',
  surfaceSunken: '#EDEDED',
  bandDark: '#1E1E1E',
  brand: '#EC6608',
  brandSoft: '#FCEADF',
  brandText: '#B4470A',
  good: '#2F6B4F',
  warn: '#D98E1F',
  bad: '#C0392B',
  info: '#2A5D8F',
  white: '#FFFFFF',
  seriesInhouse: '#0072B2',
  seriesContractor: '#D55E00',
  seriesHybrid: '#009E73',
} as const;

export const SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const PAGE = {
  margin: 50,
  headerTop: 42,
  contentTop: 64,
  footerLine: 46,
  footerText: 34,
  footerMeta: 22,
} as const;

export const TYPE = {
  micro: 7.5,
  label: 8,
  bodyS: 8.5,
  body: 9.5,
  h3: 11,
  h2: 13,
  h1: 20,
  metric: 22,
  metricLg: 30,
} as const;

/** Map an `Estimate.scenario` value to a human-readable Russian label. */
export function scenarioName(scenario: Estimate['scenario']): string {
  switch (scenario) {
    case 'inhouse':
      return 'Внутренняя команда';
    case 'contractor':
      return 'Подрядчик';
    case 'hybrid':
      return 'Гибрид';
    case 'peak':
      return 'Пиковая нагрузка';
  }
}

const moneyFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
const oneDecimal = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

export function num(value: number): string {
  return moneyFormat.format(Math.round(value));
}

export function money(value: number): string {
  return `${num(value)} ₽`;
}

/** Compact money for KPI cards: 4,65 млн ₽ / 930 тыс ₽. */
export function moneyShort(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${oneDecimal.format(value / 1_000_000)} млн ₽`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${num(value / 1_000)} тыс ₽`;
  }
  return money(value);
}

/** Millions without a currency suffix, for dense table cells. */
export function millions(value: number): string {
  return oneDecimal.format(value / 1_000_000);
}

export function hours(value: number): string {
  return `${num(value)} ч`;
}

export function weeks(value: number): string {
  return `${oneDecimal.format(value)} нед`;
}

export function pct(value: number): string {
  return `${Math.round(value * 100)} %`;
}

export function dateRu(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return iso;
  }
  return parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function confidenceLabel(level: Estimate['confidence']['level']): string {
  switch (level) {
    case 'high':
      return 'высокая';
    case 'medium':
      return 'средняя';
    case 'low':
      return 'низкая';
    case 'order_of_magnitude':
      return 'порядок величины';
  }
}

export function confidenceColor(level: Estimate['confidence']['level']): string {
  switch (level) {
    case 'high':
      return COLORS.good;
    case 'medium':
      return COLORS.warn;
    case 'low':
    case 'order_of_magnitude':
      return COLORS.bad;
  }
}

export interface RiskLevel {
  label: string;
  color: string;
}

/** RAG level for a risk, normalised against the implementation budget. */
export function riskLevel(risk: Risk, budget: number): RiskLevel {
  const exposure = risk.probability * risk.impactRub.mid;
  const share = budget > 0 ? exposure / budget : 0;
  if (share >= 0.04) {
    return { label: 'высокий', color: COLORS.bad };
  }
  if (share >= 0.015) {
    return { label: 'средний', color: COLORS.warn };
  }
  return { label: 'низкий', color: COLORS.good };
}

/** Cumulative TCO at a given year, extrapolating the run-rate when needed. */
export function cumulativeTco(estimate: Estimate, year: number): number | undefined {
  const exact = estimate.tco.find((row) => row.year === year);
  if (exact !== undefined) {
    return exact.cumulativeRub;
  }
  const sorted = [...estimate.tco].sort((a, b) => a.year - b.year);
  const last = sorted[sorted.length - 1];
  if (last === undefined || year < last.year) {
    return undefined;
  }
  const annual = sorted.find((row) => row.year >= 1)?.costRub ?? 0;
  return last.cumulativeRub + annual * (year - last.year);
}

/** Cost per hour: a compact comparability index for the scenario table. */
export function costIndex(estimate: Estimate): number {
  if (estimate.effort.p50Hours <= 0) {
    return 0;
  }
  return Math.round(estimate.cost.p50Rub / estimate.effort.p50Hours);
}

export const STAGE_NAMES: Record<number, string> = {
  1: 'Анализ и требования',
  2: 'Проектирование',
  3: 'Разработка',
  4: 'Тестирование',
  5: 'Внедрение',
  6: 'Приёмка и передача',
  7: 'Сопровождение',
};
