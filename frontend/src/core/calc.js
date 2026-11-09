import { CASES, BASE_STAGES, BASE_EXTRAS, CONFIDENCE_WEIGHTS, DECISION_WEIGHTS } from '../data/cases.js';
import { clamp, fmtMoney } from './format.js';

export const COMPLEXITY = {
  low: { label: 'Низкая', k: 0.88 },
  medium: { label: 'Средняя', k: 1 },
  high: { label: 'Высокая', k: 1.22 },
};

export const createCaseState = (caseId = 'D1') => {
  const source = CASES[caseId] || CASES.D1;
  return {
    caseId: source.id,
    name: source.name,
    type: source.type,
    description: source.description,
    complexity: source.complexity,
    integrations: source.integrations,
    screens: source.screens,
    users: source.users,
    deadlineWeeks: source.deadlineWeeks,
    teamRate: source.teamRate,
    reserve: source.reserve,
    hiring: source.hiring,
    contractType: source.contractType,
    oversight: source.oversight,
    hybridSplit: source.hybridSplit,
    stages: source.stages.map((stage) => ({ ...stage })),
    extras: source.extras.map((item) => ({ ...item })),
    confirmedParams: 3,
    rejectedParams: 0,
  };
};

const complexityKey = (value) => (COMPLEXITY[value] ? COMPLEXITY[value].k : 1);

const sum = (list, key) => list.reduce((acc, item) => acc + (Number(item[key]) || 0), 0);

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const pRange = (value, low, high) => ({ p10: value * low, p50: value, p90: value * high });

const compressionFor = (weeks, deadlineWeeks) => {
  if (!deadlineWeeks || deadlineWeeks >= weeks) return { weeks, multiplier: 1, compressed: false, savedWeeks: 0 };
  const ratio = (weeks - deadlineWeeks) / weeks;
  return {
    weeks: deadlineWeeks,
    multiplier: 1 + ratio * 1.1,
    compressed: true,
    savedWeeks: weeks - deadlineWeeks,
  };
};

