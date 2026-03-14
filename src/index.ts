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

type BarekeyReactKnownKey = Extract<
  keyof import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap,
  string
>;

type BarekeyReactAnyKey =
  | import("@barekey/sdk/public").BarekeyLiteralString
  | BarekeyReactKnownKey;

type BarekeyReactValueForKey<TKey extends BarekeyReactAnyKey> = TKey extends BarekeyReactKnownKey
  ? import("@barekey/sdk/public").BarekeyPublicGeneratedTypeMap[TKey]
  : unknown;

type BarekeyReactValuesForKeys<TKeys extends readonly BarekeyReactAnyKey[]> = {
  [TIndex in keyof TKeys]: TKeys[TIndex] extends BarekeyReactAnyKey
    ? BarekeyReactValueForKey<TKeys[TIndex]>
    : never;
};

export type BarekeyReactGet = {
  <TKey extends BarekeyReactAnyKey>(name: TKey, options?: BarekeyGetOptions): BarekeyReactValueForKey<TKey>;
  <const TKeys extends readonly BarekeyReactAnyKey[]>(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): BarekeyReactValuesForKeys<TKeys>;
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

  function get<TKey extends BarekeyReactAnyKey>(
    name: TKey,
    options?: BarekeyGetOptions,
  ): BarekeyReactValueForKey<TKey>;
  function get<const TKeys extends readonly BarekeyReactAnyKey[]>(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): BarekeyReactValuesForKeys<TKeys>;
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
