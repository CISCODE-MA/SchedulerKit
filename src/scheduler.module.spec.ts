import "reflect-metadata";
import { MetadataScanner } from "@nestjs/core";
import { SchedulerModule } from "./scheduler.module";
import { SchedulerService } from "./services/scheduler.service";
import { Cron, Interval, Timeout } from "./decorators/scheduler.decorators";

describe("SchedulerModule", () => {
  let service: SchedulerService;
  let scanner: MetadataScanner;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new SchedulerService();
    scanner = new MetadataScanner();
  });

  afterEach(() => {
    for (const name of service.list()) service.unschedule(name);
    jest.useRealTimers();
  });

  // ─── onModuleInit() ─────────────────────────────────────────────────────────

  describe("onModuleInit()", () => {
    it("auto-registers @Cron decorated method with default name", () => {
      class MyJobs {
        @Cron("0 * * * *")
        async doWork() {}
      }
      const mod = new SchedulerModule(service, scanner, [new MyJobs()]);
      mod.onModuleInit();
      expect(service.list()).toContain("MyJobs.doWork");
    });

    it("auto-registers @Cron decorated method with explicit name", () => {
      class MyJobs {
        @Cron("0 * * * *", "hourly")
        async doWork() {}
      }
      const mod = new SchedulerModule(service, scanner, [new MyJobs()]);
      mod.onModuleInit();
      expect(service.list()).toContain("hourly");
    });

    it("auto-registers @Interval decorated method", () => {
      class MyJobs {
        @Interval(1000, "heartbeat")
        async ping() {}
      }
      const mod = new SchedulerModule(service, scanner, [new MyJobs()]);
      mod.onModuleInit();
      expect(service.list()).toContain("heartbeat");
    });

    it("auto-registers @Timeout decorated method", () => {
      class MyJobs {
        @Timeout(500, "startup")
        async init() {}
      }
      const mod = new SchedulerModule(service, scanner, [new MyJobs()]);
      mod.onModuleInit();
      expect(service.list()).toContain("startup");
    });

    it("ignores methods without scheduler metadata", () => {
      class MyJobs {
        async plainMethod() {}
      }
      const mod = new SchedulerModule(service, scanner, [new MyJobs()]);
      mod.onModuleInit();
      expect(service.list()).toHaveLength(0);
    });

    it("works with empty providers list", () => {
      const mod = new SchedulerModule(service, scanner, []);
      expect(() => mod.onModuleInit()).not.toThrow();
    });

    it("works with undefined providers (default)", () => {
      const mod = new SchedulerModule(service, scanner);
      expect(() => mod.onModuleInit()).not.toThrow();
    });
  });

  // ─── register() ─────────────────────────────────────────────────────────────

  describe("register()", () => {
    it("returns a DynamicModule", () => {
      const result = SchedulerModule.register();
      expect(result.module).toBe(SchedulerModule);
    });

    it("exports SchedulerService", () => {
      const result = SchedulerModule.register();
      expect(result.exports).toContain(SchedulerService);
    });

    it("accepts provider classes", () => {
      class MyJobs {}
      const result = SchedulerModule.register({}, [MyJobs]);
      expect(result.providers).toEqual(expect.arrayContaining([MyJobs]));
    });

    it("SchedulerService factory creates a SchedulerService instance", () => {
      const result = SchedulerModule.register();
      const p = (
        result.providers as Array<{ provide: unknown; useFactory?: (...a: unknown[]) => unknown }>
      ).find((x) => x.provide === SchedulerService);
      expect(p?.useFactory?.({})).toBeInstanceOf(SchedulerService);
    });

    it("DISCOVERED_PROVIDERS factory returns the spread providers", () => {
      const result = SchedulerModule.register();
      const p = (
        result.providers as Array<{ provide: unknown; useFactory?: (...a: unknown[]) => unknown }>
      ).find((x) => x.provide === "DISCOVERED_PROVIDERS");
      const a = {};
      const b = {};
      expect(p?.useFactory?.(a, b)).toEqual([a, b]);
    });
  });

  // ─── registerAsync() ────────────────────────────────────────────────────────

  describe("registerAsync()", () => {
    it("returns a DynamicModule", () => {
      const result = SchedulerModule.registerAsync({ useFactory: () => ({}) });
      expect(result.module).toBe(SchedulerModule);
    });

    it("exports SchedulerService", () => {
      const result = SchedulerModule.registerAsync({ useFactory: () => ({}) });
      expect(result.exports).toContain(SchedulerService);
    });

    it("passes imports and inject to the module", () => {
      const result = SchedulerModule.registerAsync({
        imports: [],
        inject: ["CONFIG"],
        useFactory: () => ({}),
      });
      expect(result.imports).toEqual([]);
    });

    it("SchedulerService factory creates a SchedulerService instance", () => {
      const result = SchedulerModule.registerAsync({ useFactory: () => ({}) });
      const p = (
        result.providers as Array<{ provide: unknown; useFactory?: (...a: unknown[]) => unknown }>
      ).find((x) => x.provide === SchedulerService);
      expect(p?.useFactory?.({})).toBeInstanceOf(SchedulerService);
    });

    it("DISCOVERED_PROVIDERS factory returns the spread providers", () => {
      const result = SchedulerModule.registerAsync({ useFactory: () => ({}) });
      const p = (
        result.providers as Array<{ provide: unknown; useFactory?: (...a: unknown[]) => unknown }>
      ).find((x) => x.provide === "DISCOVERED_PROVIDERS");
      const a = {};
      const b = {};
      expect(p?.useFactory?.(a, b)).toEqual([a, b]);
    });
  });
});
