// ─── Timing Options (Discriminated Union) ─────────────────────────────────────
// Each variant has a unique literal key, so TypeScript enforces that only ONE
// timing type can be set at a time.  You cannot pass both `cron` and `interval`.

export type CronSchedule = {
  cron: string;
  interval?: never;
  timeout?: never;
};

export type IntervalSchedule = {
  interval: number;
  cron?: never;
  timeout?: never;
};

export type TimeoutSchedule = {
  timeout: number;
  cron?: never;
  interval?: never;
};

export type ScheduleTiming = CronSchedule | IntervalSchedule | TimeoutSchedule;

// ─── ScheduledJob ──────────────────────────────────────────────────────────────
// A full job definition: name + handler + exactly one timing type.

export type ScheduledJob = {
  /** Unique identifier for the job. Used for unschedule / reschedule lookups. */
  name: string;
  /** The async function that runs when the timer fires. */
  handler: () => Promise<void> | void;
} & ScheduleTiming;

// ─── IScheduler ────────────────────────────────────────────────────────────────
// The public contract that SchedulerService implements.

export interface IScheduler {
  /** Register and start a new job. Throws DuplicateJobError if name already exists. */
  schedule(job: ScheduledJob): void;

  /** Stop and remove a job by name. No-op if the job does not exist. */
  unschedule(name: string): void;

  /** Atomically stop the old schedule and start a new one for the same job name. */
  reschedule(name: string, newTiming: ScheduleTiming): void;

  /** Return a snapshot of all currently registered job names. */
  list(): string[];
}
