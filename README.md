# @barekey/react

React bindings for Barekey with Suspense-friendly `useBarekey()` reads and a dev-only browser leak guard for private variables.

```tsx
import { BarekeyProvider, useBarekey } from "@barekey/react";
import barekeyConfig from "../barekey.json" with { type: "json" };

function App() {
  const env = useBarekey();
  return <div>{env.get("PUBLIC_THEME")}</div>;
}

export function Root() {
  return (
    <BarekeyProvider json={barekeyConfig} fallback={null}>
      <App />
    </BarekeyProvider>
  );
}
```
