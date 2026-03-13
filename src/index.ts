import {
  PublicBarekeyClient,
  type BarekeyGetOptions,
} from "@barekey/sdk/public";
import {
  createContext,
  createElement,
  Suspense,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import { readBarekeyValue, readBarekeyValues } from "./cache.js";

export type BarekeyReactClient = PublicBarekeyClient;

export type BarekeyReactGet = {
  <
    TKey extends
      | import("@barekey/sdk/public").BarekeyLiteralString
      | Extract<keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap, string>,
  >(
    name: TKey,
    options?: BarekeyGetOptions,
  ): TKey extends Extract<
    keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap,
    string
  >
    ? import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap[TKey]
    : unknown;
  <
    const TKeys extends readonly (
      | import("@barekey/sdk/public").BarekeyLiteralString
      | Extract<keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap, string>
    )[],
  >(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): {
    [TIndex in keyof TKeys]: TKeys[TIndex] extends string
      ? TKeys[TIndex] extends infer TKey
        ? TKey extends TKeys[TIndex]
          ? TKey extends Extract<
              keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap,
              string
            >
            ? import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap[TKey]
            : unknown
          : never
        : never
      : never;
  };
};

export type BarekeyReactEnv = {
  get: BarekeyReactGet;
};

export type BarekeyProviderProps = {
  client: BarekeyReactClient;
  fallback?: ReactNode;
  children?: ReactNode;
};

const BarekeyContext = createContext<BarekeyReactClient | null>(null);

export function BarekeyProvider(props: BarekeyProviderProps): ReactElement {
  return createElement(BarekeyContext.Provider, {
    value: props.client,
    children: createElement(Suspense, {
      fallback: props.fallback ?? null,
      children: props.children,
    }),
  });
}

export function useBarekey() {
  const client = useContext(BarekeyContext);
  if (client === null) {
    throw new Error(
      "[barekey/react] useBarekey() must be used within <BarekeyProvider client={new PublicBarekeyClient(...)} ...>.",
    );
  }
  const runtimeClient = client;

  function get<
    TKey extends
      | import("@barekey/sdk/public").BarekeyLiteralString
      | Extract<keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap, string>,
  >(
    name: TKey,
    options?: BarekeyGetOptions,
  ): TKey extends Extract<
    keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap,
    string
  >
    ? import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap[TKey]
    : unknown;
  function get<
    const TKeys extends readonly (
      | import("@barekey/sdk/public").BarekeyLiteralString
      | Extract<keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap, string>
    )[],
  >(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): {
    [TIndex in keyof TKeys]: TKeys[TIndex] extends string
      ? TKeys[TIndex] extends infer TKey
        ? TKey extends TKeys[TIndex]
          ? TKey extends Extract<
              keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap,
              string
            >
            ? import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap[TKey]
            : unknown
          : never
        : never
      : never;
  };
  function get(nameOrNames: string | readonly string[], options?: BarekeyGetOptions): unknown {
    if (Array.isArray(nameOrNames)) {
      return readBarekeyValues(runtimeClient, nameOrNames, options);
    }

    return readBarekeyValue(runtimeClient, nameOrNames as string, options);
  }

  return {
    get,
  };
}
