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

// ─── ScheduledJobStatus ──────────────────────────────────────────────────────
// Runtime snapshot of a registered job's state.

export type ScheduledJobStatus = {
  /** Unique job name. */
  name: string;
  /** Cron expression if the job is cron-based, undefined otherwise. */
  cron: string | undefined;
  /** ISO timestamp of the last execution, or undefined if never run. */
  lastRun: string | undefined;
  /** ISO timestamp of the next scheduled execution, or undefined for one-shot/interval jobs. */
  nextRun: string | undefined;
  /** True while the job handler is actively executing. */
  isRunning: boolean;
};

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

  /** Return the runtime status of a single job, or undefined if not found. */
  status(name: string): ScheduledJobStatus | undefined;

  /** Return the runtime status of all registered jobs. */
  listStatus(): ScheduledJobStatus[];
}
