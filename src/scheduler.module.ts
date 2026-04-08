import { DynamicModule, Inject, Module, OnModuleInit, Optional, Type } from "@nestjs/common";
import { MetadataScanner } from "@nestjs/core";
import {
  CISCODE_SCHEDULER_METADATA,
  type SchedulerMetadata,
} from "./decorators/scheduler.decorators";
import { SchedulerService, type SchedulerModuleOptions } from "./services/scheduler.service";
import type { ScheduledJob } from "./interfaces/scheduler.interface";

// Injection token for the module options
export const SCHEDULER_MODULE_OPTIONS = "SCHEDULER_MODULE_OPTIONS";

// ─── Async options shape ──────────────────────────────────────────────────────
export type SchedulerModuleAsyncOptions = {
  imports?: DynamicModule["imports"];
  inject?: unknown[];

  useFactory: (...args: any[]) => SchedulerModuleOptions | Promise<SchedulerModuleOptions>;
};

// ─── SchedulerModule ──────────────────────────────────────────────────────────
@Module({})
export class SchedulerModule implements OnModuleInit {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly metadataScanner: MetadataScanner,
    @Optional()
    @Inject("DISCOVERED_PROVIDERS")
    private readonly discoveredProviders: object[] = [],
  ) {}

  // Runs after all providers are instantiated — scans for decorated methods
  onModuleInit(): void {
    for (const provider of this.discoveredProviders) {
      const prototype = Object.getPrototypeOf(provider) as object;
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const metadata: SchedulerMetadata | undefined = Reflect.getMetadata(
          CISCODE_SCHEDULER_METADATA,
          prototype,
          methodName,
        );
        if (!metadata) continue;

        const handlerFn = (provider as Record<string, (() => unknown) | undefined>)[methodName];
        if (!handlerFn) continue;
        const handler = handlerFn.bind(provider) as () => void | Promise<void>;
        const name = metadata.name ?? `${provider.constructor.name}.${methodName}`;

        const job: ScheduledJob = (() => {
          if (metadata.type === "cron")
            return { name, handler, cron: metadata.cron } satisfies ScheduledJob;
          if (metadata.type === "interval")
            return { name, handler, interval: metadata.interval } satisfies ScheduledJob;
          return { name, handler, timeout: metadata.timeout } satisfies ScheduledJob;
        })();

        this.schedulerService.schedule(job);
      }
    }
  }

  // ─── register() ─────────────────────────────────────────────────────────────
  static register(
    options: SchedulerModuleOptions = {},
    providers: Type<object>[] = [],
  ): DynamicModule {
    return {
      module: SchedulerModule,
      imports: [],
      providers: [
        MetadataScanner,
        { provide: SCHEDULER_MODULE_OPTIONS, useValue: options },
        {
          provide: SchedulerService,
          useFactory: (opts: SchedulerModuleOptions) => new SchedulerService(opts),
          inject: [SCHEDULER_MODULE_OPTIONS],
        },
        ...providers,
        { provide: "DISCOVERED_PROVIDERS", useFactory: (...p: object[]) => p, inject: providers },
      ],
      exports: [SchedulerService],
    };
  }

  // ─── registerAsync() ────────────────────────────────────────────────────────
  static registerAsync(
    asyncOptions: SchedulerModuleAsyncOptions,
    providers: Type<object>[] = [],
  ): DynamicModule {
    return {
      module: SchedulerModule,
      imports: asyncOptions.imports ?? [],
      providers: [
        MetadataScanner,
        {
          provide: SCHEDULER_MODULE_OPTIONS,
          useFactory: asyncOptions.useFactory,
          inject: (asyncOptions.inject as never[]) ?? [],
        },
        {
          provide: SchedulerService,
          useFactory: (opts: SchedulerModuleOptions) => new SchedulerService(opts),
          inject: [SCHEDULER_MODULE_OPTIONS],
        },
        ...providers,
        { provide: "DISCOVERED_PROVIDERS", useFactory: (...p: object[]) => p, inject: providers },
      ],
      exports: [SchedulerService],
    };
  }
}
