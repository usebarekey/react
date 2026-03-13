# @barekey/react

React bindings for Barekey with Suspense-friendly `useBarekey()` reads and a dev-only browser leak guard for private variables.

```tsx
import { PublicBarekeyClient } from "@barekey/sdk/public";
import { BarekeyProvider, useBarekey } from "@barekey/react";
import barekeyConfig from "../barekey.json" with { type: "json" };

const barekeyClient = new PublicBarekeyClient({
  json: barekeyConfig,
});

function App() {
  const env = useBarekey();
  return <div>{env.get("PUBLIC_THEME")}</div>;
}

export function Root() {
  return (
    <BarekeyProvider client={barekeyClient} fallback={null}>
      <App />
    </BarekeyProvider>
  );
}
```
