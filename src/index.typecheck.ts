import { PublicBarekeyClient, type Env, type Secret } from "@barekey/sdk/public";
import { createElement } from "react";

import { BarekeyProvider, type BarekeyReactEnv } from "./index.js";

declare module "@barekey/sdk/public" {
  interface BarekeyPublicGeneratedTypeMap {
    PUBLIC_THEME: Env<{
      Mode: Secret;
      Visibility: "public";
      Rollout: never;
      Type: "light" | "dark";
    }>;
    PUBLIC_TITLE: Env<{
      Mode: Secret;
      Visibility: "public";
      Rollout: never;
      Type: string;
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

type _knownValueStaysTyped = Assert<
  IsEqual<
    typeof knownValue,
    Env<{
      Mode: Secret;
      Visibility: "public";
      Rollout: never;
      Type: "light" | "dark";
    }>
  >
>;
type _unknownValueFallsBackToUnknown = Assert<IsEqual<typeof unknownValue, unknown>>;
type _tupleValueMapsKnownAndUnknownKeys = Assert<
  IsEqual<
    typeof tupleValue,
    readonly [
      Env<{
        Mode: Secret;
        Visibility: "public";
        Rollout: never;
        Type: string;
      }>,
      Env<{
        Mode: Secret;
        Visibility: "public";
        Rollout: never;
        Type: "light" | "dark";
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
        Mode: Secret;
        Visibility: "public";
        Rollout: never;
        Type: string;
      }>,
      unknown,
    ]
  >
>;

export {};
