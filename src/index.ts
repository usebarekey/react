import {
  PublicBarekeyClient,
  type BarekeyGetOptions,
  type BarekeyPublicKey,
  type BarekeyPublicValueForKey,
  type BarekeyPublicValuesForKeys,
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
  <TKey extends BarekeyPublicKey>(
    name: TKey,
    options?: BarekeyGetOptions,
  ): BarekeyPublicValueForKey<TKey>;
  <const TKeys extends readonly BarekeyPublicKey[]>(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): BarekeyPublicValuesForKeys<TKeys>;
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

  function get<TKey extends BarekeyPublicKey>(
    name: TKey,
    options?: BarekeyGetOptions,
  ): BarekeyPublicValueForKey<TKey>;
  function get<const TKeys extends readonly BarekeyPublicKey[]>(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): BarekeyPublicValuesForKeys<TKeys>;
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
