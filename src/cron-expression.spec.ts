import { CronExpression } from "./cron-expression";

describe("CronExpression", () => {
  it("should export EVERY_MINUTE", () => {
    expect(CronExpression.EVERY_MINUTE).toBe("* * * * *");
  });

  it("should export EVERY_5_MINUTES", () => {
    expect(CronExpression.EVERY_5_MINUTES).toBe("*/5 * * * *");
  });

  it("should export EVERY_10_MINUTES", () => {
    expect(CronExpression.EVERY_10_MINUTES).toBe("*/10 * * * *");
  });

  it("should export EVERY_15_MINUTES", () => {
    expect(CronExpression.EVERY_15_MINUTES).toBe("*/15 * * * *");
  });

  it("should export EVERY_30_MINUTES", () => {
    expect(CronExpression.EVERY_30_MINUTES).toBe("*/30 * * * *");
  });

  it("should export EVERY_HOUR", () => {
    expect(CronExpression.EVERY_HOUR).toBe("0 * * * *");
  });

  it("should export EVERY_2_HOURS", () => {
    expect(CronExpression.EVERY_2_HOURS).toBe("0 */2 * * *");
  });

  it("should export EVERY_6_HOURS", () => {
    expect(CronExpression.EVERY_6_HOURS).toBe("0 */6 * * *");
  });

  it("should export EVERY_12_HOURS", () => {
    expect(CronExpression.EVERY_12_HOURS).toBe("0 */12 * * *");
  });

  it("should export EVERY_DAY_AT_MIDNIGHT", () => {
    expect(CronExpression.EVERY_DAY_AT_MIDNIGHT).toBe("0 0 * * *");
  });

  it("should export EVERY_DAY_AT_9AM", () => {
    expect(CronExpression.EVERY_DAY_AT_9AM).toBe("0 9 * * *");
  });

  it("should export EVERY_DAY_AT_NOON", () => {
    expect(CronExpression.EVERY_DAY_AT_NOON).toBe("0 12 * * *");
  });

  it("should export EVERY_DAY_AT_6PM", () => {
    expect(CronExpression.EVERY_DAY_AT_6PM).toBe("0 18 * * *");
  });

  it("should export EVERY_WEEKDAY_9AM", () => {
    expect(CronExpression.EVERY_WEEKDAY_9AM).toBe("0 9 * * 1-5");
  });

  it("should export EVERY_WEEKEND_MIDNIGHT", () => {
    expect(CronExpression.EVERY_WEEKEND_MIDNIGHT).toBe("0 0 * * 6,0");
  });

  it("should export EVERY_MONDAY_9AM", () => {
    expect(CronExpression.EVERY_MONDAY_9AM).toBe("0 9 * * 1");
  });

  it("should export EVERY_SUNDAY_MIDNIGHT", () => {
    expect(CronExpression.EVERY_SUNDAY_MIDNIGHT).toBe("0 0 * * 0");
  });

  it("should export FIRST_OF_MONTH", () => {
    expect(CronExpression.FIRST_OF_MONTH).toBe("0 0 1 * *");
  });
});
