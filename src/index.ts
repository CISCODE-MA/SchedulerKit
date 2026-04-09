import "reflect-metadata";

// ============================================================================
// PUBLIC API EXPORTS
// ============================================================================

// ============================================================================
// SERVICE
// ============================================================================
export { SchedulerService } from "./services/scheduler.service";
export type { SchedulerModuleOptions } from "./services/scheduler.service";

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
