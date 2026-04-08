import { SchedulerService } from "./scheduler.service";
import { DuplicateJobError } from "../errors/duplicate-job.error";

describe("SchedulerService", () => {
  let service: SchedulerService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new SchedulerService();
  });

  afterEach(() => {
    // Clean up all timers and registry
    for (const name of service.list()) {
      service.unschedule(name);
    }
    jest.useRealTimers();
  });

  // ─── schedule() ─────────────────────────────────────────────────────────────

  describe("schedule()", () => {
    it("registers a new interval job", () => {
      service.schedule({ name: "test", handler: jest.fn(), interval: 1000 });
      expect(service.list()).toContain("test");
    });

    it("registers a new timeout job", () => {
      service.schedule({ name: "once", handler: jest.fn(), timeout: 500 });
      expect(service.list()).toContain("once");
    });

    it("throws DuplicateJobError when name already exists", () => {
      service.schedule({ name: "dup", handler: jest.fn(), interval: 1000 });
      expect(() => service.schedule({ name: "dup", handler: jest.fn(), interval: 2000 })).toThrow(
        DuplicateJobError,
      );
    });

    it("DuplicateJobError message contains the job name", () => {
      service.schedule({ name: "my-job", handler: jest.fn(), interval: 1000 });
      expect(() =>
        service.schedule({ name: "my-job", handler: jest.fn(), interval: 2000 }),
      ).toThrow("Job 'my-job' is already registered");
    });
  });

  // ─── unschedule() ───────────────────────────────────────────────────────────

  describe("unschedule()", () => {
    it("removes the job from the registry", () => {
      service.schedule({ name: "bye", handler: jest.fn(), interval: 1000 });
      service.unschedule("bye");
      expect(service.list()).not.toContain("bye");
    });

    it("is a no-op for unknown job names", () => {
      expect(() => service.unschedule("ghost")).not.toThrow();
    });

    it("stops the interval timer after unschedule", () => {
      const handler = jest.fn();
      service.schedule({ name: "stopped", handler, interval: 1000 });
      service.unschedule("stopped");
      jest.advanceTimersByTime(5000);
      expect(handler).not.toHaveBeenCalled();
    });

    it("stops firing after unschedule mid-run", async () => {
      const handler = jest.fn();
      service.schedule({ name: "mid", handler, interval: 1000 });
      await jest.advanceTimersByTimeAsync(1000); // tick 1 + flush
      await jest.advanceTimersByTimeAsync(1000); // tick 2 + flush
      service.unschedule("mid");
      await jest.advanceTimersByTimeAsync(3000); // no more ticks
      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // ─── reschedule() ───────────────────────────────────────────────────────────

  describe("reschedule()", () => {
    it("changes the interval atomically", async () => {
      const handler = jest.fn();
      service.schedule({ name: "tick", handler, interval: 1000 });
      service.reschedule("tick", { interval: 500 });
      await jest.advanceTimersByTimeAsync(500); // tick 1 + flush
      await jest.advanceTimersByTimeAsync(500); // tick 2 + flush
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("is a no-op for unknown job names", () => {
      expect(() => service.reschedule("ghost", { interval: 500 })).not.toThrow();
    });

    it("the rescheduled job is still in the list", () => {
      service.schedule({ name: "tick", handler: jest.fn(), interval: 1000 });
      service.reschedule("tick", { interval: 500 });
      expect(service.list()).toContain("tick");
    });
  });

  // ─── list() ─────────────────────────────────────────────────────────────────

  describe("list()", () => {
    it("returns empty array when no jobs registered", () => {
      expect(service.list()).toEqual([]);
    });

    it("returns all registered job names", () => {
      service.schedule({ name: "a", handler: jest.fn(), interval: 1000 });
      service.schedule({ name: "b", handler: jest.fn(), interval: 2000 });
      expect(service.list()).toEqual(expect.arrayContaining(["a", "b"]));
    });
  });

  // ─── interval jobs ──────────────────────────────────────────────────────────

  describe("interval execution", () => {
    it("calls handler on each interval tick", async () => {
      const handler = jest.fn();
      service.schedule({ name: "tick", handler, interval: 1000 });
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);
      await jest.advanceTimersByTimeAsync(1000);
      expect(handler).toHaveBeenCalledTimes(3);
    });

    it("does not call handler before the interval elapses", () => {
      const handler = jest.fn();
      service.schedule({ name: "tick", handler, interval: 1000 });
      jest.advanceTimersByTime(999);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ─── timeout jobs ───────────────────────────────────────────────────────────

  describe("timeout execution", () => {
    it("calls handler exactly once after the delay", () => {
      const handler = jest.fn();
      service.schedule({ name: "once", handler, timeout: 2000 });
      jest.advanceTimersByTime(2000);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("removes the job from registry after firing", () => {
      const handler = jest.fn();
      service.schedule({ name: "once", handler, timeout: 1000 });
      jest.advanceTimersByTime(1000);
      expect(service.list()).not.toContain("once");
    });

    it("does not call handler before the timeout elapses", () => {
      const handler = jest.fn();
      service.schedule({ name: "once", handler, timeout: 1000 });
      jest.advanceTimersByTime(999);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ─── Concurrency guard ──────────────────────────────────────────────────────

  describe("concurrency guard", () => {
    it("skips overlapping execution when handler is still running", async () => {
      let resolveHandler!: () => void;
      const handler = jest.fn(
        () =>
          new Promise<void>((resolve) => {
            resolveHandler = resolve;
          }),
      );

      service.schedule({ name: "slow", handler, interval: 100 });

      // First tick — handler starts but doesn't finish
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // flush microtask queue

      // Second tick fires — should be skipped (guard)
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(handler).toHaveBeenCalledTimes(1);

      // Finish the first run
      resolveHandler();
      await Promise.resolve();
    });

    it("allows next execution after previous one completes", async () => {
      const handler = jest.fn().mockResolvedValue(undefined);

      service.schedule({ name: "fast", handler, interval: 100 });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Error resilience ───────────────────────────────────────────────────────

  describe("error resilience", () => {
    it("calls onJobError when handler throws", async () => {
      const onJobError = jest.fn();
      const errorService = new SchedulerService({ onJobError });
      const err = new Error("boom");

      errorService.schedule({
        name: "bad",
        handler: jest.fn().mockRejectedValue(err),
        interval: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(onJobError).toHaveBeenCalledWith("bad", err);
      errorService.unschedule("bad");
    });

    it("does not stop the scheduler after a job throws", async () => {
      const onJobError = jest.fn();
      const errorService = new SchedulerService({ onJobError });
      const goodHandler = jest.fn().mockResolvedValue(undefined);

      errorService.schedule({
        name: "bad",
        handler: jest.fn().mockRejectedValue(new Error("boom")),
        interval: 100,
      });
      errorService.schedule({ name: "good", handler: goodHandler, interval: 100 });

      jest.advanceTimersByTime(100);
      await Promise.resolve();

      expect(goodHandler).toHaveBeenCalledTimes(1);
      errorService.unschedule("bad");
      errorService.unschedule("good");
    });
  });
});
