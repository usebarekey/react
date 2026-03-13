import type { Env, Secret } from "@barekey/sdk";
import { createElement } from "react";

import { BarekeyProvider, type BarekeyReactEnv } from "./index.js";

declare module "@barekey/sdk" {
  interface BarekeyPublicGeneratedTypeMap {
    PUBLIC_THEME: Env<Secret, "light" | "dark", never, "public">;
    PUBLIC_TITLE: Env<Secret, string, never, "public">;
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
createElement(BarekeyProvider, {
  json: {
    organization: "acme",
    project: "web",
    environment: "production",
  },
  fallback: null,
});
createElement(BarekeyProvider, {
  organization: "acme",
  project: "web",
  environment: "production",
  fallback: null,
});

type _knownValueStaysTyped = Assert<
  IsEqual<typeof knownValue, Env<Secret, "light" | "dark", never, "public">>
>;
type _unknownValueFallsBackToUnknown = Assert<IsEqual<typeof unknownValue, unknown>>;
type _tupleValueMapsKnownAndUnknownKeys = Assert<
  IsEqual<
    typeof tupleValue,
    readonly [
      Env<Secret, string, never, "public">,
      Env<Secret, "light" | "dark", never, "public">,
      unknown,
    ]
  >
>;
type _arrayValueFallsBackToTupleInference = Assert<
  IsEqual<typeof arrayValue, readonly [Env<Secret, string, never, "public">, unknown]>
>;

export {};
