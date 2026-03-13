import type {
  BarekeyClient,
  BarekeyGetOptions,
  BarekeyResolvedRecord,
  BarekeyResolvedRecords,
  PublicBarekeyClient,
} from "@barekey/sdk";

import { enforcePublicRecords } from "./leak-guard.js";

type BarekeyReactClient = BarekeyClient | PublicBarekeyClient;

type RuntimeBarekeyClient = {
  get(
    name: string,
    options?: BarekeyGetOptions,
  ): {
    inspect(): Promise<BarekeyResolvedRecord<unknown>>;
  };
  get(
    names: readonly string[],
    options?: BarekeyGetOptions,
  ): {
    inspect(): Promise<BarekeyResolvedRecords<ReadonlyArray<unknown>>>;
  };
};

type FulfilledCacheEntry<TValue> = {
  status: "fulfilled";
  value: TValue;
  records: ReadonlyArray<BarekeyResolvedRecord<unknown>>;
};

type PendingCacheEntry = {
  status: "pending";
  promise: Promise<void>;
};

type RejectedCacheEntry = {
  status: "rejected";
  error: unknown;
};

type CacheEntry<TValue> =
  | FulfilledCacheEntry<TValue>
  | PendingCacheEntry
  | RejectedCacheEntry;

const resourceCache = new Map<string, CacheEntry<unknown>>();
const clientIds = new WeakMap<object, number>();
let nextClientId = 1;

function getClientId(client: BarekeyReactClient): number {
  const existing = clientIds.get(client);
  if (existing !== undefined) {
    return existing;
  }

  const nextId = nextClientId;
  nextClientId += 1;
  clientIds.set(client, nextId);
  return nextId;
}

function normalizeOptionsKey(options?: BarekeyGetOptions): string {
  return JSON.stringify({
    dynamic:
      options?.dynamic === undefined
        ? null
        : options.dynamic === true
          ? true
          : { ttl: options.dynamic.ttl instanceof Date ? options.dynamic.ttl.getTime() : options.dynamic.ttl },
    key: options?.key ?? null,
    seed: options?.seed ?? null,
  });
}

function createResourceKey(
  client: BarekeyReactClient,
  nameOrNames: string | readonly string[],
  options?: BarekeyGetOptions,
): string {
  return JSON.stringify({
    clientId: getClientId(client),
    nameOrNames,
    options: normalizeOptionsKey(options),
  });
}

function readResource<TValue>(
  key: string,
  loader: () => Promise<FulfilledCacheEntry<TValue>>,
): TValue {
  const existing = resourceCache.get(key) as CacheEntry<TValue> | undefined;
  if (existing === undefined) {
    const pending: PendingCacheEntry = {
      status: "pending",
      promise: loader().then(
        (resolved) => {
          enforcePublicRecords(resolved.records);
          resourceCache.set(key, resolved);
        },
        (error: unknown) => {
          resourceCache.set(key, {
            status: "rejected",
            error,
          });
        },
      ),
    };
    resourceCache.set(key, pending);
    throw pending.promise;
  }

  if (existing.status === "pending") {
    throw existing.promise;
  }

  if (existing.status === "rejected") {
    throw existing.error;
  }

  enforcePublicRecords(existing.records);
  return existing.value;
}

export function readBarekeyValue<TKey extends string>(
  client: BarekeyReactClient,
  name: TKey,
  options?: BarekeyGetOptions,
): unknown {
  return readResource(createResourceKey(client, name, options), async () => {
    const runtimeClient = client as RuntimeBarekeyClient;
    const resolved = await runtimeClient.get(name, options).inspect();
    return {
      status: "fulfilled",
      value: resolved.value,
      records: [resolved],
    };
  });
}

export function readBarekeyValues<TKeys extends readonly string[]>(
  client: BarekeyReactClient,
  names: TKeys,
  options?: BarekeyGetOptions,
): Array<unknown> {
  return readResource(createResourceKey(client, names, options), async () => {
    const runtimeClient = client as RuntimeBarekeyClient;
    const resolved = await runtimeClient.get(names, options).inspect();
    return {
      status: "fulfilled",
      value: resolved.map((record) => record.value),
      records: [...resolved],
    };
  });
}

export function resetBarekeyReactCacheForTests(): void {
  resourceCache.clear();
}
