/** Maps parsed HelpDesk rows onto the domain `Task`/`WorkItem` model. */

import type { DataQualityReport, Task, WorkItem } from '@app/contract';
import {
  STAGE_BY_ACTIVITY,
  earliest,
  isBlankRow,
  num,
  parseDate,
  str,
  type Sheet,
} from './parse.js';
import { rowWarnings } from './validate.js';

function platformOf(team: string): '1С' | 'BPMSoft' | 'other' {
  if (team.includes('1С') || team.includes('1C')) {
    return '1С';
  }
  if (team.includes('BPMSoft')) {
    return 'BPMSoft';
  }
  return 'other';
}

const STANDARD_SPECIALIST = /^Специалист\s+\d+$/i;

/** Stable de-identification: keep `Специалист N`, rename anything else in order. */
function makeMasker(): (raw: string) => string {
  const assigned = new Map<string, string>();
  let counter = 0;
  return (raw: string): string => {
    const value = raw.trim();
    if (value === '' || STANDARD_SPECIALIST.test(value)) {
      return value;
    }
    const existing = assigned.get(value);
    if (existing !== undefined) {
      return existing;
    }
    counter += 1;
    const label = `Специалист ${counter}`;
    assigned.set(value, label);
    return label;
  };
}

interface Group {
  key: string;
  externalId: string;
  changeId: string;
  title: string;
  description: string;
  teamLine: string;
  platform: string;
  state: string;
  dates: string[];
  workItems: WorkItem[];
}

export interface MappedRows {
  tasks: Task[];
  workItems: WorkItem[];
  rowsTotal: number;
  rowsDropped: DataQualityReport['rowsDropped'];
  warnings: string[];
}

export function mapRows(sheet: Sheet): MappedRows {
  const { rows, cell } = sheet;
  const groups = new Map<string, Group>();
  const seen = new Set<string>();
  const mask = makeMasker();
  const rowsDropped: DataQualityReport['rowsDropped'] = [];
  const warnings: string[] = [];
  let rowsTotal = 0;

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    if (row === undefined || isBlankRow(row)) {
      continue;
    }
    rowsTotal += 1;
    const rowNumber = i + 1;

    const number = str(cell(row, 'number'));
    const changeNumber = str(cell(row, 'change'));
    const activity = str(cell(row, 'activity'));
    const rawSpecialist = str(cell(row, 'specialist'));
    const createdAtRaw = cell(row, 'createdAt');
    const created = parseDate(createdAtRaw);

    if (number === '') {
      rowsDropped.push({ row: rowNumber, reason: 'missing_id' });
      continue;
    }

    const dedupeKey = [number, activity, rawSpecialist, created ?? ''].join('\u0001');
    if (seen.has(dedupeKey)) {
      rowsDropped.push({ row: rowNumber, reason: 'duplicate' });
      continue;
    }
    seen.add(dedupeKey);

    const key = changeNumber === '' ? number : changeNumber;
    const team = str(cell(row, 'team'));
    const platform = platformOf(team);
    const kind = str(cell(row, 'kind'));
    const planHours = num(cell(row, 'plan'));
    const actualHours = num(cell(row, 'actual'));
    const quotedHours = num(cell(row, 'quoted'));

    warnings.push(
      ...rowWarnings({
        rowNumber,
        createdRaw: createdAtRaw,
        created,
        kind,
        activity,
        planHours,
        actualHours,
        quotedHours,
      }),
    );

    const specialist = mask(rawSpecialist);
    const base = planHours > 0 ? planHours : actualHours > 0 ? actualHours : 0;
    const stage = STAGE_BY_ACTIVITY[activity] ?? 3;
    const isBpm = platform === 'BPMSoft';

    const workItem: WorkItem = {
      id: `helpdesk:${key}:${activity}:${specialist || 'unknown'}:${created ?? 'unknown'}`,
      stage,
      archetypeId: isBpm ? 'integration_1c_wms' : 'functional_extension_1c',
      unit: 'activity',
      unitsCount: 1,
      optimisticHours: base,
      mostLikelyHours: base,
      pessimisticHours: base,
      expectedHours: (base + 4 * base + base) / 6,
      sigmaHours: (base - base) / 6,
      roleMix: [{ roleId: isBpm ? 'backend' : '1c_developer', share: 100, grade: 'middle' }],
      sourceRefs: [`helpdesk:${rowNumber}`],
      assumption: false,
      effort: { planHours, actualHours, quotedHours },
    };

    let group = groups.get(key);
    if (group === undefined) {
      group = {
        key,
        externalId: number,
        changeId: changeNumber,
        title: str(cell(row, 'title')),
        description: str(cell(row, 'description')),
        teamLine: team,
        platform,
        state: str(cell(row, 'state')),
        dates: [],
        workItems: [],
      };
      groups.set(key, group);
    }
    if (created !== undefined) {
      group.dates.push(created);
    }
    group.workItems.push(workItem);
  }

  const tasks: Task[] = [...groups.values()].map((group) => ({
    id: `helpdesk:${group.key}`,
    title: group.title === '' ? group.key : group.title,
    descriptionRaw: group.description,
    briefVersion: '',
    createdAt: earliest(group.dates),
    externalId: group.externalId,
    changeId: group.changeId,
    teamLine: group.teamLine,
    platform: group.platform,
    params: [
      {
        key: 'state',
        value: group.state,
        unit: '',
        confidence: 1,
        status: 'auto',
        defaultUsed: false,
      },
    ],
    workItems: group.workItems,
  }));

  const workItems = tasks.flatMap((task) => task.workItems ?? []);

  return { tasks, workItems, rowsTotal, rowsDropped, warnings };
}