export const computeModel = (state, options = {}) => {
  const meta = CASES[state.caseId] || CASES.D1;
  const k = complexityKey(state.complexity);
  const reserve = Math.max(0, Number(state.reserve) || 0) / 100;
  const teamRate = Math.max(0, Number(state.teamRate) || 0);
  const oversight = Math.max(0, Number(state.oversight) || 0) / 100;
  const fixedPremium = state.contractType === 'fixed' ? 1.15 : 1;
  const splitAvg =
    state.stages.reduce((acc, stage) => acc + (Number(stage.split) || 0), 0) / Math.max(1, state.stages.length) / 100;

  const stageRows = state.stages.map((stage) => {
    const hours = Math.max(0, Number(stage.hours) || 0);
    const rate = Math.max(0, Number(stage.rate) || teamRate);
    const external = Math.max(0, Number(stage.external) || 0);
    const days = Math.max(1, Number(stage.days) || 1);
    const split = clamp(Number(stage.split ?? 50), 0, 100) / 100;
    const internalCost = hours * rate;
    const hybridCost = internalCost * split + external * (1 - split);
    return {
      ...stage,
      hours,
      rate,
      external,
      days,
      split: Math.round(split * 100),
      internalCost,
      hybridCost,
      effort: hours,
    };
  });

  const effort = sum(stageRows, 'hours');
  const stageDays = sum(stageRows, 'days');
  const internalStageCost = sum(stageRows, 'internalCost');
  const vendorStageCost = sum(stageRows, 'external');
  const hybridStageCost = sum(stageRows, 'hybridCost');

  const extrasInternal = sum(state.extras, 'internal');
  const extrasExternal = sum(state.extras, 'external');
  const extrasHybrid = sum(state.extras, 'hybrid');

  const hiringCost = state.hiring ? 420000 : 0;
  const benchCost = internalStageCost * 0.06;
  const coordinationCost = hybridStageCost * 0.035;
  const hybridHiring = state.hiring ? hiringCost * splitAvg * 0.5 : 0;
  const tenderCost = 180000;

  const internalPre = (internalStageCost + extrasInternal + hiringCost + benchCost) * k;
  const vendorPre = (vendorStageCost + extrasExternal + tenderCost) * (1 + oversight) * fixedPremium * k;
  const hybridPre = (hybridStageCost + extrasHybrid + hybridHiring + coordinationCost) * k;

  const internalBaseCost = internalPre * (1 + reserve);
  const vendorBaseCost = vendorPre * (1 + reserve);
  const hybridBaseCost = hybridPre * (1 + reserve);

  const rawWeeks = {
    internal: Math.round((stageDays * 0.62) / 5 + (state.hiring ? 2 : 0) + 1),
    vendor: Math.round((stageDays * 0.52) / 5 + 1),
    hybrid: Math.round((stageDays * 0.57) / 5 + 1),
  };

  const comp = {
    internal: compressionFor(rawWeeks.internal, Number(state.deadlineWeeks) || 0),
    vendor: compressionFor(rawWeeks.vendor, Number(state.deadlineWeeks) || 0),
    hybrid: compressionFor(rawWeeks.hybrid, Number(state.deadlineWeeks) || 0),
  };

  const costs = {
    internal: internalBaseCost * comp.internal.multiplier,
    vendor: vendorBaseCost * comp.vendor.multiplier,
    hybrid: hybridBaseCost * comp.hybrid.multiplier,
  };

  const pRanges = {
    internal: pRange(costs.internal, 0.9, 1.18),
    vendor: pRange(costs.vendor, 0.92, 1.25),
    hybrid: pRange(costs.hybrid, 0.91, 1.12),
  };

  const support = meta.supportMonthly || { internal: 80000, vendor: 160000, hybrid: 110000 };

  const tco = (id, months) => costs[id] + (support[id] || 0) * months;

  const scoresFor = () => {
    const minCost = Math.min(costs.internal, costs.vendor, costs.hybrid);
    const minWeeks = Math.min(comp.internal.weeks, comp.vendor.weeks, comp.hybrid.weeks);
    return ['internal', 'vendor', 'hybrid'].map((id) => {
      const costScore = (minCost / costs[id]) * 100;
      const timeScore = (minWeeks / comp[id].weeks) * 100;
      const riskScore = meta.scores[id].risk;
      const flexibilityScore = meta.scores[id].flexibility;
      const total =
        costScore * DECISION_WEIGHTS[0].weight +
        timeScore * DECISION_WEIGHTS[1].weight +
        riskScore * DECISION_WEIGHTS[2].weight +
        flexibilityScore * DECISION_WEIGHTS[3].weight;
      return {
        id,
        total: Math.round(total * 10) / 10,
        parts: {
          cost: Math.round(costScore * 10) / 10,
          time: Math.round(timeScore * 10) / 10,
          risk: riskScore,
          flexibility: flexibilityScore,
        },
      };
    });
  };

  const scored = scoresFor();
  const ranking = [...scored].sort((a, b) => b.total - a.total);
  const recommended = ranking[0].id;

  const lineItems = (id) => {
    const rows = {};
    stageRows.forEach((stage) => {
      rows['Работы и услуги'] = (rows['Работы и услуги'] || 0) + (id === 'internal' ? stage.internalCost : id === 'vendor' ? stage.external : stage.hybridCost);
    });
    state.extras.forEach((item) => {
      const key = item.kind || 'Прочие затраты';
      rows[key] = (rows[key] || 0) + (Number(item[id]) || 0);
    });
    if (id === 'internal') {
      if (hiringCost) rows['Найм и ramp-up'] = hiringCost;
      if (benchCost) rows['Резерв простоя (bench)'] = benchCost;
    }
    if (id === 'vendor') {
      rows['Тендер и контрактация'] = tenderCost;
      rows['Надзор и приёмка'] = (vendorStageCost + extrasExternal + tenderCost) * oversight;
      if (fixedPremium > 1) rows['Риск-премия Fixed Price'] = (vendorStageCost + extrasExternal + tenderCost) * (1 + oversight) * (fixedPremium - 1);
    }
    if (id === 'hybrid') {
      if (hybridHiring) rows['Найм (доля ТМК)'] = hybridHiring;
      rows['Координация гибрида'] = coordinationCost;
    }
    const rawTotal = Object.values(rows).reduce((a, b) => a + b, 0);
    const adjustment = costs[id] - rawTotal;
    if (Math.abs(adjustment) > 1) rows['Коэффициенты и резерв'] = adjustment;
    return Object.entries(rows).map(([label, value]) => ({ label, value }));
  };

  const effortRange = { p10: effort * 0.9, p50: effort, p90: effort * 1.12 };

  const scenario = (id) => ({
    id,
    cost: costs[id],
    ...pRanges[id],
    weeks: comp[id].weeks,
    rawWeeks: rawWeeks[id],
    compressed: comp[id].compressed,
    savedWeeks: comp[id].savedWeeks,
    compressionMultiplier: comp[id].multiplier,
    supportMonthly: support[id],
    tco1: tco(id, 12),
    tco3: tco(id, 36),
    tco5: tco(id, 60),
    score: scored.find((s) => s.id === id).total,
    scoreParts: scored.find((s) => s.id === id).parts,
    lines: lineItems(id),
  });

  const scenarios = {
    internal: scenario('internal'),
    vendor: scenario('vendor'),
    hybrid: scenario('hybrid'),
  };

  const analogMedian = median(meta.analogs.map((a) => a.normalized));
  const methodDiff = analogMedian ? Math.abs(vendorBaseCost - analogMedian) / analogMedian : 0;

  const pending = Math.max(0, 4 - (Number(state.confirmedParams) || 0)) + (Number(state.rejectedParams) || 0);
  const briefCompleteness = clamp(
    meta.confidence.brief + ((state.description || '').length - meta.description.length) * 0.03 - pending * 2.5,
    25,
    98
  );
  const dataQuality = clamp(meta.confidence.data - pending * 3, 20, 98);
  const analogScore = meta.confidence.analog;
  const methodAgreement = clamp(95 - methodDiff * 250, 40, 96);
  const confidenceComponents = CONFIDENCE_WEIGHTS.map((item) => {
    const value =
      item.id === 'brief'
        ? briefCompleteness
        : item.id === 'data'
          ? dataQuality
          : item.id === 'analog'
            ? analogScore
            : methodAgreement;
    return { ...item, value: Math.round(value) };
  });
  const confidenceScore = Math.round(
    confidenceComponents.reduce((acc, item) => acc + item.value * item.weight, 0)
  );

  const implMonths = (weeks) => Math.max(0.5, weeks / 4.345);
  const breakEvenSeries = Array.from({ length: 37 }, (_, month) => {
    const point = { month };
    ['internal', 'vendor', 'hybrid'].forEach((id) => {
      const months = implMonths(scenarios[id].weeks);
      const upfront = scenarios[id].cost * Math.min(1, month / months);
      const supportCost = scenarios[id].supportMonthly * Math.max(0, month - months);
      point[id] = Math.round((upfront + supportCost) / 1000) / 1000;
    });
    return point;
  });

  let breakEven = null;
  for (let i = 1; i < breakEvenSeries.length; i += 1) {
    const prev = breakEvenSeries[i - 1];
    const curr = breakEvenSeries[i];
    const prevDiff = prev.internal - prev.vendor;
    const currDiff = curr.internal - curr.vendor;
    if (prevDiff !== 0 && ((prevDiff < 0 && currDiff > 0) || (prevDiff > 0 && currDiff < 0))) {
      breakEven = curr.month;
      break;
    }
  }

  const tcoSeries = Array.from({ length: 6 }, (_, year) => ({
    year,
    label: year === 0 ? 'Старт' : `${year} г.`,
    internal: Math.round((scenarios.internal.cost + scenarios.internal.supportMonthly * 12 * year) / 1000) / 1000,
    vendor: Math.round((scenarios.vendor.cost + scenarios.vendor.supportMonthly * 12 * year) / 1000) / 1000,
    hybrid: Math.round((scenarios.hybrid.cost + scenarios.hybrid.supportMonthly * 12 * year) / 1000) / 1000,
  }));

  const baseRecommended = scenarios[recommended].cost;
  const sensitivity = [
    { name: 'Ставка внутренней команды', low: -0.18, high: 0.22 },
    { name: 'Стоимость подрядчика', low: -0.16, high: 0.24 },
    { name: 'Объём работ (часы)', low: -0.14, high: 0.18 },
    { name: 'Резерв на риск', low: -Math.min(0.2, reserve), high: 0.1 },
    { name: 'Сжатие срока', low: -0.04, high: 0.2 },
  ].map((factor) => ({
    ...factor,
    lowValue: baseRecommended * (1 + factor.low),
    highValue: baseRecommended * (1 + factor.high),
  }));

  const recommendedScenario = scenarios[recommended];
  const sigma = Math.max(1, (recommendedScenario.p90 - recommendedScenario.p10) / 2.563);
  const steps = 11;
  const min = recommendedScenario.p10 * 0.96;
  const max = recommendedScenario.p90 * 1.04;
  const distribution = Array.from({ length: steps }, (_, i) => {
    const x = min + ((max - min) * i) / (steps - 1);
    const density = Math.exp(-0.5 * ((x - recommendedScenario.p50) / sigma) ** 2);
    return { value: x, label: (x / 1_000_000).toFixed(1).replace('.', ','), count: Math.round(density * 100 + (i === 0 ? 2 : 0)) };
  });

  const risks = meta.risks.map((risk) => ({
    ...risk,
    expected: risk.probability * risk.impact,
  }));
  const risksTotal = risks.reduce((acc, risk) => acc + risk.expected, 0);

  const warnings = [];
  if (methodDiff > 0.15) {
    warnings.push({
      tone: 'warn',
      title: 'Расхождение методов',
      text: `Bottom-up и рыночные аналоги расходятся на ${Math.round(methodDiff * 100)}%. Диапазон расширен.`,
    });
  }
  if (state.deadlineWeeks && ['internal', 'vendor', 'hybrid'].some((id) => comp[id].compressed)) {
    const compressedLabels = [];
    if (comp.internal.compressed) compressedLabels.push('внутренней команды');
    if (comp.vendor.compressed) compressedLabels.push('подрядчика');
    if (comp.hybrid.compressed) compressedLabels.push('гибрида');
    warnings.push({
      tone: 'warn',
      title: 'Срок требует сжатия',
      text: `Целевой срок ${state.deadlineWeeks} нед. короче расчётного для ${compressedLabels.join(', ')}. Стоимость ${compressedLabels.length === 1 ? 'сценария' : 'сценариев'} увеличена по модели сжатия Putnam.`,
    });
  }
  if (pending > 0) {
    warnings.push({
      tone: 'info',
      title: 'Есть неподтверждённые параметры',
      text: `${pending} параметр(а) требуют проверки. Уверенность оценки снижена.`,
    });
  }
  if (state.hiring) {
    warnings.push({
      tone: 'info',
      title: 'Учтён найм',
      text: 'В внутреннем сценарии заложены рекрутинг, онбординг и ramp-up — 45 дней и 420 тыс. ₽.',
    });
  }

  return {
    meta,
    state,
    k,
    effort,
    effortRange,
    stageRows,
    stageDays,
    scenarios,
    recommended,
    ranking,
    scores: scored,
    confidence: { score: confidenceScore, components: confidenceComponents },
    analogMedian,
    methodDiff,
    breakEven,
    breakEvenSeries,
    tcoSeries,
    sensitivity,
    distribution,
    risks,
    risksTotal,
    warnings,
    pending,
    rawWeeks,
    deadline: {
      weeks: Number(state.deadlineWeeks) || 0,
      compressedScenarios: ['internal', 'vendor', 'hybrid'].filter((id) => comp[id].compressed),
    },
  };
};

