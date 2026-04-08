import "reflect-metadata";

// ─── Metadata Key ─────────────────────────────────────────────────────────────
// A unique symbol used as the key for storing scheduler metadata on methods.
// Using a unique constant prevents collisions with other decorator libraries.
export const CISCODE_SCHEDULER_METADATA = "ciscode:scheduler";

// ─── Metadata Shape ───────────────────────────────────────────────────────────
export type CronMetadata = { type: "cron"; cron: string; name?: string };
export type IntervalMetadata = { type: "interval"; interval: number; name?: string };
export type TimeoutMetadata = { type: "timeout"; timeout: number; name?: string };

export type SchedulerMetadata = CronMetadata | IntervalMetadata | TimeoutMetadata;

// ─── @Cron ────────────────────────────────────────────────────────────────────
/**
 * Marks a method to run on a cron schedule.
 *
 * @param expression - Standard cron expression (e.g. `'0 * * * *'` = every hour)
 * @param name       - Optional unique job name. Defaults to `ClassName.methodName`.
 *
 * @example
 * ```typescript
 * @Cron('0 * * * *', 'hourly-report')
 * async generateReport() { ... }
 * ```
 */
export function Cron(expression: string, name?: string): MethodDecorator {
  return (target, propertyKey) => {
    const metadata: CronMetadata = name
      ? { type: "cron", cron: expression, name }
      : { type: "cron", cron: expression };
    Reflect.defineMetadata(CISCODE_SCHEDULER_METADATA, metadata, target, propertyKey);
  };
}

// ─── @Interval ────────────────────────────────────────────────────────────────
/**
 * Marks a method to run repeatedly on a fixed interval.
 *
 * @param ms   - Interval in milliseconds (e.g. `5000` = every 5 seconds)
 * @param name - Optional unique job name.
 *
 * @example
 * ```typescript
 * @Interval(5000, 'heartbeat')
 * async ping() { ... }
 * ```
 */
export function Interval(ms: number, name?: string): MethodDecorator {
  return (target, propertyKey) => {
    const metadata: IntervalMetadata = name
      ? { type: "interval", interval: ms, name }
      : { type: "interval", interval: ms };
    Reflect.defineMetadata(CISCODE_SCHEDULER_METADATA, metadata, target, propertyKey);
  };
}

// ─── @Timeout ─────────────────────────────────────────────────────────────────
/**
 * Marks a method to run once after a delay.
 *
 * @param ms   - Delay in milliseconds
 * @param name - Optional unique job name.
 *
 * @example
 * ```typescript
 * @Timeout(3000, 'startup-check')
 * async onStartup() { ... }
 * ```
 */
export function Timeout(ms: number, name?: string): MethodDecorator {
  return (target, propertyKey) => {
    const metadata: TimeoutMetadata = name
      ? { type: "timeout", timeout: ms, name }
      : { type: "timeout", timeout: ms };
    Reflect.defineMetadata(CISCODE_SCHEDULER_METADATA, metadata, target, propertyKey);
  };
}
