import type { Grade, Task, WorkItem } from '@app/contract';
import type { Archetype } from '@app/data';
import { STAGE_SHARES } from './stageShares.js';

/**
 * Classifier work type → archetype id from `work_archetypes.json`.
 * `default` is used when the brief has no recognisable work type.
 */
export const WORK_TYPE_TO_ARCHETYPE: Record<string, string> = {
  integration: 'integration_1c_wms',
  development: 'new_web_app',
  migration: 'data_migration',
  bi: 'bi_report_pack',
  mes: 'mes_module',
  security: 'security_kii_compliance',
  support: 'l2_l3_support',
  rpa: 'rpa_bot',
  cv: 'cv_quality_control',
  infrastructure: 'infrastructure_migration',
  document: 'document_management',
  erp: 'erp_1c_rollout',
  lowcode: 'low_code',
  data: 'dwh_build',
  ai: 'chatbot_assistant',
  chatbot: 'chatbot_assistant',
  pdm: 'predictive_maintenance',
  api: 'api_gateway',
  portal: 'portal_gis',
  mobile: 'mobile_app',
  sap: 'sap_dev',
  observability: 'observability_monitoring',
  legacy: 'legacy_modernization',
  default: 'functional_extension_1c',
};

/** Reverse lookup so a brief may name an archetype id directly. */
const ARCHETYPE_TO_WORK_TYPE: Record<string, string> = {};
for (const [workType, archetypeId] of Object.entries(WORK_TYPE_TO_ARCHETYPE)) {
  if (workType !== 'default') {
    ARCHETYPE_TO_WORK_TYPE[archetypeId] = workType;
  }
}

/** Planning grades from `meta.default_grade_by_role` in the archetype dataset. */
const DEFAULT_GRADE_BY_ROLE: Record<string, Grade> = {
  analyst_ba_sa: 'middle',
  '1c_developer': 'middle',
  backend: 'middle',
  frontend: 'middle',
  mobile: 'middle',
  qa_manual: 'middle',
  qa_auto: 'middle',
  devops_sre: 'middle',
  architect: 'senior',
  pm: 'lead',
  ux: 'middle',
  infosec: 'middle',
  data_engineer: 'middle',
  sysadmin: 'senior',
};

/** Parameter keys that can carry an explicit work type in a brief. */
const WORK_TYPE_PARAM_KEYS = new Set(['work_type', 'worktype', 'type', 'category']);

/**
 * Keyword fallback for briefs that do not carry an explicit parameter.
 * Ordered specific-first so "разработка мобильного приложения" resolves to
 * mobile, not to the generic development archetype.
 */
const WORK_TYPE_KEYWORDS: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['mobile', ['mobile', 'мобильн']],
  ['sap', ['sap']],
  ['lowcode', ['low-code', 'lowcode', 'low code', 'лоу-код']],
  ['observability', ['observability', 'monitoring', 'мониторинг', 'наблюдаем']],
  ['legacy', ['legacy', 'легаси']],
  ['cv', ['computer vision', 'компьютерн']],
  ['rpa', ['rpa', 'робот']],
  ['ai', ['chatbot', 'чат-бот', 'чатбот', 'ассистент', 'искусственн']],
  ['security', ['security', 'безопасн', 'кии', 'kii']],
  ['mes', ['mes', 'производств']],
  ['bi', ['bi-report', 'bi report', 'отчёт', 'отчет', 'дашборд', 'аналитик']],
  ['integration', ['integration', 'интеграц']],
  ['migration', ['migration', 'миграц']],
  ['data', ['dwh', 'data warehouse', 'хранилищ']],
  ['support', ['support', 'поддержк', 'сопровожд', 'l2', 'l3']],
  ['document', ['document', 'документооборот', 'сэд']],
  ['erp', ['erp']],
  ['portal', ['portal', 'портал', 'госуслуг', 'gis']],
  ['api', ['api', 'gateway', 'шлюз']],
  ['infrastructure', ['infrastructure', 'инфраструктур']],
  ['development', ['development', 'разработ', 'web', 'веб']],
];

