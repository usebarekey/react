import {
  PublicBarekeyClient,
  type BarekeyClient,
  type BarekeyGetOptions,
  type BarekeyPublicKey,
  type BarekeyPublicValueForKey,
  type BarekeyPublicValuesForKeys,
} from "@barekey/sdk";
import {
  createContext,
  createElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import { readBarekeyValue, readBarekeyValues } from "./cache.js";

export type BarekeyReactClient = BarekeyClient | PublicBarekeyClient;

export type BarekeyReactEnv = {
  get<TKey extends BarekeyPublicKey>(name: TKey, options?: BarekeyGetOptions): BarekeyPublicValueForKey<TKey>;
  get<const TKeys extends readonly BarekeyPublicKey[]>(
    names: TKeys,
    options?: BarekeyGetOptions,
  ): BarekeyPublicValuesForKeys<TKeys>;
};

export type BarekeyProviderProps = {
  client: BarekeyReactClient;
  children: ReactNode;
};

const BarekeyContext = createContext<BarekeyReactClient | null>(null);
const defaultClient = new PublicBarekeyClient();

export function BarekeyProvider({ client, children }: BarekeyProviderProps): ReactElement {
  return createElement(BarekeyContext.Provider, {
    value: client,
    children,
  });
}

export function useBarekey(): BarekeyReactEnv {
  const client = useContext(BarekeyContext) ?? defaultClient;

  return {
    get(nameOrNames: string | readonly string[], options?: BarekeyGetOptions): unknown {
      if (Array.isArray(nameOrNames)) {
        return readBarekeyValues(client, nameOrNames, options);
      }

      return readBarekeyValue(client, nameOrNames as string, options);
    },
  } as BarekeyReactEnv;
}
