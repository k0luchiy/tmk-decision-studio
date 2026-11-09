import { z } from 'zod';
import { Grade, Hours, IsoDate } from '../primitives.js';

/* -------------------------------------------------------------------------- */
/* Task & extracted parameters                                                */
/* -------------------------------------------------------------------------- */

export const ExtractedParamSchema = z.object({
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  unit: z.string(),
  confidence: z.number().min(0).max(1),
  quote: z.string().optional(),
  status: z.enum(['auto', 'confirmed', 'edited', 'rejected']),
  defaultUsed: z.boolean(),
});
export type ExtractedParam = z.infer<typeof ExtractedParamSchema>;

/* -------------------------------------------------------------------------- */
/* Decomposition                                                              */
/* -------------------------------------------------------------------------- */

const RoleMixEntrySchema = z.object({
  roleId: z.string(),
  share: z.number().min(0).max(100),
  grade: Grade,
});

/** HelpDesk slice: planned / actual / quoted hours for a single activity. */
const WorkItemEffortSchema = z.object({
  planHours: Hours,
  actualHours: Hours,
  quotedHours: Hours,
});

export const WorkItemSchema = z
  .object({
    id: z.string(),
    stage: z.number().int().min(1).max(7),
    archetypeId: z.string(),
    unit: z.string(),
    unitsCount: z.number().finite().nonnegative(),
    optimisticHours: Hours,
    mostLikelyHours: Hours,
    pessimisticHours: Hours,
    expectedHours: Hours,
    sigmaHours: Hours,
    roleMix: z.array(RoleMixEntrySchema),
    sourceRefs: z.array(z.string()),
    assumption: z.boolean(),
    effort: WorkItemEffortSchema.optional(),
  })
  .refine(
    (item) =>
      item.optimisticHours <= item.mostLikelyHours && item.mostLikelyHours <= item.pessimisticHours,
    { message: 'Require optimisticHours <= mostLikelyHours <= pessimisticHours' },
  )
  .refine(
    (item) => Math.abs(item.roleMix.reduce((sum, role) => sum + role.share, 0) - 100) < 1e-6,
    { message: 'roleMix shares must sum to 100' },
  );
export type WorkItem = z.infer<typeof WorkItemSchema>;

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  descriptionRaw: z.string(),
  briefVersion: z.string(),
  createdAt: IsoDate,
  externalId: z.string().optional(),
  changeId: z.string().optional(),
  teamLine: z.string().optional(),
  platform: z.string().optional(),
  params: z.array(ExtractedParamSchema).optional(),
  workItems: z.array(WorkItemSchema).optional(),
});
export type Task = z.infer<typeof TaskSchema>;

/* -------------------------------------------------------------------------- */
/* Effort                                                                     */
/* -------------------------------------------------------------------------- */

const StageRoleHoursSchema = z.object({
  roleId: z.string(),
  grade: Grade,
  hours: Hours,
});

export const EffortGridSchema = z
  .object({
    p10Hours: Hours,
    p50Hours: Hours,
    p80Hours: Hours,
    p90Hours: Hours,
    byStage: z.array(
      z.object({
        stage: z.number().int().min(1).max(7),
        hours: Hours,
        byRole: z.array(StageRoleHoursSchema),
      }),
    ),
    byRole: z.array(StageRoleHoursSchema),
    totalHours: Hours,
  })
  .refine(
    (grid) =>
      grid.p10Hours <= grid.p50Hours &&
      grid.p50Hours <= grid.p80Hours &&
      grid.p80Hours <= grid.p90Hours,
    { message: 'Require p10Hours <= p50Hours <= p80Hours <= p90Hours' },
  );
export type EffortGrid = z.infer<typeof EffortGridSchema>;
