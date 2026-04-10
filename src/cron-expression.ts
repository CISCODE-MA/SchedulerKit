/**
 * Human-readable cron expression constants.
 *
 * Use these instead of raw cron strings so every developer on the team
 * can read the schedule at a glance — no cron knowledge required.
 *
 * @example
 * import { CronExpression } from '@ciscode/scheduler-kit';
 *
 * @Cron(CronExpression.EVERY_DAY_AT_9AM, 'daily-digest')
 * async sendDailyDigest() { ... }
 */
export const CronExpression = {
  EVERY_MINUTE: "* * * * *",
  EVERY_5_MINUTES: "*/5 * * * *",
  EVERY_10_MINUTES: "*/10 * * * *",
  EVERY_15_MINUTES: "*/15 * * * *",
  EVERY_30_MINUTES: "*/30 * * * *",
  EVERY_HOUR: "0 * * * *",
  EVERY_2_HOURS: "0 */2 * * *",
  EVERY_6_HOURS: "0 */6 * * *",
  EVERY_12_HOURS: "0 */12 * * *",
  EVERY_DAY_AT_MIDNIGHT: "0 0 * * *",
  EVERY_DAY_AT_9AM: "0 9 * * *",
  EVERY_DAY_AT_NOON: "0 12 * * *",
  EVERY_DAY_AT_6PM: "0 18 * * *",
  EVERY_WEEKDAY_9AM: "0 9 * * 1-5", // Mon–Fri at 09:00
  EVERY_WEEKEND_MIDNIGHT: "0 0 * * 6,0", // Sat + Sun at 00:00
  EVERY_MONDAY_9AM: "0 9 * * 1",
  EVERY_SUNDAY_MIDNIGHT: "0 0 * * 0",
  FIRST_OF_MONTH: "0 0 1 * *", // 1st day of every month at midnight
} as const;

export type CronExpressionKey = keyof typeof CronExpression;
