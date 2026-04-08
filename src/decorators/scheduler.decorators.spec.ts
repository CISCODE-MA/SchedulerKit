import "reflect-metadata";
import {
  Cron,
  Interval,
  Timeout,
  CISCODE_SCHEDULER_METADATA,
  type SchedulerMetadata,
} from "./scheduler.decorators";

// Helper — reads metadata from the class prototype
function getMeta(target: object, method: string): SchedulerMetadata | undefined {
  return Reflect.getMetadata(CISCODE_SCHEDULER_METADATA, target, method) as
    | SchedulerMetadata
    | undefined;
}

class TestClass {
  @Cron("0 * * * *", "hourly")
  cronWithName() {}

  @Cron("*/5 * * * *")
  cronNoName() {}

  @Interval(5000, "heartbeat")
  intervalWithName() {}

  @Interval(1000)
  intervalNoName() {}

  @Timeout(3000, "startup")
  timeoutWithName() {}

  @Timeout(500)
  timeoutNoName() {}
}

const proto = TestClass.prototype as object;

describe("@Cron", () => {
  it("sets type to cron", () => {
    expect(getMeta(proto, "cronWithName")?.type).toBe("cron");
  });

  it("stores the cron expression", () => {
    const meta = getMeta(proto, "cronWithName") as { cron: string };
    expect(meta.cron).toBe("0 * * * *");
  });

  it("stores the optional name", () => {
    const meta = getMeta(proto, "cronWithName") as { name?: string };
    expect(meta.name).toBe("hourly");
  });

  it("name is absent when not provided", () => {
    const meta = getMeta(proto, "cronNoName") as { name?: string };
    expect(meta.name).toBeUndefined();
  });
});

describe("@Interval", () => {
  it("sets type to interval", () => {
    expect(getMeta(proto, "intervalWithName")?.type).toBe("interval");
  });

  it("stores the interval ms", () => {
    const meta = getMeta(proto, "intervalWithName") as { interval: number };
    expect(meta.interval).toBe(5000);
  });

  it("stores the optional name", () => {
    const meta = getMeta(proto, "intervalWithName") as { name?: string };
    expect(meta.name).toBe("heartbeat");
  });

  it("name is absent when not provided", () => {
    const meta = getMeta(proto, "intervalNoName") as { name?: string };
    expect(meta.name).toBeUndefined();
  });
});

describe("@Timeout", () => {
  it("sets type to timeout", () => {
    expect(getMeta(proto, "timeoutWithName")?.type).toBe("timeout");
  });

  it("stores the timeout ms", () => {
    const meta = getMeta(proto, "timeoutWithName") as { timeout: number };
    expect(meta.timeout).toBe(3000);
  });

  it("stores the optional name", () => {
    const meta = getMeta(proto, "timeoutWithName") as { name?: string };
    expect(meta.name).toBe("startup");
  });

  it("name is absent when not provided", () => {
    const meta = getMeta(proto, "timeoutNoName") as { name?: string };
    expect(meta.name).toBeUndefined();
  });
});
