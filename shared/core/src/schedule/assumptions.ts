export interface CalendarAssumption {
  stageLagWeeks: readonly number[];
  pilotWeeks: number;
  minCalendarWeeks: number;
  supportTermWeeks?: number;
}

const DEFAULT: CalendarAssumption = {
  stageLagWeeks: [1, 1, 0, 2, 1, 1],
  pilotWeeks: 0,
  minCalendarWeeks: 4,
};

const BY_WORK_TYPE: Record<string, CalendarAssumption> = {
  chatbot: { stageLagWeeks: [0.5, 0.5, 0, 1, 0.5, 0.5], pilotWeeks: 0, minCalendarWeeks: 3 },
  integration: DEFAULT,
  development: DEFAULT,
  mobile: { stageLagWeeks: [1, 1, 0, 2, 1, 1], pilotWeeks: 2, minCalendarWeeks: 8 },
  mes: { stageLagWeeks: [2, 2, 0, 4, 2, 2], pilotWeeks: 8, minCalendarWeeks: 24 },
  cv: { stageLagWeeks: [2, 2, 0, 4, 2, 2], pilotWeeks: 6, minCalendarWeeks: 16 },
  pdm: { stageLagWeeks: [2, 2, 0, 4, 2, 2], pilotWeeks: 20, minCalendarWeeks: 32 },
  infrastructure: { stageLagWeeks: [2, 3, 0, 4, 2, 2], pilotWeeks: 12, minCalendarWeeks: 40 },
  support: { stageLagWeeks: [0, 0, 0, 0, 0, 0], pilotWeeks: 0, minCalendarWeeks: 52, supportTermWeeks: 52 },
  observability: { stageLagWeeks: [0.5, 0.5, 0, 1, 0.5, 0.5], pilotWeeks: 0, minCalendarWeeks: 6 },
};

export function calendarAssumption(workType: string): CalendarAssumption {
  return BY_WORK_TYPE[workType] ?? DEFAULT;
}

export function calendarBufferWeeks(workType: string, effortWeeks: number): number {
  const assumption = calendarAssumption(workType);
  const scale = Math.min(1, Math.max(0, effortWeeks / 12));
  const lag = assumption.stageLagWeeks.reduce((sum, value) => sum + value, 0) * scale;
  return Math.ceil(lag + assumption.pilotWeeks);
}

export function calendarStageLags(workType: string, effortWeeks: number): number[] {
  const assumption = calendarAssumption(workType);
  const scale = Math.min(1, Math.max(0, effortWeeks / 12));
  return assumption.stageLagWeeks.map((value) => Number((value * scale).toFixed(2)));
}

export function calendarPilotWeeks(workType: string): number {
  return calendarAssumption(workType).pilotWeeks;
}

export function calendarMinWeeks(workType: string): number {
  return calendarAssumption(workType).minCalendarWeeks;
}

export function calendarSupportTermWeeks(workType: string): number | undefined {
  return calendarAssumption(workType).supportTermWeeks;
}
