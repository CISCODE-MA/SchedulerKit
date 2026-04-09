import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

// ============================================================================
// MODULE
// ============================================================================
export { SchedulerModule } from "./scheduler.module";
export type { SchedulerModuleAsyncOptions } from "./scheduler.module";

// ============================================================================
// SERVICE
// ============================================================================
export { SchedulerService } from "./services/scheduler.service";
export type { SchedulerModuleOptions } from "./services/scheduler.service";

// ============================================================================
// DECORATORS
// ============================================================================
export {
  Cron,
  Interval,
  Timeout,
  CISCODE_SCHEDULER_METADATA,
} from "./decorators/scheduler.decorators";
export type {
  SchedulerMetadata,
  CronMetadata,
  IntervalMetadata,
  TimeoutMetadata,
} from "./decorators/scheduler.decorators";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================
export type {
  IScheduler,
  ScheduledJob,
  ScheduledJobStatus,
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