export const recommendedRationale = (model) => {
  const rec = model.recommended;
  const s = model.scenarios[rec];
  const cheapest = Object.values(model.scenarios).sort((a, b) => a.p50 - b.p50)[0];
  const fastest = Object.values(model.scenarios).sort((a, b) => a.weeks - b.weeks)[0];
  const fasterThanInternal = model.scenarios.internal.weeks - s.weeks;
  if (rec === 'hybrid') {
    const premium = ((s.p50 - cheapest.p50) / cheapest.p50) * 100;
    const speed = fasterThanInternal > 0
      ? `на ${fasterThanInternal} нед. быстрее полностью внутренней команды`
      : 'в тот же календарный срок, что и внутренняя команда, но с меньшей нагрузкой на штат';
    if (premium <= 1) {
      return `Гибрид — самый дешёвый вариант по P50 и ${speed}. При этом архитектура, данные и приёмка остаются внутри ТМК, а подрядчик закрывает критический путь.`;
    }
    return `Гибрид даёт лучший баланс: стоимость в пределах ${Math.abs(premium).toFixed(0)}% от самого дешёвого варианта, срок — ${s.weeks} нед. (${speed}), а архитектура, данные и приёмка остаются внутри ТМК.`;
  }
  if (rec === 'vendor') {
    const isCheapest = cheapest.id === 'vendor';
    const isFastest = fastest.id === 'vendor';
    if (isCheapest && isFastest) {
      return `Подрядчик — самый дешёвый вариант (${fmtMoney(s.p50)}) и укладывается в ${s.weeks} нед. Для этой категории работ рынок зрелый, а передача знаний не создаёт критического риска.`;
    }
    if (isCheapest) {
      const next = Object.values(model.scenarios)
        .filter((item) => item.id !== 'vendor')
        .sort((a, b) => a.p50 - b.p50)[0];
      return `Подрядчик — самый дешёвый вариант (${fmtMoney(s.p50)}): на ${Math.round(((next.p50 - s.p50) / next.p50) * 100)}% дешевле гибрида и укладывается в ${s.weeks} нед. Для этой категории работ рынок зрелый, а передача знаний не создаёт критического риска.`;
    }
    return `Подрядчик выигрывает по скорости: ${s.weeks} нед. против ${model.scenarios.internal.weeks} нед. у внутренней команды. Для этой категории работ рынок зрелый, а передача знаний не создаёт критического риска.`;
  }
  return `Внутренняя команда выигрывает по совокупной стоимости владения и сохранению экспертизы: ${s.weeks} нед. срока и ${(s.tco3 / 1_000_000).toFixed(1).replace('.', ',')} млн ₽ за 3 года. Критические знания остаются внутри, внешняя зависимость минимальна.`;
};
