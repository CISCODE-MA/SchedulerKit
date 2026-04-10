# @ciscode/scheduler-kit

> NestJS advanced scheduler wrapper with dynamic control, concurrency guards, and full TypeScript support.

[![npm version](https://img.shields.io/npm/v/@ciscode/scheduler-kit)](https://www.npmjs.com/package/@ciscode/scheduler-kit)
[![license](https://img.shields.io/npm/l/@ciscode/scheduler-kit)](LICENSE)

## Features

- **Declarative scheduling** — `@Cron`, `@Interval`, `@Timeout` class decorators
- **Dynamic control** — `schedule()`, `unschedule()`, `reschedule()` at runtime
- **Concurrency guard** — overlapping executions are skipped automatically
- **Error isolation** — job errors are caught and reported; the scheduler keeps running
- **Job introspection** — `status()` / `listStatus()` expose `isRunning`, `lastRun`, `nextRun`
- **Cron helpers** — `CronExpression` enum and `cron()` fluent builder
- **Async configuration** — `registerAsync()` for factory-based options (e.g. `ConfigService`)

## Installation

```bash
npm install @ciscode/scheduler-kit
```

### Peer dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/schedule reflect-metadata rxjs
```

## Quick start

### 1. Register the module

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { SchedulerModule } from "@ciscode/scheduler-kit";
import { AppJobs } from "./app.jobs";

@Module({
  imports: [
    SchedulerModule.register({ onJobError: (name, err) => console.error(`[${name}]`, err) }, [
      AppJobs,
    ]),
  ],
})
export class AppModule {}
```

### 2. Declare jobs with decorators

```typescript
// app.jobs.ts
import { Injectable } from "@nestjs/common";
import { Cron, Interval, Timeout, CronExpression } from "@ciscode/scheduler-kit";

@Injectable()
export class AppJobs {
  // ── @Cron ──────────────────────────────────────────────────────────────────
  // Runs every day at midnight. The second argument is an optional unique name.
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, "daily-report")
  async generateDailyReport() {
    console.log("Generating daily report…");
  }

  // Explicit cron expression — runs at 08:30 every weekday
  @Cron("30 8 * * 1-5", "weekday-morning")
  async sendMorningDigest() {
    console.log("Sending morning digest…");
  }

  // ── @Interval ──────────────────────────────────────────────────────────────
  // Runs every 30 seconds. Name defaults to "AppJobs.heartbeat".
  @Interval(30_000, "heartbeat")
  async ping() {
    console.log("ping");
  }

  // ── @Timeout ───────────────────────────────────────────────────────────────
  // Runs exactly once, 5 seconds after the module initialises.
  @Timeout(5_000, "startup-check")
  async onStartup() {
    console.log("Application has been running for 5 seconds");
  }
}
```

## Dynamic scheduling with SchedulerService

Inject `SchedulerService` to add, remove, or reschedule jobs at runtime.

```typescript
import { Injectable } from "@nestjs/common";
import { SchedulerService, CronExpression, cron, DuplicateJobError } from "@ciscode/scheduler-kit";

@Injectable()
export class ReportService {
  constructor(private readonly scheduler: SchedulerService) {}

  // Add a new cron job at runtime
  startHourlySync() {
    this.scheduler.schedule({
      name: "hourly-sync",
      cron: CronExpression.EVERY_HOUR,
      handler: async () => {
        /* … */
      },
    });
  }

  // Add an interval job at runtime
  startPolling() {
    this.scheduler.schedule({
      name: "poll-api",
      interval: 10_000, // every 10 seconds
      handler: async () => {
        /* … */
      },
    });
  }

  // Remove a job
  stopPolling() {
    this.scheduler.unschedule("poll-api");
  }

  // Change the timing of an existing job without losing its name
  changeToNightly() {
    this.scheduler.reschedule("hourly-sync", {
      cron: CronExpression.EVERY_DAY_AT_MIDNIGHT,
    });
  }

  // Inspect status
  printStatus() {
    const status = this.scheduler.status("hourly-sync");
    // { name, cron, lastRun, nextRun, isRunning }
    console.log(status);

    const all = this.scheduler.listStatus();
    // ScheduledJobStatus[] for every registered job
    console.log(all);
  }

  // List job names
  listJobs() {
    return this.scheduler.list(); // string[]
  }
}
```

## Concurrency guard

Every job is wrapped in an automatic concurrency guard. If a handler is still
executing when its next tick fires, that tick is **silently skipped** and a
warning is logged:

```
[SchedulerService] WARN  Job 'hourly-sync' is already running — skipping overlapping execution.
```

No extra configuration is needed — this behaviour is always on. It prevents
jobs from running in parallel with themselves under load or when a handler
takes longer than its schedule period.

## Error handling

By default, any error thrown inside a job handler is caught and logged via
`Logger.error`. The scheduler continues running and the next tick will fire as
normal.

You can override the error handler globally when registering the module:

```typescript
SchedulerModule.register({
  onJobError: (name, error) => {
    myMonitoringService.capture(error, { jobName: name });
  },
});
```

## Async configuration

Use `registerAsync()` when options depend on a config service or environment:

```typescript
SchedulerModule.registerAsync(
  {
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: (config: ConfigService) => ({
      onJobError: (name, err) => (config.get("LOG_ERRORS") ? console.error(err) : undefined),
    }),
  },
  [AppJobs],
);
```

## Cron helpers

You never need to write a raw cron string. The package ships two tools:
`CronExpression` (named constants) and `cron` (fluent builder).

### `CronExpression` — named constants

Drop-in replacements for common cron strings. Any developer can read them instantly.

```typescript
import { CronExpression } from "@ciscode/scheduler-kit";

@Cron(CronExpression.EVERY_5_MINUTES, "sync")  // "*/5 * * * *"
@Cron(CronExpression.EVERY_HOUR,      "report") // "0 * * * *"
@Cron(CronExpression.EVERY_DAY_AT_9AM,"digest") // "0 9 * * *"
@Cron(CronExpression.FIRST_OF_MONTH,  "billing")// "0 0 1 * *"
```

Full list:

| Constant                 | Cron string    |
| ------------------------ | -------------- |
| `EVERY_MINUTE`           | `* * * * *`    |
| `EVERY_5_MINUTES`        | `*/5 * * * *`  |
| `EVERY_10_MINUTES`       | `*/10 * * * *` |
| `EVERY_15_MINUTES`       | `*/15 * * * *` |
| `EVERY_30_MINUTES`       | `*/30 * * * *` |
| `EVERY_HOUR`             | `0 * * * *`    |
| `EVERY_2_HOURS`          | `0 */2 * * *`  |
| `EVERY_6_HOURS`          | `0 */6 * * *`  |
| `EVERY_12_HOURS`         | `0 */12 * * *` |
| `EVERY_DAY_AT_MIDNIGHT`  | `0 0 * * *`    |
| `EVERY_DAY_AT_9AM`       | `0 9 * * *`    |
| `EVERY_DAY_AT_NOON`      | `0 12 * * *`   |
| `EVERY_DAY_AT_6PM`       | `0 18 * * *`   |
| `EVERY_WEEKDAY_9AM`      | `0 9 * * 1-5`  |
| `EVERY_WEEKEND_MIDNIGHT` | `0 0 * * 6,0`  |
| `EVERY_MONDAY_9AM`       | `0 9 * * 1`    |
| `EVERY_SUNDAY_MIDNIGHT`  | `0 0 * * 0`    |
| `FIRST_OF_MONTH`         | `0 0 1 * *`    |

---

### `cron` — fluent builder

For every schedule that is not in the table above, use `cron`.
Pass the result directly as the first argument of `@Cron`.

```typescript
import { cron } from "@ciscode/scheduler-kit";
```

#### Repeat every N minutes / hours

```typescript
cron.every(5).minutes(); // "*/5 * * * *"  — every 5 minutes
cron.every(2).hours(); // "0 */2 * * *"  — every 2 hours
```

#### Once a day at a specific time

Human-readable time strings are accepted: `'9am'`, `'9:30pm'`, `'14:30'`, `'00:00'`.

```typescript
cron.dailyAt("9am"); // "0 9 * * *"
cron.dailyAt("9:30pm"); // "30 21 * * *"
cron.dailyAt("00:00"); // "0 0 * * *"
```

#### Weekdays / weekends only

```typescript
cron.weekdaysAt("9am"); // "0 9 * * 1-5"   — Mon–Fri at 09:00
cron.weekdaysAt("2:30pm"); // "30 14 * * 1-5" — Mon–Fri at 14:30
cron.weekendsAt("10am"); // "0 10 * * 6,0"  — Sat + Sun at 10:00
```

#### Once a week on a specific day

```typescript
cron.weeklyOn("monday", "9am"); // "0 9 * * 1"
cron.weeklyOn("friday", "6pm"); // "0 18 * * 5"
cron.weeklyOn("wednesday", "12pm"); // "0 12 * * 3"
```

Valid day values: `'monday'` `'tuesday'` `'wednesday'` `'thursday'` `'friday'` `'saturday'` `'sunday'`

#### Once a month on a specific day-of-month

```typescript
cron.monthlyOn(1, "9am"); // "0 9 1 * *"   — 1st  of every month at 09:00
cron.monthlyOn(15, "12pm"); // "0 12 15 * *"  — 15th of every month at noon
cron.monthlyOn(1, "12am"); // "0 0 1 * *"    — 1st  of every month at midnight
```

#### Real-world example (all together)

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Cron, Interval, Timeout, CronExpression, cron } from "@ciscode/scheduler-kit";

@Injectable()
export class AppJobs {
  private readonly logger = new Logger(AppJobs.name);

  @Interval(5_000, "heartbeat")
  async heartbeat() {
    this.logger.log("ping");
  }

  @Cron(cron.every(5).minutes(), "every-5-min")
  async every5Minutes() {
    /* flush metrics */
  }

  @Cron(cron.dailyAt("9am"), "morning-digest")
  async morningDigest() {
    /* send email */
  }

  @Cron(cron.weekdaysAt("2:30pm"), "standup-reminder")
  async standupReminder() {
    /* send Slack message */
  }

  @Cron(cron.weeklyOn("monday", "9am"), "weekly-report")
  async weeklyReport() {
    /* generate PDF */
  }

  @Cron(cron.monthlyOn(1, "12am"), "monthly-billing")
  async monthlyBilling() {
    /* charge subscriptions */
  }

  @Timeout(5_000, "startup-check")
  async startupCheck() {
    this.logger.log("App has been running for 5 s");
  }
}
```

## API reference

### `SchedulerModule`

| Method          | Signature                     | Description                |
| --------------- | ----------------------------- | -------------------------- |
| `register`      | `(options?, providers[])`     | Synchronous registration   |
| `registerAsync` | `(asyncOptions, providers[])` | Factory-based registration |

### `SchedulerService`

| Method                        | Returns                           | Description                                                                      |
| ----------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `schedule(job)`               | `void`                            | Register and start a new job. Throws `DuplicateJobError` if name already exists. |
| `unschedule(name)`            | `void`                            | Stop and remove a job. No-op if name unknown.                                    |
| `reschedule(name, newTiming)` | `void`                            | Atomically stop + restart a job with new timing. No-op if name unknown.          |
| `list()`                      | `string[]`                        | Names of all registered jobs.                                                    |
| `status(name)`                | `ScheduledJobStatus \| undefined` | Status snapshot for one job.                                                     |
| `listStatus()`                | `ScheduledJobStatus[]`            | Status snapshot for all jobs.                                                    |

### `ScheduledJobStatus`

```typescript
type ScheduledJobStatus = {
  name: string;
  cron?: string; // present for cron jobs
  lastRun?: string; // ISO timestamp of last completed run
  nextRun?: string; // ISO timestamp of next scheduled run (cron only)
  isRunning: boolean; // true while the handler is executing
};
```

### Decorators

| Decorator                  | Arguments         | Description                   |
| -------------------------- | ----------------- | ----------------------------- |
| `@Cron(expression, name?)` | `string, string?` | Run on a cron schedule        |
| `@Interval(ms, name?)`     | `number, string?` | Run every N milliseconds      |
| `@Timeout(ms, name?)`      | `number, string?` | Run once after N milliseconds |

## License

MIT

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)

---

**Made with ❤️ by CisCode**