const STANDARD_STAGES = [1, 2, 3, 4, 5, 6] as const;

function normaliseToken(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Chooses a work type from an explicit brief parameter first, then from
 * title/description keywords, and falls back to `default`.
 */
export function resolveWorkType(task: Task): string {
  for (const param of task.params ?? []) {
    if (!WORK_TYPE_PARAM_KEYS.has(normaliseToken(param.key))) {
      continue;
    }
    if (typeof param.value !== 'string') {
      continue;
    }
    const token = normaliseToken(param.value);
    if (token in WORK_TYPE_TO_ARCHETYPE) {
      return token;
    }
    const reverse = ARCHETYPE_TO_WORK_TYPE[token];
    if (reverse !== undefined) {
      return reverse;
    }
  }

  const text = `${task.title} ${task.descriptionRaw}`.toLowerCase();
  for (const [workType, keywords] of WORK_TYPE_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return workType;
    }
  }
  return 'default';
}

/**
 * Builds a bottom-up WBS for a task from its matching archetype.
 *
 * - Stages 1–6 each get one `WorkItem`, scaled by `stageShares`.
 * - `support` archetypes get a single stage-7 item at full effort (TCO line).
 * - When the brief does not supply a unit count, `typical_unit_count.mid` is
 *   used and the resulting items are marked as assumptions.
 * - A zero unit count yields zero-hour items instead of throwing.
 */
export function buildWbs(
  task: Task,
  archetypes: Archetype[],
  params?: { unitsCount?: number; stageShares?: typeof STAGE_SHARES; coverageFactor?: number },
): WorkItem[] {
  const workType = resolveWorkType(task);
  const archetypeId = WORK_TYPE_TO_ARCHETYPE[workType] ?? WORK_TYPE_TO_ARCHETYPE.default;
  const archetype = archetypes.find((candidate) => candidate.id === archetypeId);
  if (archetype === undefined) {
    return [];
  }

  const shares = params?.stageShares ?? STAGE_SHARES;
  const explicitUnits = params?.unitsCount;
  const coverageFactor = params?.coverageFactor ?? 1;
  const typicalMid = archetype.typical_unit_count.mid;
  const lowVolumeUnits = ['FP', 'intent', 'bot', 'integration_flow'].includes(archetype.unit);
  const fallbackUnits = lowVolumeUnits ? archetype.typical_unit_count.low : typicalMid;
  const unitsCount = explicitUnits ?? (typeof fallbackUnits === 'number' ? fallbackUnits : 1);
  // Typical sizing or a zero-volume brief both count as an explicit assumption.
  const assumption = explicitUnits === undefined || explicitUnits === 0;

  const roleMix: WorkItem['roleMix'] = Object.entries(archetype.default_role_mix_pct).map(
    ([roleId, share]) => ({
      roleId,
      share,
      grade: DEFAULT_GRADE_BY_ROLE[roleId] ?? 'middle',
    }),
  );

  const threePoint = archetype.three_point;
  const isSupport = archetype.category === 'support';

  const makeItem = (stage: number, share: number): WorkItem => {
    const scale = share * unitsCount * coverageFactor;
    const optimisticHours = threePoint.optimistic * scale;
    const mostLikelyHours = threePoint.most_likely * scale;
    const pessimisticHours = threePoint.pessimistic * scale;
    const expectedHours = (optimisticHours + 4 * mostLikelyHours + pessimisticHours) / 6;
    const sigmaHours = (pessimisticHours - optimisticHours) / 6;

    return {
      id: `${archetype.id}:s${stage}`,
      stage,
      archetypeId: archetype.id,
      unit: archetype.unit,
      unitsCount,
      optimisticHours,
      mostLikelyHours,
      pessimisticHours,
      expectedHours,
      sigmaHours,
      roleMix,
      sourceRefs: [`archetype:${archetype.id}`],
      assumption,
    };
  };

  if (isSupport) {
    return [makeItem(7, 1)];
  }

  return STANDARD_STAGES.map((stage) => makeItem(stage, shares[stage]));
}
