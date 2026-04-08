import { cron } from "./cron-builder";

describe("cron builder", () => {
  describe("every(n).minutes()", () => {
    it("should build every-5-minutes expression", () => {
      expect(cron.every(5).minutes()).toBe("*/5 * * * *");
    });

    it("should build every-1-minute expression", () => {
      expect(cron.every(1).minutes()).toBe("*/1 * * * *");
    });

    it("should build every-30-minutes expression", () => {
      expect(cron.every(30).minutes()).toBe("*/30 * * * *");
    });
  });

  describe("every(n).hours()", () => {
    it("should build every-2-hours expression", () => {
      expect(cron.every(2).hours()).toBe("0 */2 * * *");
    });

    it("should build every-6-hours expression", () => {
      expect(cron.every(6).hours()).toBe("0 */6 * * *");
    });
  });

  describe("dailyAt()", () => {
    it('should parse "9am" → 09:00', () => {
      expect(cron.dailyAt("9am")).toBe("0 9 * * *");
    });

    it('should parse "9pm" → 21:00', () => {
      expect(cron.dailyAt("9pm")).toBe("0 21 * * *");
    });

    it('should parse "9:30am" → 09:30', () => {
      expect(cron.dailyAt("9:30am")).toBe("30 9 * * *");
    });

    it('should parse "9:30pm" → 21:30', () => {
      expect(cron.dailyAt("9:30pm")).toBe("30 21 * * *");
    });

    it('should parse "12am" (midnight) → 00:00', () => {
      expect(cron.dailyAt("12am")).toBe("0 0 * * *");
    });

    it('should parse "12pm" (noon) → 12:00', () => {
      expect(cron.dailyAt("12pm")).toBe("0 12 * * *");
    });

    it('should parse 24-hour "14:30" → 14:30', () => {
      expect(cron.dailyAt("14:30")).toBe("30 14 * * *");
    });

    it('should parse 24-hour "00:00" → midnight', () => {
      expect(cron.dailyAt("00:00")).toBe("0 0 * * *");
    });

    it("should throw on invalid time format", () => {
      expect(() => cron.dailyAt("invalid")).toThrow();
    });
  });

  describe("weekdaysAt()", () => {
    it("should produce Mon–Fri expression", () => {
      expect(cron.weekdaysAt("9am")).toBe("0 9 * * 1-5");
    });

    it("should respect time with minutes", () => {
      expect(cron.weekdaysAt("9:30am")).toBe("30 9 * * 1-5");
    });
  });

  describe("weekendsAt()", () => {
    it("should produce Sat+Sun expression", () => {
      expect(cron.weekendsAt("10am")).toBe("0 10 * * 6,0");
    });
  });

  describe("weeklyOn()", () => {
    it("should build monday expression", () => {
      expect(cron.weeklyOn("monday", "9am")).toBe("0 9 * * 1");
    });

    it("should build friday expression", () => {
      expect(cron.weeklyOn("friday", "6pm")).toBe("0 18 * * 5");
    });

    it("should build sunday expression", () => {
      expect(cron.weeklyOn("sunday", "12am")).toBe("0 0 * * 0");
    });

    it("should build saturday expression", () => {
      expect(cron.weeklyOn("saturday", "8am")).toBe("0 8 * * 6");
    });
  });

  describe("monthlyOn()", () => {
    it("should build 1st of month at midnight", () => {
      expect(cron.monthlyOn(1, "12am")).toBe("0 0 1 * *");
    });

    it("should build 15th of month at noon", () => {
      expect(cron.monthlyOn(15, "12pm")).toBe("0 12 15 * *");
    });

    it("should build last-ish day at 9am", () => {
      expect(cron.monthlyOn(28, "9am")).toBe("0 9 28 * *");
    });
  });
});
