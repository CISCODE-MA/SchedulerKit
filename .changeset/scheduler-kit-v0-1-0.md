---
"@ciscode/scheduler-kit": minor
---

Initial feature release v0.1.0.

- `SchedulerModule` with `register()` and `registerAsync()` for synchronous and factory-based configuration
- `SchedulerService` with dynamic `schedule()`, `unschedule()`, `reschedule()`, `list()`, `status()`, and `listStatus()` API
- `@Cron`, `@Interval`, and `@Timeout` method decorators for declarative job definitions
- Automatic concurrency guard — overlapping executions are silently skipped
- Per-job error isolation — handler errors are caught and reported; the scheduler continues running
- `CronExpression` enum of named cron constants
- `cron()` fluent builder with `at()`, `on()`, and `everyMinutes()` helpers
- `DuplicateJobError` thrown when scheduling a job with an already-registered name
- Full TypeScript types: `IScheduler`, `ScheduledJob`, `ScheduledJobStatus`, `ScheduleTiming`, `CronSchedule`, `IntervalSchedule`, `TimeoutSchedule`
