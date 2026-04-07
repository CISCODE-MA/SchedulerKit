import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

// ============================================================================
// INTERFACES & TYPES
// ============================================================================
export type {
  IScheduler,
  ScheduledJob,
  ScheduleTiming,
  CronSchedule,
  IntervalSchedule,
  TimeoutSchedule,
} from "./interfaces/scheduler.interface";

// ============================================================================
// ERRORS
// ============================================================================
export { DuplicateJobError } from "./errors/duplicate-job.error";

// ============================================================================
// HELPERS
// ============================================================================
export { CronExpression } from "./cron-expression";
export type { CronExpressionKey } from "./cron-expression";
export { cron } from "./cron-builder";
export type { DayOfWeek } from "./cron-builder";
