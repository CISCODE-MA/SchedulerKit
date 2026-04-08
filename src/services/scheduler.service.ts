import { Injectable, Logger } from "@nestjs/common";
import { CronJob } from "cron";
import { DuplicateJobError } from "../errors/duplicate-job.error";
import type {
  IScheduler,
  ScheduledJob,
  ScheduledJobStatus,
  ScheduleTiming,
} from "../interfaces/scheduler.interface";

// ─── Internal registry entry ──────────────────────────────────────────────────
type JobEntry = {
  job: ScheduledJob;
  /** True while the handler is actively executing — used by the concurrency guard. */
  isRunning: boolean;
  /** The destroy function that clears the underlying timer / cron job. */
  stop: () => void;
  /** ISO timestamp of the last completed execution. */
  lastRun: string | undefined;
  /** The underlying CronJob instance, present only for cron-based jobs. */
  cronJob: InstanceType<typeof CronJob> | undefined;
};

export type SchedulerModuleOptions = {
  /** Called whenever a job throws. Defaults to Logger.error. */
  onJobError?: (name: string, error: unknown) => void;
};

@Injectable()
export class SchedulerService implements IScheduler {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly registry = new Map<string, JobEntry>();
  private readonly onJobError: (name: string, error: unknown) => void;

  constructor(options: SchedulerModuleOptions = {}) {
    this.onJobError =
      options.onJobError ??
      ((name, error) => this.logger.error(`Job '${name}' threw an error`, error));
  }

  // ─── IScheduler ─────────────────────────────────────────────────────────────

  schedule(job: ScheduledJob): void {
    if (this.registry.has(job.name)) {
      throw new DuplicateJobError(job.name);
    }
    const entry = this._createEntry(job);
    this.registry.set(job.name, entry);
  }

  unschedule(name: string): void {
    const entry = this.registry.get(name);
    if (!entry) return;
    entry.stop();
    this.registry.delete(name);
  }

  reschedule(name: string, newTiming: ScheduleTiming): void {
    const entry = this.registry.get(name);
    if (!entry) return;
    const newJob: ScheduledJob = { ...entry.job, ...newTiming } as ScheduledJob;
    entry.stop();
    this.registry.delete(name);
    this.schedule(newJob);
  }

  list(): string[] {
    return Array.from(this.registry.keys());
  }

  status(name: string): ScheduledJobStatus | undefined {
    const entry = this.registry.get(name);
    if (!entry) return undefined;
    return {
      name,
      cron: "cron" in entry.job ? entry.job.cron : undefined,
      lastRun: entry.lastRun,
      nextRun: entry.cronJob?.nextDate().toISO() ?? undefined,
      isRunning: entry.isRunning,
    };
  }

  listStatus(): ScheduledJobStatus[] {
    return Array.from(this.registry.keys()).map((name) => this.status(name) as ScheduledJobStatus);
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private _createEntry(job: ScheduledJob): JobEntry {
    const entry: JobEntry = {
      job,
      isRunning: false,
      stop: () => {},
      lastRun: undefined,
      cronJob: undefined,
    };

    const guardedHandler = async () => {
      if (entry.isRunning) {
        this.logger.warn(`Job '${job.name}' is already running — skipping overlapping execution.`);
        return;
      }
      entry.isRunning = true;
      try {
        await job.handler();
        entry.lastRun = new Date().toISOString();
      } catch (error) {
        this.onJobError(job.name, error);
      } finally {
        entry.isRunning = false;
      }
    };

    if ("cron" in job && job.cron) {
      const cronJob = new CronJob(
        job.cron,
        () => {
          void guardedHandler();
        },
        null,
        true,
      );
      entry.cronJob = cronJob;
      entry.stop = () => {
        void cronJob.stop();
      };
    } else if ("interval" in job && job.interval !== undefined) {
      const id = setInterval(() => {
        void guardedHandler();
      }, job.interval);
      entry.stop = () => clearInterval(id);
    } else if ("timeout" in job && job.timeout !== undefined) {
      const id = setTimeout(() => {
        void guardedHandler();
        this.registry.delete(job.name);
      }, job.timeout);
      entry.stop = () => clearTimeout(id);
    }

    return entry;
  }
}
