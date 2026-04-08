// ─── Types ─────────────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

// ─── Internal helpers ──────────────────────────────────────────────────────────

const DAY_MAP: Record<DayOfWeek, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Parse a human-readable time string into { hour, minute }.
 *
 * Accepted formats:
 *   '9am'    → 09:00
 *   '9pm'    → 21:00
 *   '9:30am' → 09:30
 *   '9:30pm' → 21:30
 *   '09:00'  → 09:00   (24-hour)
 *   '21:30'  → 21:30   (24-hour)
 */
function parseTime(time: string): { hour: number; minute: number } {
  const ampm = /^(\d{1,2})(?::(\d{2}))?(am|pm)$/i.exec(time.trim());
  if (ampm) {
    let hour = parseInt(ampm[1] as string, 10);
    const minute = ampm[2] ? parseInt(ampm[2], 10) : 0;
    const period = (ampm[3] as string).toLowerCase();
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return { hour, minute };
  }
  const h24 = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (h24) {
    return { hour: parseInt(h24[1] as string, 10), minute: parseInt(h24[2] as string, 10) };
  }
  throw new Error(`Cannot parse time: "${time}". ` + `Use "9am", "9:30pm", "14:30", etc.`);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Fluent cron expression builder — no cron syntax required.
 *
 * @example
 * import { cron } from '@ciscode/scheduler-kit';
 *
 * cron.every(5).minutes()           // "* /5 * * * *"
 * cron.every(2).hours()             // "0 * /2 * * *"
 * cron.dailyAt('9am')               // "0 9 * * *"
 * cron.dailyAt('9:30pm')            // "30 21 * * *"
 * cron.weekdaysAt('9am')            // "0 9 * * 1-5"
 * cron.weekendsAt('10am')           // "0 10 * * 6,0"
 * cron.weeklyOn('monday', '9am')    // "0 9 * * 1"
 * cron.monthlyOn(1, '9am')          // "0 9 1 * *"   (1st of every month)
 * cron.monthlyOn(15, '12pm')        // "0 12 15 * *"  (15th of every month)
 */
export const cron = {
  /**
   * Repeat every N minutes or hours.
   * @example
   * cron.every(5).minutes()   // every 5 minutes
   * cron.every(2).hours()     // every 2 hours
   */
  every(n: number) {
    return {
      minutes: (): string => `*/${n} * * * *`,
      hours: (): string => `0 */${n} * * *`,
    };
  },

  /**
   * Once a day at the specified time.
   * @example
   * cron.dailyAt('9am')     // every day at 09:00
   * cron.dailyAt('9:30pm')  // every day at 21:30
   * cron.dailyAt('00:00')   // every day at midnight
   */
  dailyAt(time: string): string {
    const { hour, minute } = parseTime(time);
    return `${minute} ${hour} * * *`;
  },

  /**
   * Monday–Friday only at the specified time.
   * @example cron.weekdaysAt('9am')
   */
  weekdaysAt(time: string): string {
    const { hour, minute } = parseTime(time);
    return `${minute} ${hour} * * 1-5`;
  },

  /**
   * Saturday + Sunday only at the specified time.
   * @example cron.weekendsAt('10am')
   */
  weekendsAt(time: string): string {
    const { hour, minute } = parseTime(time);
    return `${minute} ${hour} * * 6,0`;
  },

  /**
   * Once a week on a specific day at the specified time.
   * @example cron.weeklyOn('monday', '9am')
   */
  weeklyOn(day: DayOfWeek, time: string): string {
    const { hour, minute } = parseTime(time);
    return `${minute} ${hour} * * ${DAY_MAP[day]}`;
  },

  /**
   * Once a month on a specific day-of-month at the specified time.
   * @example
   * cron.monthlyOn(1,  '9am')   // 1st  of every month at 09:00
   * cron.monthlyOn(15, '12pm')  // 15th of every month at 12:00
   */
  monthlyOn(dayOfMonth: number, time: string): string {
    const { hour, minute } = parseTime(time);
    return `${minute} ${hour} ${dayOfMonth} * *`;
  },
} as const;
