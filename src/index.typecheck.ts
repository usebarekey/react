import { PublicBarekeyClient, type Env } from "@barekey/sdk/public";
import { createElement } from "react";

import { BarekeyProvider, type BarekeyReactEnv, useBarekey } from "./index.js";

declare module "@barekey/sdk/public" {
  interface BarekeyPublicGeneratedTypeMap {
    PUBLIC_THEME: Env<{
      Type: "light" | "dark";
      Kind: "secret";
      Visibility: "public";
      Rollout: never;
    }>;
    PUBLIC_TITLE: Env<{
      Type: string;
      Kind: "secret";
      Visibility: "public";
      Rollout: never;
    }>;
  }
}

type Assert<TValue extends true> = TValue;

type IsEqual<TLeft, TRight> = (<TValue>() => TValue extends TLeft ? 1 : 2) extends <
  TValue,
>() => TValue extends TRight ? 1 : 2
  ? true
  : false;

declare const env: BarekeyReactEnv;

const knownValue = env.get("PUBLIC_THEME");
const unknownValue = env.get("RUNTIME_PUBLIC_KEY");
const tupleValue = env.get(["PUBLIC_TITLE", "PUBLIC_THEME", "RUNTIME_PUBLIC_KEY"] as const);
const arrayValue = env.get(["PUBLIC_TITLE", "RUNTIME_PUBLIC_KEY"]);
declare const client: PublicBarekeyClient;
createElement(BarekeyProvider, {
  client,
  fallback: null,
});
const envFromClient = useBarekey(client);
const knownValueFromClient = envFromClient.get("PUBLIC_THEME");

type _knownValueStaysTyped = Assert<
  IsEqual<
    typeof knownValue,
    Env<{
      Type: "light" | "dark";
      Kind: "secret";
      Visibility: "public";
      Rollout: never;
    }>
  >
>;
type _unknownValueFallsBackToUnknown = Assert<IsEqual<typeof unknownValue, unknown>>;
type _knownValueFromClientStaysTyped = Assert<
  IsEqual<
    typeof knownValueFromClient,
    Env<{
      Type: "light" | "dark";
      Kind: "secret";
      Visibility: "public";
      Rollout: never;
    }>
  >
>;
type _tupleValueMapsKnownAndUnknownKeys = Assert<
  IsEqual<
    typeof tupleValue,
    readonly [
      Env<{
        Type: string;
        Kind: "secret";
        Visibility: "public";
        Rollout: never;
      }>,
      Env<{
        Type: "light" | "dark";
        Kind: "secret";
        Visibility: "public";
        Rollout: never;
      }>,
      unknown,
    ]
  >
>;
type _arrayValueFallsBackToTupleInference = Assert<
  IsEqual<
    typeof arrayValue,
    readonly [
      Env<{
        Type: string;
        Kind: "secret";
        Visibility: "public";
        Rollout: never;
      }>,
      unknown,
    ]
  >
>;

export {};
