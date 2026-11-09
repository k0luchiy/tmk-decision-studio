export const fmtNumber = (value) =>
  new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(Math.round(Number(value) || 0));

export const fmtMoney = (value) => {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(2).replace('.', ',')} млн ₽`;
  }
  if (Math.abs(n) >= 1_000) {
    return `${fmtNumber(n / 1_000)} тыс. ₽`;
  }
  return `${fmtNumber(n)} ₽`;
};

export const fmtMoneyExact = (value) => `${fmtNumber(value)} ₽`;

export const fmtMoneyRange = (low, high) => {
  const a = Number(low) || 0;
  const b = Number(high) || 0;
  if (a >= 1_000_000 && b >= 1_000_000) {
    return `${(a / 1_000_000).toFixed(2).replace('.', ',')}–${(b / 1_000_000).toFixed(2).replace('.', ',')} млн ₽`;
  }
  return `${fmtMoney(a)} — ${fmtMoney(b)}`;
};

export const fmtHours = (value) => `${fmtNumber(value)} ч`;

export const fmtWeeks = (value) => {
  const n = Number(value) || 0;
  return `${n.toFixed(n % 1 ? 1 : 0).replace('.', ',')} нед.`;
};

export const fmtMonths = (value) => {
  const n = (Number(value) || 0) / 4.345;
  return `${n.toFixed(1).replace('.', ',')} мес.`;
};

export const fmtPercent = (value, digits = 0) =>
  `${(Number(value) || 0).toFixed(digits).replace('.', ',')}%`;

export const fmtDelta = (value) => {
  const n = Number(value) || 0;
  const sign = n > 0 ? '+' : n < 0 ? '−' : '';
  return `${sign}${Math.abs(n).toFixed(1).replace('.', ',')}%`;
};

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const weeksToUnit = (weeks, unit) => {
  if (unit === 'days') return weeks * 5;
  if (unit === 'months') return weeks / 4.345;
  return weeks;
};

export const unitToWeeks = (value, unit) => {
  if (unit === 'days') return value / 5;
  if (unit === 'months') return value * 4.345;
  return value;
};

export const unitLabel = (unit) => {
  if (unit === 'days') return 'дн.';
  if (unit === 'months') return 'мес.';
  return 'нед.';
};

export const plural = (n, one, few, many) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};
