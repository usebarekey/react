import {
  PublicBarekeyClient,
  type BarekeyClient,
  type BarekeyGetOptions,
  type BarekeyJsonConfig,
  type BarekeyPublicKey,
  type BarekeyPublicValueForKey,
  type BarekeyPublicValuesForKeys,
  type PublicBarekeyClientOptions,
} from "@barekey/sdk";
import {
  createContext,
  createElement,
  Suspense,
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

type BarekeyProviderScopeProps =
  | {
      json: BarekeyJsonConfig;
      organization?: never;
      project?: never;
      environment?: never;
      requirements?: PublicBarekeyClientOptions["requirements"];
      baseUrl?: string;
    }
  | {
      organization: string;
      project: string;
      environment: string;
      json?: never;
      requirements?: PublicBarekeyClientOptions["requirements"];
      baseUrl?: string;
    };

export type BarekeyProviderProps =
  | {
      client: BarekeyReactClient;
      json?: never;
      organization?: never;
      project?: never;
      environment?: never;
      requirements?: never;
      baseUrl?: never;
      fallback?: ReactNode;
      children?: ReactNode;
    }
  | (BarekeyProviderScopeProps & {
      client?: never;
      fallback?: ReactNode;
      children?: ReactNode;
    });

const BarekeyContext = createContext<BarekeyReactClient | null>(null);

function resolveProviderClient(props: BarekeyProviderProps): BarekeyReactClient {
  if ("client" in props && props.client !== undefined) {
    return props.client;
  }

  if ("json" in props && props.json !== undefined) {
    return new PublicBarekeyClient({
      json: props.json,
      requirements: props.requirements,
      baseUrl: props.baseUrl,
    });
  }

  return new PublicBarekeyClient({
    organization: props.organization,
    project: props.project,
    environment: props.environment,
    requirements: props.requirements,
    baseUrl: props.baseUrl,
  });
}

export function BarekeyProvider(props: BarekeyProviderProps): ReactElement {
  const client = resolveProviderClient(props);
  return createElement(BarekeyContext.Provider, {
    value: client,
    children: createElement(Suspense, {
      fallback: props.fallback ?? null,
      children: props.children,
    }),
  });
}

export function useBarekey(): BarekeyReactEnv {
  const client = useContext(BarekeyContext);
  if (client === null) {
    throw new Error(
      "[barekey/react] useBarekey() must be used within <BarekeyProvider ...>. Wrap this subtree in BarekeyProvider and pass either a configured client or public Barekey scope props.",
    );
  }

  return {
    get(nameOrNames: string | readonly string[], options?: BarekeyGetOptions): unknown {
      if (Array.isArray(nameOrNames)) {
        return readBarekeyValues(client, nameOrNames, options);
      }

      return readBarekeyValue(client, nameOrNames as string, options);
    },
  } as BarekeyReactEnv;
}
